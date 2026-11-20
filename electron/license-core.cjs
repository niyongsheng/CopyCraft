'use strict';

/**
 * 离线激活的密码学原语：机器指纹、激活码、试用签名、Crockford32。
 *
 * 方案（与 best-load 一致，域前缀改为 copycraft）：
 * - 机器指纹 = Crockford32(SHA-256(machine_uid)) 截 25 字符。
 * - 激活码   = Crockford32(HMAC-SHA256(PRODUCT_SECRET, LIC_DOMAIN || 指纹)) 截 25 字符。
 * - 试用签名 = HMAC 使用独立消息域，防与激活码跨用途重放。
 *
 * `PRODUCT_SECRET` 内嵌于主进程二进制（asar）是离线授权的已知局限：
 * 威慑而非 DRM，防君子不防小人。发布后不要修改，否则已发出的激活码全部失效。
 * 本文件只允许被 Electron 主进程与供应商脚本 require，绝不能进入渲染层。
 */

const crypto = require('node:crypto');

/**
 * 产品密钥。不要把生产密钥提交到仓库。
 * 本地开发：设置 COPYCRAFT_LICENSE_SECRET，或创建未跟踪的 electron/license-secret.cjs。
 * 发布构建：在 CI secret 中注入；公开仓库中的旧密钥应视为已泄露并轮换。
 */
function loadProductSecret() {
  const fromEnv = process.env.COPYCRAFT_LICENSE_SECRET?.trim();
  if (fromEnv) return fromEnv;
  try {
    const local = require('./license-secret.cjs');
    const value = typeof local === 'string' ? local : local?.secret;
    if (typeof value === 'string' && value.trim()) return value.trim();
  } catch {
    /* 本地密钥文件不存在时使用开发密钥 */
  }
  console.warn(
    '[copycraft] COPYCRAFT_LICENSE_SECRET is not configured; using a development-only secret.',
  );
  return 'copycraft-development-only-secret';
}

/** 开发密钥与生产密钥不同；公开仓库中的旧密钥必须轮换。 */
const PRODUCT_SECRET = loadProductSecret();

/** Crockford32 字母表（排除 I/L/O/U 防混淆；归一化时做容错映射）。 */
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 指纹 / 激活码规范串长度（无分隔；Crockford32 每字符 5 bit）。 */
const FINGERPRINT_CHARS = 25;

/** 激活码 HMAC 消息域（v1 = 方案版本号）。 */
const LIC_DOMAIN = Buffer.from('copycraft:lic:v1:', 'utf8');
/** 试用（次数 + 开始时间 + 指纹）签名消息域（v2 = 双限方案）。 */
const TRIAL_DOMAIN = Buffer.from('copycraft:trial:v2:', 'utf8');
/** 影子存储签名消息域（与上两者分离，防跨用途重放）。 */
const SHADOW_DOMAIN = Buffer.from('copycraft:trial-shadow:v2:', 'utf8');

class LicenseError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LicenseError';
    this.code = code;
  }
}

/** HMAC-SHA256(PRODUCT_SECRET, domain || data) → Buffer。 */
function hmacDigest(domain, data) {
  return crypto.createHmac('sha256', PRODUCT_SECRET).update(domain).update(data).digest();
}

/** Crockford32 编码（大写、无填充）。 */
function crockford(bytes) {
  let bits = 0;
  let acc = 0n;
  let out = '';
  for (const byte of bytes) {
    acc = (acc << 8n) | BigInt(byte);
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD_ALPHABET[Number((acc >> BigInt(bits - 5)) & 31n)];
      bits -= 5;
    }
    acc &= (1n << BigInt(bits)) - 1n;
  }
  if (bits > 0) {
    out += CROCKFORD_ALPHABET[Number((acc << BigInt(5 - bits)) & 31n)];
  }
  return out;
}

/**
 * 「HMAC → Crockford32 → 取前 n 字节」的通用令牌构造。
 * 消息域由调用方传入，隔离激活码 / 试用签名 / 影子签名。
 */
function token(domain, data, n) {
  return crockford(hmacDigest(domain, data).subarray(0, n));
}

/** 常数时间比较（长度不同返回 false，不泄露内容）。 */
function constantTimeEq(a, b) {
  const left = Buffer.from(String(a), 'utf8');
  const right = Buffer.from(String(b), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/** 机器指纹：SHA-256(machine_uid) → Crockford32 → 截 25 字符（高 125 bit）。 */
function fingerprintOf(rawUid) {
  const digest = crypto.createHash('sha256').update(String(rawUid), 'utf8').digest();
  return crockford(digest).slice(0, FINGERPRINT_CHARS);
}

/** 激活码：HMAC(secret, LIC_DOMAIN || 指纹) 前 20 字节 → Crockford32 → 截 25 字符。 */
function codeFor(fingerprint) {
  return token(LIC_DOMAIN, Buffer.from(fingerprint, 'utf8'), 20).slice(0, FINGERPRINT_CHARS);
}

/** 试用签名：HMAC(secret, TRIAL_DOMAIN || 指纹|次数|开始时间)。无开始时间签 "none"。 */
function signTrial(fingerprint, used, startedAt) {
  const started = startedAt == null ? 'none' : String(startedAt);
  return token(TRIAL_DOMAIN, Buffer.from(`${fingerprint}|${used}|${started}`, 'utf8'), 10);
}

/** 影子记录签名：独立消息域，同样绑定指纹、次数与开始时间。 */
function signShadow(fingerprint, used, startedAt) {
  const started = startedAt == null ? 'none' : String(startedAt);
  return token(SHADOW_DOMAIN, Buffer.from(`${fingerprint}|${used}|${started}`, 'utf8'), 10);
}

/**
 * 统一归一化：大写 → 去 `-` / 空白 → Crockford 容错映射（O→0、I/L→1、U→V）
 * → 字符集 + 长度校验。客户手抄 / OCR 错字、带横线分组都能容错。
 */
function normalizeToken(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error('不能为空');
  }
  let out = '';
  for (const ch of raw.toUpperCase()) {
    if (ch === '-' || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') continue;
    const mapped = ch === 'O' ? '0' : ch === 'I' || ch === 'L' ? '1' : ch === 'U' ? 'V' : ch;
    if (!CROCKFORD_ALPHABET.includes(mapped)) {
      throw new Error(`包含非法字符 "${ch}"`);
    }
    out += mapped;
  }
  if (out.length !== FINGERPRINT_CHARS) {
    throw new Error(`长度应为 ${FINGERPRINT_CHARS} 个字符`);
  }
  return out;
}

/** 展示格式：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX（复制时仍用无分隔规范串）。 */
function formatGrouped(tokenText) {
  return tokenText.match(/.{1,5}/g)?.join('-') ?? tokenText;
}

module.exports = {
  PRODUCT_SECRET,
  CROCKFORD_ALPHABET,
  FINGERPRINT_CHARS,
  LIC_DOMAIN,
  TRIAL_DOMAIN,
  SHADOW_DOMAIN,
  LicenseError,
  hmacDigest,
  crockford,
  token,
  constantTimeEq,
  fingerprintOf,
  codeFor,
  signTrial,
  signShadow,
  normalizeToken,
  formatGrouped,
};
