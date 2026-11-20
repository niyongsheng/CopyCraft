'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/** 主进程事件订阅；返回取消订阅函数（组件卸载时调用）。 */
function subscribe(channel, callback) {
  const listener = () => callback();
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

/** 带 payload 的主进程事件订阅；返回取消订阅函数。 */
function subscribeWithPayload(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  printSheet: () => ipcRenderer.invoke('print-sheet'),
  saveFile: (payload) => ipcRenderer.invoke('save-file', payload),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  updateState: () => ipcRenderer.invoke('update-state'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback) => subscribeWithPayload('update-status', callback),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  setLanguage: (language) => ipcRenderer.invoke('set-language', language),
  licenseStatus: () => ipcRenderer.invoke('license-status'),
  licenseCheck: () => ipcRenderer.invoke('license-check'),
  licenseActivate: (code) => ipcRenderer.invoke('license-activate', code),
  onOpenSettings: (callback) => subscribe('open-settings', callback),
  onLicenseChanged: (callback) => subscribe('license-changed', callback),
  analyticsState: () => ipcRenderer.invoke('analytics-get'),
  setAnalyticsEnabled: (enabled) => ipcRenderer.invoke('analytics-set', enabled),
});
