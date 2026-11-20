'use strict';

const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  shell,
  screen,
  nativeTheme,
  net,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const { createLicense } = require('./license.cjs');
const { createAnalytics } = require('./analytics.cjs');
const { setLanguage, t } = require('./i18n.cjs');

const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const DEV_URL = process.env.VITE_DEV_SERVER_URL || '';
const ROOT = path.join(__dirname, '..');
const ICON = path.join(ROOT, 'build', 'icon.png');

app.setName('Copycraft 字帖工坊');
if (isWin) app.setAppUserModelId('com.copycraft.app');

// Aptabase 要求 initialize 在 app ready 之前调用；此处只注册，不会自动上报事件。
let analytics = null;
try {
  analytics = createAnalytics({ userDataDir: app.getPath('userData') });
  analytics.init();
} catch (error) {
  console.error('[copycraft] failed to create analytics:', error);
}

let mainWindow = null;
let exportInProgress = false;
let licenseManager = null;

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function notifyLicenseChanged(win) {
  if (win && !win.isDestroyed()) win.webContents.send('license-changed');
}

/** 导出前门禁：返回 null 表示放行，否则返回可直接回传前端的失败结果。 */
function exportGate(format) {
  if (!licenseManager) {
    analytics?.track('export', { format, result: 'blocked', reason: 'license_unavailable' });
    return { saved: false, error: t('error.licenseUnavailable') };
  }
  try {
    const gate = licenseManager.checkExport();
    if (gate.allowed) return null;
    analytics?.track('export', {
      format,
      result: 'blocked',
      reason: gate.reason ?? 'unknown',
    });
    return {
      saved: false,
      needActivation: true,
      error: t('msg.trialBlocked'),
    };
  } catch (error) {
    analytics?.track('export', { format, result: 'failed', stage: 'license' });
    return {
      saved: false,
      error: t('error.licenseReadFailed', { error: errorMessage(error) }),
    };
  }
}

/** 导出成功后计数（失败只记日志，不影响已完成导出的结果）。 */
function recordExport(win) {
  try {
    licenseManager?.recordExport();
    notifyLicenseChanged(win);
  } catch (error) {
    console.error('[copycraft] failed to record export usage:', error);
  }
}

const UPDATE_REPO = 'niyongsheng/Copycraft';
const RELEASES_URL = `https://github.com/${UPDATE_REPO}/releases`;

const THEME_COLORS = {
  dark: { background: '#0b0e15', titlebar: '#0f141e', symbol: '#f2f5fa' },
  light: { background: '#eef1f6', titlebar: '#f7f9fc', symbol: '#1f2937' },
};

function themeFile() {
  return path.join(app.getPath('userData'), 'theme.json');
}

function loadTheme() {
  try {
    const data = JSON.parse(fs.readFileSync(themeFile(), 'utf8'));
    return data?.theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function saveTheme(theme) {
  try {
    fs.writeFileSync(themeFile(), JSON.stringify({ theme }));
  } catch {
    /* ignore theme write errors */
  }
}

function applyTheme(theme, win) {
  const mode = theme === 'light' ? 'light' : 'dark';
  const colors = THEME_COLORS[mode];
  nativeTheme.themeSource = mode;
  if (!win || win.isDestroyed()) return;
  win.setBackgroundColor(colors.background);
  if (isWin && typeof win.setTitleBarOverlay === 'function') {
    win.setTitleBarOverlay({
      color: colors.titlebar,
      symbolColor: colors.symbol,
      height: 50,
    });
  }
}

function windowStateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  try {
    const state = JSON.parse(fs.readFileSync(windowStateFile(), 'utf8'));
    if (typeof state !== 'object' || state === null) return {};
    return state;
  } catch {
    return {};
  }
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  try {
    const bounds = win.getNormalBounds();
    fs.writeFileSync(
      windowStateFile(),
      JSON.stringify({ ...bounds, maximized: win.isMaximized() }),
    );
  } catch {
    /* ignore state write errors */
  }
}

function ensureVisible(state) {
  if (typeof state.x !== 'number' || typeof state.y !== 'number') return state;
  const visible = screen.getAllDisplays().some(({ workArea }) => {
    return (
      state.x < workArea.x + workArea.width - 100 &&
      state.x + (state.width ?? 0) > workArea.x + 100 &&
      state.y < workArea.y + workArea.height - 80 &&
      state.y + (state.height ?? 0) > workArea.y + 60
    );
  });
  if (!visible) {
    delete state.x;
    delete state.y;
  }
  return state;
}

function createWindow(state = {}) {
  const theme = loadTheme();
  nativeTheme.themeSource = theme;
  const colors = THEME_COLORS[theme];

  const win = new BrowserWindow({
    width: Math.max(900, Number(state.width) || 1440),
    height: Math.max(640, Number(state.height) || 960),
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 640,
    show: false,
    backgroundColor: colors.background,
    title: t('app.name'),
    icon: ICON,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 16, y: 18 } }
      : {
          titleBarOverlay: {
            color: colors.titlebar,
            symbolColor: colors.symbol,
            height: 50,
          },
        }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
    if (state.maximized) win.maximize();
  });

  win.on('close', () => saveWindowState(win));

  const isExternalUrl = (url) =>
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:');

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return;
    if (DEV_URL && url.startsWith(DEV_URL)) return;
    event.preventDefault();
    if (isExternalUrl(url)) {
      void shell.openExternal(url);
    }
  });

  win.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`[copycraft] failed to load ${url}: ${code} ${description}`);
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[copycraft] renderer process gone:', details);
  });

  if (DEV_URL) {
    void win.loadURL(DEV_URL);
    if (process.env.ELECTRON_DEVTOOLS === '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    void win.loadFile(path.join(ROOT, 'dist', 'index.html'));
  }

  return win;
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

async function exportPdf(win) {
  if (!win || win.isDestroyed()) {
    return { saved: false, error: t('error.windowUnavailable') };
  }
  if (exportInProgress) {
    return { saved: false, error: t('error.exportInProgress') };
  }

  exportInProgress = true;
  try {
    // 笔顺查询等非字帖视图没有可打印内容，避免导出空白 PDF。
    const hasSheet = await win.webContents.executeJavaScript(
      "Boolean(document.querySelector('.sheet-page'))",
    );
    if (!hasSheet) {
      return { saved: false, error: t('error.noSheetPdf') };
    }

    const blocked = exportGate('pdf');
    if (blocked) return blocked;

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: t('dialog.exportPdfTitle'),
      defaultPath: path.join(
        app.getPath('downloads'),
        `Copycraft-${t('export.worksheetWord')}-${timestamp()}.pdf`,
      ),
      filters: [{ name: t('filter.pdf'), extensions: ['pdf'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    if (canceled || !filePath) {
      analytics?.track('export', { format: 'pdf', result: 'canceled' });
      return { canceled: true, saved: false };
    }

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'none' },
      preferCSSPageSize: true,
      landscape: false,
    });
    await fsp.writeFile(filePath, pdf);
    recordExport(win);
    analytics?.track('export', { format: 'pdf', result: 'saved' });
    return { saved: true, path: filePath };
  } catch (error) {
    analytics?.track('export', { format: 'pdf', result: 'failed', stage: 'export' });
    return {
      saved: false,
      error: errorMessage(error),
    };
  } finally {
    exportInProgress = false;
  }
}

/**
 * 打开系统打印窗口。与导出 PDF 共用试用门禁，成功打印后计一次导出。
 * 打印内容由 @media print 样式限定为 .sheet-page。
 */
async function printSheet(win) {
  if (!win || win.isDestroyed()) {
    return { printed: false, error: t('error.windowUnavailable') };
  }
  if (exportInProgress) {
    return { printed: false, error: t('error.printInProgress') };
  }

  exportInProgress = true;
  try {
    const hasSheet = await win.webContents.executeJavaScript(
      "Boolean(document.querySelector('.sheet-page'))",
    );
    if (!hasSheet) {
      return { printed: false, error: t('error.noSheetPrint') };
    }

    const blocked = exportGate('print');
    if (blocked) {
      return {
        printed: false,
        needActivation: blocked.needActivation,
        error: blocked.error,
      };
    }

    return await new Promise((resolve) => {
      win.webContents.print(
        {
          printBackground: true,
          pageSize: 'A4',
          margins: { marginType: 'none' },
          landscape: false,
        },
        (success, failureReason) => {
          if (success) {
            recordExport(win);
            analytics?.track('export', { format: 'print', result: 'saved' });
            resolve({ printed: true });
            return;
          }
          const canceled = failureReason === 'cancelled' || failureReason === 'canceled';
          analytics?.track('export', {
            format: 'print',
            result: canceled ? 'canceled' : 'failed',
            ...(canceled ? {} : { reason: failureReason ?? 'unknown' }),
          });
          resolve({
            printed: false,
            canceled,
            error: canceled ? undefined : failureReason,
          });
        },
      );
    });
  } catch (error) {
    analytics?.track('export', { format: 'print', result: 'failed', stage: 'print' });
    return {
      printed: false,
      error: errorMessage(error),
    };
  } finally {
    exportInProgress = false;
  }
}

function buildMenu() {
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: t('menu.file'),
      submenu: [
        {
          label: t('menu.exportPdf'),
          accelerator: 'CmdOrCtrl+Shift+E',
          click: async () => {
            if (!mainWindow) return;
            const result = await exportPdf(mainWindow);
            if (result.needActivation) {
              const choice = await dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: t('menu.needActivation'),
                message: t('menu.trialEnded'),
                detail: t('menu.activationDetail'),
                buttons: [t('menu.openSettings'), t('menu.cancel')],
                defaultId: 0,
                cancelId: 1,
              });
              if (choice.response === 0) {
                mainWindow.webContents.send('open-settings');
              }
            } else if (!result.saved && !result.canceled) {
              dialog.showErrorBox(
                t('menu.exportFailed'),
                result.error || t('common.unknownError'),
              );
            }
          },
        },
        { type: 'separator' },
        isMac
          ? { role: 'close', label: t('menu.closeWindow') }
          : { role: 'quit', label: t('menu.quit') },
      ],
    },
    { role: 'editMenu', label: t('menu.edit') },
    {
      label: t('menu.view'),
      submenu: [
        { role: 'reload', label: t('menu.reload') },
        { role: 'forceReload', label: t('menu.forceReload') },
        { role: 'toggleDevTools', label: t('menu.devTools') },
        { type: 'separator' },
        { role: 'resetZoom', label: t('menu.actualSize') },
        { role: 'zoomIn', label: t('menu.zoomIn') },
        { role: 'zoomOut', label: t('menu.zoomOut') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: t('menu.fullscreen') },
      ],
    },
    { role: 'windowMenu', label: t('menu.window') },
    {
      label: t('menu.help'),
      submenu: [
        {
          label: t('menu.activate'),
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('open-settings');
            }
          },
        },
        { type: 'separator' },
        {
          label: t('menu.about'),
          click: () => {
            void dialog.showMessageBox({
              type: 'info',
              title: t('menu.about'),
              message: t('app.name'),
              detail: t('about.detail', {
                version: app.getVersion(),
                electron: process.versions.electron,
                chromium: process.versions.chrome,
                node: process.versions.node,
              }),
              buttons: [t('menu.ok')],
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function applyAboutPanelOptions() {
  if (!isMac) return;
  app.setAboutPanelOptions({
    applicationName: t('app.name'),
    applicationVersion: app.getVersion(),
    credits: t('about.credits'),
  });
}

ipcMain.handle('export-pdf', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return exportPdf(win);
});

ipcMain.handle('print-sheet', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return printSheet(win);
});

ipcMain.handle('license-status', () => {
  if (!licenseManager) {
    return { ok: false, status: null, error: t('error.licenseUnavailableShort') };
  }
  try {
    return { ok: true, status: licenseManager.status() };
  } catch (error) {
    return { ok: false, status: null, error: errorMessage(error) };
  }
});

ipcMain.handle('license-check', () => {
  if (!licenseManager) {
    return { allowed: false, status: null, error: t('error.licenseUnavailableShort') };
  }
  try {
    return licenseManager.checkExport();
  } catch (error) {
    return {
      allowed: false,
      status: null,
      error: t('error.licenseReadFailed', { error: errorMessage(error) }),
    };
  }
});

ipcMain.handle('license-activate', (_event, code) => {
  if (!licenseManager) {
    return { ok: false, error: t('error.licenseUnavailableShort') };
  }
  const result = licenseManager.activate(code);
  analytics?.track('activation', {
    result: result.ok ? 'success' : 'failed',
    reason: result.ok ? 'none' : result.code ?? 'unknown',
  });
  return result;
});

ipcMain.handle('analytics-get', () => {
  return analytics?.getState() ?? { enabled: false, active: false };
});

ipcMain.handle('analytics-set', (_event, enabled) => {
  return analytics?.setEnabled(Boolean(enabled)) ?? { enabled: false, active: false };
});

ipcMain.handle('save-file', async (event, payload) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) {
    return { saved: false, error: t('error.windowUnavailable') };
  }

  const { defaultName, filters, data, kind, pages } = payload || {};
  if (!data || typeof data !== 'object') {
    return { saved: false, error: t('error.invalidFile') };
  }

  const format = kind === 'docx' ? 'docx' : 'file';
  const trackExportResult = (result) =>
    analytics?.track('export', {
      format,
      result,
      ...(Number.isFinite(pages) ? { pages } : {}),
    });

  const blocked = exportGate(format);
  if (blocked) return blocked;

  const safeName = path.basename(String(defaultName || 'Copycraft-export'));
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: t('dialog.saveFile'),
    defaultPath: path.join(app.getPath('downloads'), safeName),
    filters: Array.isArray(filters)
      ? filters
      : [{ name: t('filter.all'), extensions: ['*'] }],
    properties: ['createDirectory', 'showOverwriteConfirmation'],
  });
  if (canceled || !filePath) {
    trackExportResult('canceled');
    return { canceled: true, saved: false };
  }

  try {
    await fsp.writeFile(filePath, Buffer.from(data));
    recordExport(win);
    trackExportResult('saved');
    return { saved: true, path: filePath };
  } catch (error) {
    trackExportResult('failed');
    return {
      saved: false,
      error: errorMessage(error),
    };
  }
});

ipcMain.handle('check-updates', async () => {
  try {
    const response = await net.fetch(
      `https://api.github.com/repos/${UPDATE_REPO}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': `Copycraft/${app.getVersion()}`,
        },
      },
    );
    if (response.status === 404) {
      analytics?.track('update_check', { result: 'no_release' });
      return { latest: null, url: RELEASES_URL };
    }
    if (!response.ok) {
      analytics?.track('update_check', {
        result: 'error',
        status: response.status,
      });
      return {
        latest: null,
        url: RELEASES_URL,
        error: t('error.updateService', { status: response.status }),
      };
    }
    const data = await response.json();
    const latest =
      typeof data.tag_name === 'string' ? data.tag_name.replace(/^v/i, '') : null;
    analytics?.track('update_check', { result: 'ok' });
    return {
      latest,
      url: typeof data.html_url === 'string' ? data.html_url : RELEASES_URL,
    };
  } catch (error) {
    analytics?.track('update_check', { result: 'error', stage: 'network' });
    return {
      latest: null,
      url: RELEASES_URL,
      error: errorMessage(error),
    };
  }
});

ipcMain.handle('set-theme', (event, theme) => {
  const mode = theme === 'light' ? 'light' : 'dark';
  saveTheme(mode);
  const win = BrowserWindow.fromWebContents(event.sender);
  applyTheme(mode, win);
  return { ok: true };
});

ipcMain.handle('set-language', (_event, language) => {
  setLanguage(language);
  buildMenu();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setTitle(t('app.name'));
  }
  applyAboutPanelOptions();
  return { ok: true };
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = createWindow(ensureVisible(loadWindowState()));
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    applyAboutPanelOptions();
    let licenseStatus = null;
    try {
      licenseManager = createLicense({ userDataDir: app.getPath('userData') });
      licenseStatus = licenseManager.init();
    } catch (error) {
      console.error('[copycraft] license init failed:', error);
    }
    analytics?.track('app_started', {
      licensed: licenseStatus?.activated ? 'yes' : 'no',
      trial_used: licenseStatus?.trialUsed ?? 0,
      trial_limit: licenseStatus?.trialLimit ?? 30,
      platform: process.platform,
      arch: process.arch,
    });
    const state = ensureVisible(loadWindowState());
    mainWindow = createWindow(state);
    buildMenu();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow(ensureVisible(loadWindowState()));
      }
    });
  });

  app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });
}
