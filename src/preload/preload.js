const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('quickshelf', {
  toggle: () => ipcRenderer.send('window:toggle'),
  hide: () => ipcRenderer.send('window:hide'),
  quit: () => ipcRenderer.send('app:quit'),
  getVersion: () => ipcRenderer.invoke('app:version'),
});
