const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// Register custom protocol BEFORE app is ready to act as a standard secure scheme
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      corsEnabled: true
    }
  }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Acom Gestion Desktop',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    }
  });

  const iconPath = path.join(__dirname, '../public/icon.png');
  if (fs.existsSync(iconPath)) {
    win.setIcon(iconPath);
  }

  // In production, load the built index.html using our custom secure 'app' scheme
  // In development, load the dev server URL
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadURL('app://index.html').catch(err => {
      console.error('Failed to load custom protocol app://index.html', err);
    });
  }
}

app.whenReady().then(() => {
  // Register the protocol handler after app.whenReady
  protocol.handle('app', async (request) => {
    try {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);
      let hostname = decodeURIComponent(url.hostname);
      
      let joinedPath = '';
      if (hostname && hostname !== '.' && hostname !== 'localhost') {
        joinedPath = path.join(hostname, pathname);
      } else {
        joinedPath = pathname;
      }
      
      // remove any leading slashes or relative path segments
      joinedPath = joinedPath.replace(/^\/+/, '').replace(/^\.\/+/, '');
      
      if (!joinedPath || joinedPath === '.' || joinedPath === 'index.html') {
        joinedPath = 'index.html';
      }
      
      const filePath = path.join(__dirname, '../dist', joinedPath);
      const data = await fs.promises.readFile(filePath);
      
      // Auto-detect correct mime-type for all assets (essential for ES Modules & WASM compatibility)
      let contentType = 'text/html';
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.js' || ext === '.mjs') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.wasm') contentType = 'application/wasm';
      else if (ext === '.html') contentType = 'text/html';
      
      return new Response(data, {
        headers: { 'content-type': contentType }
      });
    } catch (error) {
      console.error('Failed to handle app request:', error);
      // Fallback to index.html for Single Page App client-side routing
      try {
        const fallbackData = await fs.promises.readFile(path.join(__dirname, '../dist/index.html'));
        return new Response(fallbackData, {
          headers: { 'content-type': 'text/html' }
        });
      } catch (fallbackError) {
        return new Response('Not Found', { status: 404 });
      }
    }
  });

  createWindow();
});

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
