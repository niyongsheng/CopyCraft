'use strict';

/**
 * 激活状态的持久化与试用判定（不依赖 Electron，便于单测）。
 *
 * 状态文件（应用数据目录 `license.json`）：
 *   { version, machineFingerprint, activationCode, activatedAt,
 *     trialUsed, trialStartedAt, trialSig }
 *
 * - 激活判定不读持久化布尔：每次用当前机器指纹重算激活码并与存储码做常数时间比较，
 *   指纹漂移 / 拷贝状态文件 / 手改激活码都会自动失活。
 * - 试用签名覆盖「指纹|次数|开始时间」；签名不匹配（手改 JSON）→ 试用清零。
 * - 影子存储（系统级位置，卸载器通常不清理）在重装后恢复：
 *   次数取 max（重装不能清空已用次数），开始时间取 min（重装不能推迟到期日）。
 * - 时钟回拨只能延长时间维度，次数的硬上限仍是最终兜底。
 */

const fs = require('node:fs');
const path = require('node:path');

const core = require('./license-core.cjs');

/** 免费试用时长（天）。未激活用户自首次启动起算。 */
const TRIAL_DURATION_DAYS = 14;
/** 免费试用时长（秒）。 */
const TRIAL_DURATION_SECS = TRIAL_DURATION_DAYS * 24 * 60 * 60;
/** 免费试用成功导出上限（成功导出 1 次 +1）。 */
const TRIAL_LIMIT = 30;
/** 状态文件格式版本。 */
const STATE_VERSION = 1;

function unixNow() {
  return Math.floor(Date.now() / 1000);
}

function blankState(fingerprint) {
  return {
    version: STATE_VERSION,
    machineFingerprint: fingerprint,
    activationCode: null,
    activatedAt: null,
    trialUsed: 0,
    trialStartedAt: null,
    trialSig: core.signTrial(fingerprint, 0, null),
  };
}

function isValidState(state) {
  return (
    state !== null &&
    typeof state === 'object' &&
    typeof state.machineFingerprint === 'string' &&
    (state.activationCode == null || typeof state.activationCode === 'string') &&
    (state.activatedAt == null || Number.isInteger(state.activatedAt)) &&
    Number.isInteger(state.trialUsed) &&
    state.trialUsed >= 0 &&
    (state.trialStartedAt == null || Number.isInteger(state.trialStartedAt)) &&
    typeof state.trialSig === 'string'
  );
}

function isActivated(state, fingerprint) {
  return (
    typeof state.activationCode === 'string' &&
    core.constantTimeEq(state.activationCode, core.codeFor(fingerprint))
  );
}

function trialSignatureValid(state, fingerprint) {
  return core.constantTimeEq(
    state.trialSig,
    core.signTrial(fingerprint, state.trialUsed, state.trialStartedAt),
  );
}

/**
 * 文件影子存储（macOS / Linux；Windows 用注册表）。
 * 记录 = `{ fingerprint, trialUsed, trialStartedAt, sig }`；
 * 签名无效或指纹不符 → 视为无记录（降级为纯状态文件计数）。
 */
function createFileShadow(shadowPath) {
  return {
    read(fingerprint) {
      try {
        const record = JSON.parse(fs.readFileSync(shadowPath, 'utf8'));
        if (
          record === null ||
          typeof record !== 'object' ||
          record.fingerprint !== fingerprint ||
          !Number.isInteger(record.trialUsed) ||
          record.trialUsed < 0 ||
          !Number.isInteger(record.trialStartedAt) ||
          typeof record.sig !== 'string'
        ) {
          return null;
        }
        const expected = core.signShadow(
          fingerprint,
          record.trialUsed,
          record.trialStartedAt,
        );
        return core.constantTimeEq(record.sig, expected)
          ? { used: record.trialUsed, startedAt: record.trialStartedAt }
          : null;
      } catch {
        return null;
      }
    },
    write(fingerprint, used, startedAt) {
      try {
        fs.mkdirSync(path.dirname(shadowPath), { recursive: true });
        const record = {
          version: STATE_VERSION,
          fingerprint,
          trialUsed: used,
          trialStartedAt: startedAt,
          sig: core.signShadow(fingerprint, used, startedAt),
        };
        fs.writeFileSync(shadowPath, JSON.stringify(record), { mode: 0o600 });
      } catch {
        /* 影子写入失败静默：状态文件仍是会话内底账 */
      }
    },
  };
}

class LicenseStore {
  constructor({ statePath, fingerprint, readShadow, writeShadow, now } = {}) {
    if (typeof statePath !== 'string' || !statePath) {
      throw new Error('LicenseStore 缺少 statePath');
    }
    if (typeof fingerprint !== 'string' || !fingerprint) {
      throw new Error('LicenseStore 缺少 fingerprint');
    }
    this.statePath = statePath;
    this.fingerprint = fingerprint;
    this.readShadow = typeof readShadow === 'function' ? readShadow : () => null;
    this.writeShadow = typeof writeShadow === 'function' ? writeShadow : () => {};
    this.now = typeof now === 'function' ? now : unixNow;
  }

  /** 服务启动：对齐指纹 → 验签 → 与影子合并 → 未激活用户首次起算试用（幂等）。 */
  init() {
    const state = this._reconcile();
    if (!isActivated(state, this.fingerprint) && state.trialStartedAt == null) {
      state.trialStartedAt = this.now();
      state.trialSig = core.signTrial(
        this.fingerprint,
        state.trialUsed,
        state.trialStartedAt,
      );
      this._writeState(state);
    }
    // 影子可能被删除；启动时用状态文件重建，避免丢一次软门禁加固层。
    this._writeShadow(state);
    return this._statusOf(state);
  }

  /** 当前激活 / 试用状态（读时同样做篡改检测与影子合并）。 */
  status() {
    return this._statusOf(this._reconcile());
  }

  /**
   * 激活：归一化 → 重算 → 常数时间比较 → 落库。
   * @throws {core.LicenseError} code = invalid_format | invalid_code
   */
  activate(rawCode) {
    const state = this._reconcile();
    let code;
    try {
      code = core.normalizeToken(rawCode);
    } catch (error) {
      throw new core.LicenseError(
        'invalid_format',
        `激活码格式不正确：${error.message}`,
      );
    }
    if (!core.constantTimeEq(code, core.codeFor(this.fingerprint))) {
      throw new core.LicenseError('invalid_code', '激活码无效，请核对后重试');
    }
    state.activationCode = code;
    state.activatedAt = this.now();
    this._writeState(state);
    return this._statusOf(state);
  }

  /**
   * 导出前门禁（无副作用）：已激活放行；未激活且次数 / 时长都未触底放行；
   * 任一触底 → 拒绝。`status` 始终返回给前端做展示与就地刷新。
   */
  checkExport() {
    const state = this._ensureTrialStarted(this._reconcile());
    const status = this._statusOf(state);
    if (status.activated) {
      return { allowed: true, status };
    }
    if (state.trialUsed >= TRIAL_LIMIT) {
      return { allowed: false, reason: 'exhausted', status };
    }
    if (
      state.trialStartedAt != null &&
      this.now() >= state.trialStartedAt + TRIAL_DURATION_SECS
    ) {
      return { allowed: false, reason: 'expired', status };
    }
    return { allowed: true, status };
  }

  /**
   * 成功导出后计数：已激活不计数；未激活且未达上限时 +1，并同步状态文件与影子。
   * 达到上限后再完成导出不计数（门禁在前，正常路径不会走到）。
   */
  recordExport() {
    const state = this._ensureTrialStarted(this._reconcile());
    if (isActivated(state, this.fingerprint) || state.trialUsed >= TRIAL_LIMIT) {
      return { recorded: false, status: this._statusOf(state) };
    }
    state.trialUsed += 1;
    state.trialSig = core.signTrial(
      this.fingerprint,
      state.trialUsed,
      state.trialStartedAt,
    );
    this._writeState(state);
    this._writeShadow(state);
    return { recorded: true, status: this._statusOf(state) };
  }

  // ---------- 内部：读取 / 校验 / 合并 ----------

  /** 读取状态；缺失或结构损坏 → 全新状态（影子会在下一步兜底）。 */
  _readState() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
      return isValidState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  _writeState(state) {
    const dir = path.dirname(this.statePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${this.statePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.statePath);
  }

  _writeShadow(state) {
    if (state.trialStartedAt == null) return;
    this.writeShadow(this.fingerprint, state.trialUsed, state.trialStartedAt);
  }

  /**
   * 对账：指纹漂移（换机 / 整库拷贝）→ 清激活 + 重置试用；
   * 试用签名不匹配（手改状态文件）→ 只用影子恢复可信数据；
   * 影子存在时次数取 max、开始时间取 min，并回写状态文件保持两侧一致。
   */
  _reconcile() {
    let state = this._readState();
    let dirty = false;
    if (state === null) {
      state = blankState(this.fingerprint);
      dirty = true;
    } else if (state.machineFingerprint !== this.fingerprint) {
      // 指纹已变：存储的激活码与试用记录都不再属于本机。
      state = blankState(this.fingerprint);
      dirty = true;
    } else if (!trialSignatureValid(state, this.fingerprint)) {
      // 签名失效 = 状态文件被手改：丢弃次数与开始时间，交给影子恢复。
      state.trialUsed = 0;
      state.trialStartedAt = null;
      state.trialSig = core.signTrial(this.fingerprint, 0, null);
      dirty = true;
    }

    const shadow = this.readShadow(this.fingerprint);
    if (shadow) {
      const used = Math.max(state.trialUsed, shadow.used);
      let startedAt = state.trialStartedAt;
      if (startedAt == null || shadow.startedAt < startedAt) {
        startedAt = shadow.startedAt;
      }
      if (used !== state.trialUsed || startedAt !== state.trialStartedAt) {
        state.trialUsed = used;
        state.trialStartedAt = startedAt;
        state.trialSig = core.signTrial(this.fingerprint, used, startedAt);
        dirty = true;
      }
    }

    if (dirty) this._writeState(state);
    return state;
  }

  /** 防御：运行中被删状态文件等导致开始时间缺失，当场起算并同步影子。 */
  _ensureTrialStarted(state) {
    if (!isActivated(state, this.fingerprint) && state.trialStartedAt == null) {
      state.trialStartedAt = this.now();
      state.trialSig = core.signTrial(
        this.fingerprint,
        state.trialUsed,
        state.trialStartedAt,
      );
      this._writeState(state);
      this._writeShadow(state);
    }
    return state;
  }

  _statusOf(state) {
    const activated = isActivated(state, this.fingerprint);
    return {
      activated,
      machineFingerprint: this.fingerprint,
      trialUsed: state.trialUsed,
      trialLimit: TRIAL_LIMIT,
      trialDays: TRIAL_DURATION_DAYS,
      trialStartedAt: state.trialStartedAt,
      trialExpiresAt:
        state.trialStartedAt == null
          ? null
          : state.trialStartedAt + TRIAL_DURATION_SECS,
    };
  }
}

module.exports = {
  LicenseStore,
  createFileShadow,
  TRIAL_DURATION_DAYS,
  TRIAL_DURATION_SECS,
  TRIAL_LIMIT,
  STATE_VERSION,
};
