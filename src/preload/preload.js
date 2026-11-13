const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('quickshelf', {
  toggle: () => ipcRenderer.send('window:toggle'),
  hide: () => ipcRenderer.send('window:hide'),
  quit: () => ipcRenderer.send('app:quit'),
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  shelf: {
    getState: () => ipcRenderer.invoke('shelf:get-state'),
    addPaths: (payload) => ipcRenderer.invoke('shelf:add-paths', payload),
    addWeb: (payload) => ipcRenderer.invoke('shelf:add-web', payload),
    removeItem: (payload) => ipcRenderer.invoke('shelf:remove-item', payload),
    clearTab: (tabId) => ipcRenderer.invoke('shelf:clear-tab', tabId),
    addTab: (name) => ipcRenderer.invoke('shelf:add-tab', name),
    renameTab: (payload) => ipcRenderer.invoke('shelf:rename-tab', payload),
    deleteTab: (tabId) => ipcRenderer.invoke('shelf:delete-tab', tabId),
    setActiveTab: (tabId) => ipcRenderer.invoke('shelf:set-active-tab', tabId),
    openItem: (payload) => ipcRenderer.invoke('shelf:open-item', payload),
    showItem: (payload) => ipcRenderer.invoke('shelf:show-item', payload),
    copyPath: (payload) => ipcRenderer.invoke('shelf:copy-path', payload),
    showMenu: (payload) => ipcRenderer.invoke('shelf:show-menu', payload),
    showTabMenu: (tabId) => ipcRenderer.invoke('shelf:show-tab-menu', tabId),
    dragOut: (payload) => ipcRenderer.send('shelf:drag-out', payload),
    onStateChanged: (callback) => {
      const listener = (_event, state) => callback(state);
      ipcRenderer.on('shelf:state-changed', listener);
      return () => ipcRenderer.removeListener('shelf:state-changed', listener);
    },
  },
});
