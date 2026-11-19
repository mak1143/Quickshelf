const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { BrowserWindow, app } = require('electron');

// 3.5in x 2in on the reference 126 DPI panel (eDP-1, 1440x900 logical at
// 290x180 mm). The renderer reports devicePixelRatio 1.1875, so the compositor
// size in px is CSS px * 1.1875. 3.5in * 126.1 = 441 px, 2in * 126.1 = 252 px,
// and 441 / 1.1875 = 371, 252 / 1.1875 = 212. Verify with `hyprctl clients`.
const DEFAULT_WIDTH = 371;
const DEFAULT_HEIGHT = 212;
const RENDERER_URL = pathToFileURL(path.join(__dirname, '../renderer/index.html')).href;

let mainWindow = null;
let quitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minWidth: 300,
    minHeight: 160,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    title: 'Quickshelf',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('close', (event) => {
    if (quitting) {
      return;
    }

    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.control && input.key.toLowerCase() === 'q') {
      event.preventDefault();
      quit();
    }
  });

  return mainWindow;
}

function showWindow() {
  if (!mainWindow) {
    createWindow();
  }

  mainWindow.show();
  mainWindow.focus();
}

function hideWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide();
  }
}

function toggleWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    hideWindow();
    return;
  }

  showWindow();
}

function isTrustedIpcSender(event) {
  if (!mainWindow || mainWindow.isDestroyed()) return false;

  const frame = event.senderFrame;
  return Boolean(
    frame &&
      frame === event.sender.mainFrame &&
      event.sender.id === mainWindow.webContents.id &&
      frame.url === RENDERER_URL,
  );
}

function quit() {
  quitting = true;
  app.quit();
}

module.exports = {
  createWindow,
  showWindow,
  hideWindow,
  toggleWindow,
  isTrustedIpcSender,
  quit,
};
