import { trackEvent } from '@aptabase/electron/renderer';
import type { AnalyticsState } from '../types/desktop';
import { isDesktop } from './platform';
import { APP_VERSION } from './version';

/**
 * 匿名统计封装。
 *
 * - 桌面版：主进程是唯一权威，是否真正上报由 `analyticsState().active` 决定
 *   （用户偏好开启 + 打包版本），开发运行不会发送。
 * - 网页版：只上报打印和下载事件，不发送任何其他业务事件；
 *   偏好保存在 localStorage，开发运行不会上报。
 * - 事件属性只允许字符串 / 数字，绝不能包含字帖内容、姓名、指纹或激活码。
 */
type EventProps = Record<string, string | number>;

/** Aptabase App Key（公开标识，不是密钥），与桌面版共用。 */
const APP_KEY = 'A-US-3310853956';
const WEB_PREF_KEY = 'copycraft:analytics';
/** 网页版允许上报的事件白名单。 */
const WEB_EVENTS = new Set(['print', 'export']);

let ready = false;
let active = false;
let webInitialized = false;
let webTrackEvent:
  | ((eventName: string, props?: Record<string, string | number | boolean>) => Promise<void>)
  | null = null;

function readWebPreference(): boolean {
  try {
    return localStorage.getItem(WEB_PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

async function initWebAnalytics(): Promise<AnalyticsState> {
  const enabled = readWebPreference();
  ready = true;
  active = enabled && import.meta.env.PROD;
  if (!active) return { enabled, active: false };

  try {
    const mod = await import('@aptabase/web');
    if (!webInitialized) {
      mod.init(APP_KEY, { appVersion: APP_VERSION, isDebug: false });
      webTrackEvent = mod.trackEvent;
      webInitialized = true;
    }
  } catch {
    active = false;
    webTrackEvent = null;
  }
  return { enabled, active };
}

export async function initAnalytics(): Promise<AnalyticsState> {
  if (!isDesktop()) return initWebAnalytics();

  try {
    const state = await window.desktop?.analyticsState();
    applyAnalyticsState(state);
    return state ?? { enabled: false, active: false };
  } catch {
    ready = true;
    active = false;
    return { enabled: false, active: false };
  }
}

/** 设置页切换后同步渲染层状态（避免每次事件都走 IPC）。 */
export function applyAnalyticsState(state: AnalyticsState | null | undefined): void {
  active = Boolean(state?.active);
  ready = true;
}

/** 网页版设置页读取当前偏好。 */
export function getWebAnalyticsState(): AnalyticsState {
  const enabled = readWebPreference();
  return { enabled, active: enabled && import.meta.env.PROD };
}

/** 网页版设置页切换；开启时补发一次 web_open（如果尚未上报过）。 */
export async function setWebAnalyticsEnabled(enabled: boolean): Promise<AnalyticsState> {
  try {
    localStorage.setItem(WEB_PREF_KEY, enabled ? 'on' : 'off');
  } catch {
    /* ignore storage errors */
  }
  if (!enabled) {
    ready = true;
    active = false;
    return { enabled: false, active: false };
  }
  return initWebAnalytics();
}

export function track(event: string, props?: EventProps): void {
  if (!ready || !active) return;

  if (!isDesktop()) {
    // 网页版只统计打印和下载，其他事件一律丢弃。
    if (!WEB_EVENTS.has(event) || !webTrackEvent) return;
    void webTrackEvent(event, props).catch(() => {
      /* 统计失败不能影响主流程 */
    });
    return;
  }

  void trackEvent(event, props).catch(() => {
    /* 统计失败不能影响主流程 */
  });
}
