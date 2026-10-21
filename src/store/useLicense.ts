import { create } from 'zustand';
import type {
  LicenseActivateResult,
  LicenseCheckResult,
  LicenseStatus,
} from '../types/desktop';

/**
 * 激活状态 store：以 Electron 主进程（机器指纹 + 签名状态文件）为权威，
 * 刻意不 persist 到 localStorage —— 本地存储可被手改，激活判定由主进程每次重算。
 *
 * 网页版没有主进程与机器指纹，保持 status = null 且不拦截导出。
 */
interface LicenseState {
  status: LicenseStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  check: () => Promise<LicenseCheckResult>;
  activate: (code: string) => Promise<LicenseActivateResult>;
}

const DAY_SECS = 86400;

export function isDesktopLicense(): boolean {
  return Boolean(window.desktop?.isElectron);
}

export const useLicense = create<LicenseState>()((set) => ({
  status: null,
  loading: false,
  error: null,

  refresh: async () => {
    const desktop = window.desktop;
    if (!desktop?.isElectron) {
      set({ status: null, loading: false, error: null });
      return;
    }
    set({ loading: true });
    try {
      const result = await desktop.licenseStatus();
      if (result.ok && result.status) {
        set({ status: result.status, error: null });
      } else {
        set({ error: result.error ?? '无法读取激活状态' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  check: async () => {
    const desktop = window.desktop;
    if (!desktop?.isElectron) {
      return { allowed: true, status: null };
    }
    const result = await desktop.licenseCheck();
    if (result.status) set({ status: result.status, error: null });
    return result;
  },

  activate: async (code) => {
    const desktop = window.desktop;
    if (!desktop?.isElectron) {
      return { ok: false, error: '网页版无需激活' };
    }
    const result = await desktop.licenseActivate(code);
    if (result.ok && result.status) {
      set({ status: result.status, error: null });
    }
    return result;
  },
}));

/** 剩余试用次数（未激活时展示用；status 缺失按 0 处理）。 */
export function selectTrialRemainingCount(state: LicenseState): number {
  const status = state.status;
  if (!status || status.activated) return 0;
  return Math.max(status.trialLimit - status.trialUsed, 0);
}

/** 剩余试用天数（未激活且未到期时展示用）。 */
export function selectTrialRemainingDays(state: LicenseState): number {
  const status = state.status;
  if (!status || status.activated) return 0;
  if (status.trialExpiresAt == null) return status.trialDays;
  const left = status.trialExpiresAt - Math.floor(Date.now() / 1000);
  return Math.max(0, Math.ceil(left / DAY_SECS));
}

/** 试用受限（未激活且次数用尽或已过到期时间）→ 前端引导激活。 */
export function selectTrialBlocked(state: LicenseState): boolean {
  if (!isDesktopLicense()) return false;
  const status = state.status;
  if (!status || status.activated) return false;
  return (
    status.trialUsed >= status.trialLimit ||
    (status.trialExpiresAt != null &&
      Math.floor(Date.now() / 1000) >= status.trialExpiresAt)
  );
}
