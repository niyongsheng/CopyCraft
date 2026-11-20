'use strict';

/**
 * Electron 主进程的激活管理器：机器 UID、平台影子存储、状态文件路径。
 * 不依赖 electron 模块（userDataDir 由 main.cjs 传入），便于脚本与单测复用。
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const core = require('./license-core.cjs');
const { LicenseStore, createFileShadow } = require('./license-store.cjs');

/** Windows 影子注册表位置（NSIS 卸载默认不清理 HKCU）。 */
const WIN_SHADOW_KEY = 'HKCU\\Software\\CopyCraft\\license';

/** 执行系统命令（超时 / 隐藏窗口 / 失败返回 null）。 */
function tryExec(file, args, options = {}) {
  try {
    return execFileSync(file, args, {
      encoding: 'utf8',
      timeout: 3000,
      windowsHide: true,
      ...options,
    });
  } catch {
    return null;
  }
}

function fallbackUid() {
  let user = '';
  try {
    user = os.userInfo().username;
  } catch {
    user = process.env.USER || process.env.USERNAME || '';
  }
  return `${os.hostname()}|${user}`;
}

/**
 * 跨平台机器 UID：
 * - Windows：注册表 HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid
 * - macOS：ioreg IOPlatformUUID
 * - Linux：/etc/machine-id（或 /var/lib/dbus/machine-id）
 * 获取失败时降级为 `主机名|用户名`。
 */
function getMachineUid(platform = process.platform) {
  if (platform === 'win32') {
    const out = tryExec('reg', [
      'query',
      'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
      '/v',
      'MachineGuid',
    ]);
    const match = out?.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i);
    if (match) return match[1].trim();
  } else if (platform === 'darwin') {
    const out = tryExec('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice']);
    const match = out?.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
    if (match) return match[1];
  } else {
    for (const file of ['/etc/machine-id', '/var/lib/dbus/machine-id']) {
      try {
        const value = fs.readFileSync(file, 'utf8').trim();
        if (value) return value;
      } catch {
        /* try next */
      }
    }
  }
  return fallbackUid();
}

/** `reg query` 数值输出可能是十进制或 0x 十六进制，统一解析为安全整数。 */
function parseRegNumber(text) {
  const value = String(text).trim();
  const parsed = /^0x/i.test(value)
    ? Number.parseInt(value.slice(2), 16)
    : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : NaN;
}

/** Windows 注册表影子存储（读写失败静默）。 */
function createRegistryShadow() {
  return {
    read(fingerprint) {
      const out = tryExec('reg', ['query', WIN_SHADOW_KEY]);
      if (!out) return null;
      const values = {};
      for (const line of out.split(/\r?\n/)) {
        const match = line.match(/^\s*(\S+)\s+REG_\w+\s+(.*)$/);
        if (match) values[match[1]] = match[2].trim();
      }
      const used = parseRegNumber(values.trialUsed);
      const startedAt = parseRegNumber(values.trialStartedAt);
      const sig = values.sig;
      if (
        values.fingerprint !== fingerprint ||
        !Number.isInteger(used) ||
        used < 0 ||
        !Number.isInteger(startedAt) ||
        typeof sig !== 'string'
      ) {
        return null;
      }
      return core.constantTimeEq(sig, core.signShadow(fingerprint, used, startedAt))
        ? { used, startedAt }
        : null;
    },
    write(fingerprint, used, startedAt) {
      const entries = [
        ['fingerprint', fingerprint, 'REG_SZ'],
        ['trialUsed', String(used), 'REG_DWORD'],
        ['trialStartedAt', `0x${startedAt.toString(16)}`, 'REG_QWORD'],
        ['sig', core.signShadow(fingerprint, used, startedAt), 'REG_SZ'],
      ];
      for (const [name, value, type] of entries) {
        const out = tryExec('reg', [
          'add',
          WIN_SHADOW_KEY,
          '/v',
          name,
          '/t',
          type,
          '/d',
          value,
          '/f',
        ]);
        if (out === null) return; // 注册表不可写：静默降级
      }
    },
  };
}

/** 平台影子路径（文件实现）。 */
function defaultShadowPath(platform = process.platform) {
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library/Preferences/com.copycraft.app.license');
  }
  const base =
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, 'copycraft', 'license-shadow.json');
}

/**
 * 创建激活管理器。
 * @param {{
 *   userDataDir: string,
 *   platform?: NodeJS.Platform,
 *   now?: () => number,
 *   machineUid?: string,
 *   shadowPath?: string,
 * }} options
 */
function createLicense({
  userDataDir,
  platform = process.platform,
  now,
  machineUid,
  shadowPath,
} = {}) {
  if (typeof userDataDir !== 'string' || !userDataDir) {
    throw new Error('createLicense 缺少 userDataDir');
  }
  const fingerprint = core.fingerprintOf(machineUid ?? getMachineUid(platform));
  const shadow =
    platform === 'win32'
      ? createRegistryShadow()
      : createFileShadow(shadowPath ?? defaultShadowPath(platform));

  const store = new LicenseStore({
    statePath: path.join(userDataDir, 'license.json'),
    fingerprint,
    readShadow: (fp) => shadow.read(fp),
    writeShadow: (fp, used, startedAt) => shadow.write(fp, used, startedAt),
    now,
  });

  return {
    fingerprint,
    init: () => store.init(),
    status: () => store.status(),
    checkExport: () => store.checkExport(),
    recordExport: () => store.recordExport(),
    /** 前端提交激活码：返回结构化结果，避免 IPC 异常丢失中文原因。 */
    activate(rawCode) {
      try {
        return { ok: true, status: store.activate(rawCode) };
      } catch (error) {
        if (error instanceof core.LicenseError) {
          return { ok: false, code: error.code, error: error.message };
        }
        return {
          ok: false,
          code: 'unknown',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

module.exports = {
  createLicense,
  getMachineUid,
  createRegistryShadow,
  defaultShadowPath,
};
