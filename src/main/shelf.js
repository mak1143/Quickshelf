const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  app,
  BrowserWindow,
  Menu,
  clipboard,
  dialog,
  ipcMain,
  nativeImage,
  shell,
} = require('electron');
const { ShelfStore, createLinkItem, createOwnedItem } = require('./shelf-store');

const MAX_WEB_BYTES = 50 * 1024 * 1024;
const FALLBACK_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
const MIME_EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
};

let store = null;
let webDir = null;
let registered = false;

function initShelf() {
  if (store) return store;
  const baseDir = app.getPath('userData');
  webDir = path.join(baseDir, 'web');
  store = new ShelfStore(baseDir);
  store.load();
  registerIpc();
  return store;
}

function registerIpc() {
  if (registered) return;
  registered = true;

  ipcMain.handle('shelf:get-state', () => store.getState());

  ipcMain.handle('shelf:add-paths', (_event, payload = {}) => {
    const tabId = payload.tabId || store.getActiveTab()?.id;
    const paths = Array.isArray(payload.paths)
      ? payload.paths.filter((item) => typeof item === 'string' && path.isAbsolute(item) && fs.existsSync(item))
      : [];
    const items = paths.map((filePath) => {
      let isDirectory = false;
      try {
        isDirectory = fs.statSync(filePath).isDirectory();
      } catch {
        isDirectory = false;
      }
      return createLinkItem(filePath, isDirectory);
    });
    return store.addItems(tabId, items);
  });

  ipcMain.handle('shelf:add-web', (_event, payload = {}) => {
    const tabId = payload.tabId || store.getActiveTab()?.id;
    const item = createWebItem(payload);
    return store.addItems(tabId, [item]);
  });

  ipcMain.handle('shelf:remove-item', (_event, payload = {}) => {
    const { state, removed } = store.removeItem(payload.tabId, payload.itemId);
    if (removed) deleteOwnedFile(removed);
    return state;
  });

  ipcMain.handle('shelf:clear-tab', (_event, tabId) => {
    const { state, removed } = store.clearTab(tabId);
    removed.forEach(deleteOwnedFile);
    return state;
  });

  ipcMain.handle('shelf:add-tab', (_event, name) => store.addTab(name));

  ipcMain.handle('shelf:rename-tab', (_event, payload = {}) => store.renameTab(payload.tabId, payload.name));

  ipcMain.handle('shelf:delete-tab', (_event, tabId) => {
    const { state, removed } = store.deleteTab(tabId);
    removed.forEach(deleteOwnedFile);
    return state;
  });

  ipcMain.handle('shelf:set-active-tab', (_event, tabId) => store.setActiveTab(tabId));

  ipcMain.handle('shelf:open-item', (_event, payload = {}) => openItem(payload.tabId, payload.itemId));

  ipcMain.handle('shelf:show-item', (_event, payload = {}) => {
    const item = store.findItem(payload.tabId, payload.itemId);
    if (item) shell.showItemInFolder(item.path);
  });

  ipcMain.handle('shelf:copy-path', (_event, payload = {}) => {
    const item = store.findItem(payload.tabId, payload.itemId);
    if (item) clipboard.writeText(item.path);
  });

  ipcMain.handle('shelf:show-menu', (event, payload = {}) => {
    showItemMenu(event, payload.tabId, payload.itemId);
  });

  ipcMain.handle('shelf:show-tab-menu', (event, tabId) => {
    const tab = store.getTab(tabId);
    if (!tab) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    const menu = Menu.buildFromTemplate([
      {
        label: 'Clear shelf',
        enabled: tab.items.length > 0,
        click: () => {
          const { state, removed } = store.clearTab(tabId);
          removed.forEach(deleteOwnedFile);
          if (!event.sender.isDestroyed()) event.sender.send('shelf:state-changed', state);
        },
      },
      {
        label: 'Delete shelf',
        enabled: store.getState().tabs.length > 1,
        click: () => {
          const { state, removed } = store.deleteTab(tabId);
          removed.forEach(deleteOwnedFile);
          if (!event.sender.isDestroyed()) event.sender.send('shelf:state-changed', state);
        },
      },
    ]);
    menu.popup({ window: window || undefined });
  });

  ipcMain.on('shelf:drag-out', (event, payload = {}) => {
    void dragOut(event, payload.tabId, payload.itemId);
  });
}

function createWebItem(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid web content');

  if (payload.kind === 'image') {
    const mime = typeof payload.mime === 'string' ? payload.mime : '';
    if (!mime.startsWith('image/')) throw new Error('Unsupported image type');
    const data = toBuffer(payload.data);
    if (data.length === 0) throw new Error('Empty image');
    if (data.length > MAX_WEB_BYTES) throw new Error('Image is too large');
    const extension = MIME_EXTENSIONS[mime] || 'img';
    const filePath = writeWebFile(extension, data);
    const name = cleanName(payload.name) || `Image.${extension}`;
    return createOwnedItem({ filePath, name, mime, preview: null });
  }

  if (payload.kind === 'link') {
    const raw = typeof payload.url === 'string' ? payload.url.trim() : '';
    if (!raw || /[\r\n]/.test(raw)) throw new Error('Invalid link');
    let url;
    try {
      url = new URL(raw);
    } catch {
      throw new Error('Invalid link');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Unsupported link');
    const filePath = writeWebFile('url', `[InternetShortcut]\nURL=${url.toString()}\n`);
    return createOwnedItem({
      filePath,
      name: url.hostname || 'Link',
      mime: 'text/uri-list',
      preview: url.toString(),
    });
  }

  if (payload.kind === 'text') {
    const text = typeof payload.text === 'string' ? payload.text : '';
    if (!text.trim()) throw new Error('Empty text');
    const data = Buffer.from(text, 'utf8');
    if (data.length > MAX_WEB_BYTES) throw new Error('Text is too large');
    const filePath = writeWebFile('txt', data);
    const firstLine = text.split(/\r?\n/)[0].trim();
    return createOwnedItem({
      filePath,
      name: firstLine ? firstLine.slice(0, 60) : 'Text',
      mime: 'text/plain',
      preview: text.slice(0, 200),
    });
  }

  throw new Error('Unknown web content kind');
}

function toBuffer(data) {
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data));
  if (Array.isArray(data)) return Buffer.from(data);
  if (data && data.type === 'Buffer' && Array.isArray(data.data)) return Buffer.from(data.data);
  throw new Error('Invalid image data');
}

function writeWebFile(extension, data) {
  fs.mkdirSync(webDir, { recursive: true });
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(webDir, fileName);
  fs.writeFileSync(filePath, data, { flag: 'wx' });
  return filePath;
}

function cleanName(name) {
  if (typeof name !== 'string') return '';
  return name
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function deleteOwnedFile(item) {
  if (!item || item.kind !== 'owned') return;
  const resolved = path.resolve(item.path);
  const root = path.resolve(webDir) + path.sep;
  if (!resolved.startsWith(root)) return;
  try {
    fs.unlinkSync(resolved);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Could not delete web item:', error.message);
  }
}

async function openItem(tabId, itemId) {
  const item = store.findItem(tabId, itemId);
  if (!item) return { error: 'Item not found' };
  try {
    if (item.kind === 'owned' && item.path.endsWith('.url')) {
      const content = fs.readFileSync(item.path, 'utf8');
      const match = content.match(/^URL=(.+)$/m);
      if (!match) return { error: 'Invalid shortcut' };
      await shell.openExternal(match[1].trim());
      return { ok: true };
    }
    const error = await shell.openPath(item.path);
    return error ? { error } : { ok: true };
  } catch (error) {
    return { error: error.message };
  }
}

function showItemMenu(event, tabId, itemId) {
  const item = store.findItem(tabId, itemId);
  if (!item) return;
  const window = BrowserWindow.fromWebContents(event.sender);
  const menu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: async () => {
        const result = await openItem(tabId, itemId);
        if (result.error) dialog.showErrorBox('Cannot open item', result.error);
      },
    },
    { label: 'Show in folder', click: () => shell.showItemInFolder(item.path) },
    { label: 'Copy path', click: () => clipboard.writeText(item.path) },
    { type: 'separator' },
    {
      label: 'Remove from shelf',
      click: () => {
        const { state, removed } = store.removeItem(tabId, itemId);
        if (removed) deleteOwnedFile(removed);
        if (!event.sender.isDestroyed()) event.sender.send('shelf:state-changed', state);
      },
    },
  ]);
  menu.popup({ window });
}

async function dragOut(event, tabId, itemId) {
  const item = store.findItem(tabId, itemId);
  if (!item) return;
  let icon;
  try {
    icon = await app.getFileIcon(item.path, { size: 'normal' });
  } catch {
    icon = nativeImage.createFromDataURL(FALLBACK_ICON);
  }
  if (icon.isEmpty()) icon = nativeImage.createFromDataURL(FALLBACK_ICON);
  event.sender.startDrag({ file: item.path, icon });
}

module.exports = { initShelf };
