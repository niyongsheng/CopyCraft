#!/usr/bin/env node
'use strict';

/**
 * 供应商工具：由机器指纹离线生成激活码。
 *
 * 用法：
 *   node scripts/gen-license.cjs <机器指纹>
 *   node scripts/gen-license.cjs --local   # 打印本机指纹并生成激活码（自测）
 *
 * 流程：客户在「设置 → 激活」复制机器指纹发来 → 本地运行本脚本 → 回发激活码。
 * 激活码永久有效且仅对输入指纹对应的机器有效。
 */

const core = require('../electron/license-core.cjs');

function usage() {
  console.error('用法: node scripts/gen-license.cjs <机器指纹>');
  console.error('      node scripts/gen-license.cjs --local');
  process.exit(1);
}

function printFor(fingerprint) {
  const code = core.codeFor(fingerprint);
  console.log(`指纹:   ${core.formatGrouped(fingerprint)}`);
  console.log(`激活码: ${core.formatGrouped(code)}`);
  console.log(`\n规范串（无分隔，可直接粘贴）: ${code}`);
}

const arg = process.argv[2];
if (!arg) usage();

try {
  if (arg === '--local') {
    const { getMachineUid } = require('../electron/license.cjs');
    const fingerprint = core.fingerprintOf(getMachineUid());
    printFor(fingerprint);
  } else {
    const fingerprint = core.normalizeToken(arg);
    printFor(fingerprint);
  }
} catch (error) {
  console.error(`生成失败：${error.message}`);
  process.exit(1);
}
