const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');

const isDev = !app.isPackaged;

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#050b1c',
    autoHideMenuBar: true,
    show: false,
    title: "Santa's Christmas Journey",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.setMenuBarVisibility(false);

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    if (target.protocol !== 'file:') {
      event.preventDefault();
      if (target.protocol === 'https:') void shell.openExternal(url);
    }
  });

  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      window.setFullScreen(!window.isFullScreen());
      event.preventDefault();
    }
    if (input.key === 'F12' && isDev) {
      window.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  void window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
