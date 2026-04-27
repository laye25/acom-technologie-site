const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Acom Gestion Desktop',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  const iconPath = path.join(__dirname, '../public/icon.png');
  if (require('fs').existsSync(iconPath)) {
    win.setIcon(iconPath);
  }

  // In production, load the built index.html
  // In development, load the dev server URL
  const startUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  win.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
