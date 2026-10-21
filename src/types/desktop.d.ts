export {};

export interface PdfExportResult {
  saved: boolean;
  canceled?: boolean;
  path?: string;
  error?: string;
}

export interface SavedFileResult {
  saved: boolean;
  canceled?: boolean;
  path?: string;
  error?: string;
}

export interface SaveFilePayload {
  defaultName: string;
  filters: { name: string; extensions: string[] }[];
  data: Uint8Array;
}

export interface DesktopBridge {
  isElectron: true;
  platform: 'darwin' | 'win32' | 'linux' | string;
  versions: {
    electron: string;
    chrome: string;
  };
  exportPdf: () => Promise<PdfExportResult>;
  saveFile: (payload: SaveFilePayload) => Promise<SavedFileResult>;
  checkUpdates: () => Promise<{
    latest: string | null;
    url: string;
    error?: string;
  }>;
  setTheme: (theme: 'light' | 'dark') => Promise<{ ok: boolean }>;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}
