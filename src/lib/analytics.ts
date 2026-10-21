import { trackEvent } from '@aptabase/electron/renderer';
import type { AnalyticsState } from '../types/desktop';

/**
 * 渲染层匿名统计封装。
 *
 * - 主进程是唯一权威：是否真正上报由 `analyticsState().active` 决定
 *   （用户偏好开启 + 打包版本），开发运行不会发送。
 * - 偏好加载完成前丢弃事件，避免用户已关闭统计却抢先上报。
 * - 网页版没有桌面桥，直接禁用。
 * - 事件属性只允许字符串 / 数字，绝不能包含字帖内容、姓名、指纹或激活码。
 */
type EventProps = Record<string, string | number>;

let ready = false;
let active = false;

export async function initAnalytics(): Promise<AnalyticsState> {
  const desktop = window.desktop;
  if (!desktop?.isElectron) {
    ready = true;
    active = false;
    return { enabled: false, active: false };
  }
  try {
    const state = await desktop.analyticsState();
    applyAnalyticsState(state);
    return state;
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

export function track(event: string, props?: EventProps): void {
  if (!ready || !active || !window.desktop?.isElectron) return;
  void trackEvent(event, props).catch(() => {
    /* 统计失败不能影响主流程 */
  });
}
