const path = require('node:path');
const { BrowserWindow, app } = require('electron');

const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 640;

let mainWindow = null;
let quitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minWidth: 320,
    minHeight: 480,
    show: false,
    frame: false,
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

function quit() {
  quitting = true;
  app.quit();
}

module.exports = {
  createWindow,
  showWindow,
  hideWindow,
  toggleWindow,
  quit,
};
