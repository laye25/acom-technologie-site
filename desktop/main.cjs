const { app, BrowserWindow, protocol, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Comprehensive MIME type mapping for static physical assets inside Electron/ASAR
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8'
};

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
        preload: path.join(__dirname, 'preload.js')
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
      
      // Check if file exists. If not, handle SPA routing or return 404
      if (!fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        // If it looks like a route (no extension) or specifically requesting .html, fallback to index.html
        if (!ext || ext === '.html') {
          filePath = path.join(__dirname, '../dist/index.html');
          if (!fs.existsSync(filePath)) {
            return new Response('index.html Not Found', { status: 404 });
          }
        } else {
          // File does not exist and it is an asset, return 404
          return new Response(`Asset Not Found: ${joinedPath}`, { status: 404 });
        }
      }
      
      // Read the file securely using patched fs module that fully supports ASAR archives
      const data = await fs.promises.readFile(filePath);
      
      // Auto-detect correct MIME type for ES Modules & WASM compatibility
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      return new Response(data, {
        headers: {
          'content-type': contentType,
          'access-control-allow-origin': '*',
          'x-content-type-options': 'nosniff'
        }
      });
    } catch (error) {
      console.error(`Failed to handle app request for ${request.url}:`, error);
      
      try {
        const fallbackPath = path.join(__dirname, '../dist/index.html');
        if (fs.existsSync(fallbackPath)) {
          const fallbackData = await fs.promises.readFile(fallbackPath);
          return new Response(fallbackData, {
            headers: { 
              'content-type': 'text/html; charset=utf-8',
              'access-control-allow-origin': '*'
            }
          });
        }
      } catch (fallbackError) {
        console.error('Failed to load fallback index.html:', fallbackError);
      }
      
      return new Response(`Internal Server Error: ${error.message || error}`, { status: 500 });
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
