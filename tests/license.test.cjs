'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const core = require('../electron/license-core.cjs');
const {
  LicenseStore,
  createFileShadow,
  TRIAL_DURATION_SECS,
  TRIAL_LIMIT,
} = require('../electron/license-store.cjs');

/** 固定测试指纹（25 个合法 Crockford 字符），不触碰真实机器 UID。 */
const TEST_FP = '0123456789ABCDEFGHJKMNPQR';
const OTHER_FP = core.fingerprintOf('other-machine');
const T0 = 1_700_000_000;
const DAY = 86_400;

function makeEnv({ fingerprint = TEST_FP, now = T0, withShadow = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'copycraft-license-test-'));
  const statePath = path.join(dir, 'license.json');
  const shadowPath = path.join(dir, 'shadow.json');
  const shadow = createFileShadow(shadowPath);
  let clock = now;

  const build = (fp) =>
    new LicenseStore({
      statePath,
      fingerprint: fp,
      readShadow: withShadow ? (value) => shadow.read(value) : () => null,
      writeShadow: withShadow
        ? (value, used, startedAt) => shadow.write(value, used, startedAt)
        : () => {},
      now: () => clock,
    });

  return {
    dir,
    statePath,
    shadowPath,
    store: build(fingerprint),
    setNow: (value) => {
      clock = value;
    },
    advance: (seconds) => {
      clock += seconds;
    },
    reopen: (fp = fingerprint) => build(fp),
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

test('指纹与激活码定长、确定性且区分机器', () => {
  const fp = core.fingerprintOf('machine-a');
  assert.equal(fp.length, 25);
  assert.equal(fp, core.fingerprintOf('machine-a'));
  assert.notEqual(fp, core.fingerprintOf('machine-b'));
  assert.match(fp, /^[0-9A-HJKMNP-TV-Z]{25}$/);

  const code = core.codeFor(fp);
  assert.equal(code.length, 25);
  assert.equal(code, core.codeFor(fp));
  assert.notEqual(code, core.codeFor(core.fingerprintOf('machine-b')));
});

test('归一化容错错字、大小写与分组', () => {
  assert.equal(core.normalizeToken('O'.repeat(25)), '0'.repeat(25));
  assert.equal(core.normalizeToken('I'.repeat(25)), '1'.repeat(25));
  assert.equal(core.normalizeToken('L'.repeat(25)), '1'.repeat(25));
  assert.equal(core.normalizeToken('U'.repeat(25)), 'V'.repeat(25));

  const fp = core.fingerprintOf('machine-x');
  assert.equal(core.normalizeToken(core.formatGrouped(fp).toLowerCase()), fp);

  assert.throws(() => core.normalizeToken('@'.repeat(25)), /非法字符/);
  assert.throws(() => core.normalizeToken('12345'), /长度/);
  assert.throws(() => core.normalizeToken(''), /不能为空/);
});

test('常数时间比较', () => {
  assert.equal(core.constantTimeEq('ABC', 'ABC'), true);
  assert.equal(core.constantTimeEq('ABC', 'ABD'), false);
  assert.equal(core.constantTimeEq('ABC', 'AB'), false);
});

test('首次 init 起算 14 天试用且幂等', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);

  env.store.init();
  let status = env.store.status();
  assert.equal(status.activated, false);
  assert.equal(status.trialUsed, 0);
  assert.equal(status.trialLimit, TRIAL_LIMIT);
  assert.equal(status.trialStartedAt, T0);
  assert.equal(status.trialExpiresAt, T0 + TRIAL_DURATION_SECS);

  env.advance(3 * DAY);
  env.store.init();
  status = env.store.status();
  assert.equal(status.trialStartedAt, T0, '二次启动不覆盖开始时间');
});

test('成功导出计数、持久化并可继续导出', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);
  env.store.init();

  const result = env.store.recordExport();
  assert.equal(result.recorded, true);
  assert.equal(result.status.trialUsed, 1);
  assert.equal(env.store.checkExport().allowed, true);

  const reopened = env.reopen();
  reopened.init();
  assert.equal(reopened.status().trialUsed, 1);
});

test('达到 30 次上限后拒绝导出且不再计数', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);
  env.store.init();

  for (let i = 1; i <= TRIAL_LIMIT; i += 1) {
    const result = env.store.recordExport();
    assert.equal(result.recorded, true);
    assert.equal(result.status.trialUsed, i);
  }

  const check = env.store.checkExport();
  assert.equal(check.allowed, false);
  assert.equal(check.reason, 'exhausted');
  assert.equal(env.store.status().trialUsed, TRIAL_LIMIT);

  const extra = env.store.recordExport();
  assert.equal(extra.recorded, false);
  assert.equal(extra.status.trialUsed, TRIAL_LIMIT);
});

test('满 14 天后拒绝导出（边界为 >= 到期时间）', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);
  env.store.init();

  env.setNow(T0 + TRIAL_DURATION_SECS - 1);
  assert.equal(env.store.checkExport().allowed, true);

  env.setNow(T0 + TRIAL_DURATION_SECS);
  const check = env.store.checkExport();
  assert.equal(check.allowed, false);
  assert.equal(check.reason, 'expired');
});

test('激活码激活后无限导出且计数不变', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);
  env.store.init();

  const code = core.formatGrouped(core.codeFor(TEST_FP)).toLowerCase();
  const activated = env.store.activate(code);
  assert.equal(activated.activated, true);

  assert.equal(env.store.checkExport().allowed, true);
  const recorded = env.store.recordExport();
  assert.equal(recorded.recorded, false);
  assert.equal(recorded.status.trialUsed, 0);

  const reopened = env.reopen();
  reopened.init();
  assert.equal(reopened.status().activated, true);
});

test('错误激活码与格式错误被拒绝', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);
  env.store.init();

  assert.throws(
    () => env.store.activate(core.codeFor(OTHER_FP)),
    (error) => error.code === 'invalid_code',
  );
  assert.throws(
    () => env.store.activate('abc'),
    (error) => error.code === 'invalid_format',
  );
  assert.equal(env.store.status().activated, false);
});

test('指纹漂移清空激活与试用（换机 / 整库拷贝）', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);
  env.store.init();
  env.store.recordExport();
  env.store.activate(core.codeFor(TEST_FP));

  const other = env.reopen(OTHER_FP);
  other.init();
  const status = other.status();
  assert.equal(status.activated, false);
  assert.equal(status.trialUsed, 0);
  assert.equal(status.trialStartedAt, T0);
  assert.equal(status.machineFingerprint, OTHER_FP);
});

test('手改状态文件中的次数会因签名失效而重置（无影子时）', (t) => {
  const env = makeEnv({ withShadow: false });
  t.after(env.cleanup);
  env.store.init();
  env.store.recordExport();
  env.store.recordExport();

  const state = JSON.parse(fs.readFileSync(env.statePath, 'utf8'));
  state.trialUsed = 9;
  fs.writeFileSync(env.statePath, JSON.stringify(state));

  const reopened = env.reopen();
  reopened.init();
  const status = reopened.status();
  assert.equal(status.trialUsed, 0);
  assert.equal(status.trialStartedAt, T0, '重置后重新起算');
});

test('删除状态文件后由影子恢复次数与开始时间', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);
  env.store.init();
  for (let i = 0; i < 5; i += 1) env.store.recordExport();

  fs.rmSync(env.statePath); // 模拟卸载重装清掉应用数据
  env.advance(2 * DAY);

  const reinstalled = env.reopen();
  reinstalled.init();
  const status = reinstalled.status();
  assert.equal(status.trialUsed, 5, '重装不能重置已用次数');
  assert.equal(status.trialStartedAt, T0, '重装不能推迟到期日');

  assert.equal(reinstalled.recordExport().status.trialUsed, 6);
});

test('手改影子记录会被签名校验拒绝', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);
  env.store.init();
  env.store.recordExport();

  const record = JSON.parse(fs.readFileSync(env.shadowPath, 'utf8'));
  record.trialUsed = 0;
  fs.writeFileSync(env.shadowPath, JSON.stringify(record));

  fs.rmSync(env.statePath);
  env.advance(DAY);
  const reinstalled = env.reopen();
  reinstalled.init();

  const status = reinstalled.status();
  assert.equal(status.trialUsed, 0, '失效影子视为无记录');
  assert.equal(status.trialStartedAt, T0 + DAY, '按首次启动重新起算');
});

test('影子与状态合并：次数取 max、开始时间取 min', (t) => {
  const env = makeEnv();
  t.after(env.cleanup);
  env.store.init();
  for (let i = 0; i < 4; i += 1) env.store.recordExport();

  // 伪造一份签名有效但更宽松的状态文件（次数更少、开始更晚）。
  const forged = {
    version: 1,
    machineFingerprint: TEST_FP,
    activationCode: null,
    activatedAt: null,
    trialUsed: 1,
    trialStartedAt: T0 + 100,
    trialSig: core.signTrial(TEST_FP, 1, T0 + 100),
  };
  fs.writeFileSync(env.statePath, JSON.stringify(forged));

  const status = env.store.status();
  assert.equal(status.trialUsed, 4);
  assert.equal(status.trialStartedAt, T0);
});

test('文件影子读写往返与指纹隔离', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'copycraft-shadow-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const shadow = createFileShadow(path.join(dir, 'shadow.json'));

  assert.equal(shadow.read(TEST_FP), null);
  shadow.write(TEST_FP, 3, T0);
  assert.deepEqual(shadow.read(TEST_FP), { used: 3, startedAt: T0 });
  assert.equal(shadow.read(OTHER_FP), null);
});
