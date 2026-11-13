const { app, ipcMain } = require('electron');
const { parseArgs } = require('./cli');
const { createWindow, showWindow, hideWindow, toggleWindow, quit } = require('./window');
const { initShelf } = require('./shelf');

const intent = parseArgs(process.argv);

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform', 'wayland');
  app.commandLine.appendSwitch('enable-features', 'WaylandWindowDecorations');
  app.commandLine.appendSwitch('class', 'quickshelf');
}

app.setName('Quickshelf');

const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    const next = parseArgs(commandLine);

    if (next.quit) {
      quit();
      return;
    }

    if (next.hide) {
      hideWindow();
      return;
    }

    if (next.toggle) {
      toggleWindow();
      return;
    }

    showWindow();
  });

  app.on('window-all-closed', () => {});

  app.on('activate', () => {
    showWindow();
  });

  app.whenReady().then(() => {
    if (intent.quit) {
      quit();
      return;
    }

    initShelf();
    createWindow();

    ipcMain.on('window:toggle', () => toggleWindow());
    ipcMain.on('window:hide', () => hideWindow());
    ipcMain.on('app:quit', () => quit());
    ipcMain.handle('app:version', () => app.getVersion());

    if (!intent.hide) {
      showWindow();
    }
  });
}
