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

const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const DEV_URL = process.env.VITE_DEV_SERVER_URL || '';
const ROOT = path.join(__dirname, '..');
const ICON = path.join(ROOT, 'build', 'icon.png');

app.setName('Copycraft 字帖工坊');
if (isWin) app.setAppUserModelId('com.copycraft.app');

let mainWindow = null;
let exportInProgress = false;

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
    title: 'Copycraft 字帖工坊',
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

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return;
    if (DEV_URL && url.startsWith(DEV_URL)) return;
    event.preventDefault();
    if (url.startsWith('http://') || url.startsWith('https://')) {
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
    return { saved: false, error: '窗口不可用' };
  }
  if (exportInProgress) {
    return { saved: false, error: '正在导出，请稍候' };
  }

  exportInProgress = true;
  try {
    // 笔顺查询等非字帖视图没有可打印内容，避免导出空白 PDF。
    const hasSheet = await win.webContents.executeJavaScript(
      "Boolean(document.querySelector('.sheet-page'))",
    );
    if (!hasSheet) {
      return { saved: false, error: '当前视图没有可导出的字帖，请先选择一个字帖类型' };
    }

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: '导出字帖 PDF',
      defaultPath: path.join(app.getPath('downloads'), `Copycraft-${timestamp()}.pdf`),
      filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    if (canceled || !filePath) return { canceled: true, saved: false };

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'none' },
      preferCSSPageSize: true,
      landscape: false,
    });
    await fsp.writeFile(filePath, pdf);
    return { saved: true, path: filePath };
  } catch (error) {
    return {
      saved: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    exportInProgress = false;
  }
}

function buildMenu() {
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: '文件',
      submenu: [
        {
          label: '导出 PDF…',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: async () => {
            if (!mainWindow) return;
            const result = await exportPdf(mainWindow);
            if (!result.saved && !result.canceled) {
              dialog.showErrorBox('导出失败', result.error || '未知错误');
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: '关闭窗口' } : { role: 'quit', label: '退出' },
      ],
    },
    { role: 'editMenu', label: '编辑' },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' },
      ],
    },
    { role: 'windowMenu', label: '窗口' },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 Copycraft 字帖工坊',
          click: () => {
            void dialog.showMessageBox({
              type: 'info',
              title: '关于 Copycraft 字帖工坊',
              message: 'Copycraft 字帖工坊',
              detail: `版本 ${app.getVersion()}\nReact + Electron 字帖生成器\nElectron ${process.versions.electron}\nChromium ${process.versions.chrome}\nNode ${process.versions.node}`,
              buttons: ['好的'],
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle('export-pdf', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return exportPdf(win);
});

ipcMain.handle('save-file', async (event, payload) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return { saved: false, error: '窗口不可用' };

  const { defaultName, filters, data } = payload || {};
  if (!data || typeof data !== 'object') {
    return { saved: false, error: '无效的文件数据' };
  }

  const safeName = path.basename(String(defaultName || 'Copycraft-export'));
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: '保存文件',
    defaultPath: path.join(app.getPath('downloads'), safeName),
    filters: Array.isArray(filters) ? filters : [{ name: '所有文件', extensions: ['*'] }],
    properties: ['createDirectory', 'showOverwriteConfirmation'],
  });
  if (canceled || !filePath) return { canceled: true, saved: false };

  try {
    await fsp.writeFile(filePath, Buffer.from(data));
    return { saved: true, path: filePath };
  } catch (error) {
    return {
      saved: false,
      error: error instanceof Error ? error.message : String(error),
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
    if (response.status === 404) return { latest: null, url: RELEASES_URL };
    if (!response.ok) {
      return {
        latest: null,
        url: RELEASES_URL,
        error: `更新服务返回 ${response.status}`,
      };
    }
    const data = await response.json();
    const latest =
      typeof data.tag_name === 'string' ? data.tag_name.replace(/^v/i, '') : null;
    return {
      latest,
      url: typeof data.html_url === 'string' ? data.html_url : RELEASES_URL,
    };
  } catch (error) {
    return {
      latest: null,
      url: RELEASES_URL,
      error: error instanceof Error ? error.message : String(error),
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
    if (isMac) {
      app.setAboutPanelOptions({
        applicationName: 'Copycraft 字帖工坊',
        applicationVersion: app.getVersion(),
        credits: '使用 React + Electron 构建的字帖生成器',
      });
    }
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
