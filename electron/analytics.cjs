'use strict';

/**
 * 匿名使用统计（Aptabase）。
 *
 * - 仅在打包后的桌面版上报；`npm run dev:desktop` / `electron .` 等开发运行不发送。
 * - 用户可在「设置 → 隐私」关闭；偏好写入 userData/analytics.json，主进程统一把关。
 * - 只上报事件名、版本、平台、导出结果等，不包含字帖内容、姓名、机器指纹或激活码。
 * - Aptabase SDK 本身不自动采集事件，只有显式 trackEvent 才会发送。
 * - `initialize` 必须在 app ready 之前调用（SDK 的硬性要求），本模块在 main 顶部创建。
 */

const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');
const { initialize, trackEvent } = require('@aptabase/electron/main');

/** Aptabase App Key（公开标识，不是密钥）。 */
const APP_KEY = 'A-US-3310853956';

/** 读取偏好；文件缺失或损坏时默认开启。 */
function readPreference(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed?.enabled !== false;
  } catch {
    return true;
  }
}

/** 写入偏好（失败静默，只影响下次启动的默认值）。 */
function writePreference(file, enabled) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ enabled }, null, 2), { mode: 0o600 });
  } catch (error) {
    console.error('[copycraft] failed to save analytics preference:', error);
  }
}

/**
 * 创建统计管理器。
 * `enabled` = 用户偏好；`active` = 偏好开启且当前是打包版本（开发环境不上报）。
 */
function createAnalytics({
  userDataDir,
  appKey = process.env.COPYCRAFT_APTABASE_KEY || APP_KEY,
  host = process.env.COPYCRAFT_APTABASE_HOST,
  isPackaged = app.isPackaged,
} = {}) {
  const preferencePath = path.join(userDataDir, 'analytics.json');
  let enabled = readPreference(preferencePath);

  return {
    /** 必须在 app ready 之前调用一次。 */
    init() {
      try {
        // host 仅配合自托管（A-SH-*）Key 使用，供本地联调。
        void initialize(appKey, host ? { host } : undefined).catch((error) => {
          console.error('[copycraft] failed to initialize analytics:', error);
        });
      } catch (error) {
        console.error('[copycraft] failed to initialize analytics:', error);
      }
    },

    /** 上报事件；props 仅允许字符串 / 数字。 */
    track(event, props) {
      if (!enabled || !isPackaged) return;
      try {
        void trackEvent(event, props);
      } catch (error) {
        console.error(`[copycraft] failed to track "${event}":`, error);
      }
    },

    getState() {
      return { enabled, active: enabled && isPackaged };
    },

    setEnabled(value) {
      enabled = Boolean(value);
      writePreference(preferencePath, enabled);
      return { enabled, active: enabled && isPackaged };
    },
  };
}

module.exports = { createAnalytics, APP_KEY };
