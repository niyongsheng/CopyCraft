'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  saveFile: (payload) => ipcRenderer.invoke('save-file', payload),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
});
