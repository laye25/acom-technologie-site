const { app, BrowserWindow, protocol, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Global exception handler for the main process to show direct error popups instead of failing silently
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception in Main Process:', err);
  if (app.isReady()) {
    dialog.showErrorBox(
      'Acom Gestion Desktop - Erreur Inattendue',
      `Une erreur interne est survenue dans le processus principal :\n\n${err.stack || err.message || err}`
    );
  }
});

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

  // Add a standard shortcut to open developer tools instantly in production/testing
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Log load failure details to help diagnose white screen issues
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Page failed to load: ${validatedURL} (${errorCode}: ${errorDescription})`);
  });

  // Log renderer process crashes or termination
  win.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone or crashed:', details);
  });

  // In production, load the built index.html using our custom secure 'app' scheme
  // In development, load the dev server URL
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadURL('app://localhost/index.html').catch(err => {
      console.error('Failed to load custom protocol app://localhost/index.html', err);
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
      
      // Normalize index.html prefixes that might occur in some asset resolution cases
      if (joinedPath.startsWith('index.html/')) {
        joinedPath = joinedPath.substring(11);
      } else if (joinedPath.startsWith('index.html\\')) {
        joinedPath = joinedPath.substring(11);
      }
      
      if (!joinedPath || joinedPath === '.' || joinedPath === 'index.html') {
        joinedPath = 'index.html';
      }
      
      let filePath = path.join(__dirname, '../dist', joinedPath);
      
      // Fallback to index.html for Single Page App client-side routing and virtual directions (paths without extensions)
      if (!fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        if (!ext || ext === '.html') {
          filePath = path.join(__dirname, '../dist/index.html');
        }
      }
      
      // Use net.fetch which automatically detects perfect MIME types (important for ES Modules & WASM compatibility)
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (error) {
      console.error(`Failed to handle app request for ${request.url}:`, error);
      
      try {
        const fallbackPath = path.join(__dirname, '../dist/index.html');
        return net.fetch(pathToFileURL(fallbackPath).toString());
      } catch (fallbackError) {
        return new Response('Fatal Error', { status: 500 });
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
