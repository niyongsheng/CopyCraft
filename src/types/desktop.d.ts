export {};

export interface PdfExportResult {
  saved: boolean;
  canceled?: boolean;
  path?: string;
  error?: string;
  /** 试用已结束：需要激活后才能继续导出。 */
  needActivation?: boolean;
}

export interface PrintResult {
  printed: boolean;
  canceled?: boolean;
  error?: string;
  /** 试用已结束：需要激活后才能继续打印。 */
  needActivation?: boolean;
}

export interface SavedFileResult {
  saved: boolean;
  canceled?: boolean;
  path?: string;
  error?: string;
  /** 试用已结束：需要激活后才能继续导出。 */
  needActivation?: boolean;
}

/** 激活 / 试用状态（由主进程按机器指纹动态计算）。 */
export interface LicenseStatus {
  activated: boolean;
  /** 机器指纹规范串（无分隔 25 字符；展示层自行加横线分组）。 */
  machineFingerprint: string;
  /** 已用试用次数（成功导出 1 次 +1）。 */
  trialUsed: number;
  /** 试用次数上限。 */
  trialLimit: number;
  /** 试用总天数。 */
  trialDays: number;
  /** 试用开始时间（unix 秒；null = 从未开始——已激活用户不会起算）。 */
  trialStartedAt: number | null;
  /** 试用到期时间（unix 秒；未开始为 null）。 */
  trialExpiresAt: number | null;
}

export interface LicenseStatusResult {
  ok: boolean;
  status: LicenseStatus | null;
  error?: string;
}

export interface LicenseCheckResult {
  allowed: boolean;
  status: LicenseStatus | null;
  reason?: 'exhausted' | 'expired';
  error?: string;
}

export interface LicenseActivateResult {
  ok: boolean;
  status?: LicenseStatus;
  error?: string;
}

export interface SaveFilePayload {
  defaultName: string;
  filters: { name: string; extensions: string[] }[];
  data: Uint8Array;
  /** 导出类型（用于匿名统计，不参与保存逻辑）。 */
  kind?: 'docx';
  /** 导出页数（用于匿名统计）。 */
  pages?: number;
}

/** 匿名统计状态：enabled 为用户偏好，active 表示当前构建是否真正上报。 */
export interface AnalyticsState {
  enabled: boolean;
  active: boolean;
}

export interface DesktopBridge {
  isElectron: true;
  platform: 'darwin' | 'win32' | 'linux' | string;
  versions: {
    electron: string;
    chrome: string;
  };
  exportPdf: () => Promise<PdfExportResult>;
  printSheet: () => Promise<PrintResult>;
  saveFile: (payload: SaveFilePayload) => Promise<SavedFileResult>;
  checkUpdates: () => Promise<{
    latest: string | null;
    url: string;
    error?: string;
  }>;
  setTheme: (theme: 'light' | 'dark') => Promise<{ ok: boolean }>;
  licenseStatus: () => Promise<LicenseStatusResult>;
  licenseCheck: () => Promise<LicenseCheckResult>;
  licenseActivate: (code: string) => Promise<LicenseActivateResult>;
  /** 主进程请求打开设置（菜单「激活…」/ 导出被拦截时）。返回取消订阅函数。 */
  onOpenSettings: (callback: () => void) => () => void;
  /** 导出计数变化等激活状态更新。返回取消订阅函数。 */
  onLicenseChanged: (callback: () => void) => () => void;
  analyticsState: () => Promise<AnalyticsState>;
  setAnalyticsEnabled: (enabled: boolean) => Promise<AnalyticsState>;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}
