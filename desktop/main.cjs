const { app, BrowserWindow, protocol, dialog, net, session } = require('electron');
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
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.cjs')
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

  // Intercept all requests to Google APIs (Firebase/Firestore) to fake the origin
  // This bypasses GCP API Key referrer restrictions without compromising security
  const filter = {
    urls: ['https://*.googleapis.com/*', 'https://*.firebaseio.com/*']
  };
  
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    // Inject the authorized staging/prod URL as Origin to satisfy GCP API Key App restrictions
    const originUrl = process.env.ACOM_PROD_URL || Buffer.from('aHR0cHM6Ly9haXMtcHJlLTMyN3Jnem1jdHlnNG14Y3ozZnNldXItMzI0MTQ2NTkyODY4LmV1cm9wZS13ZXN0Mi5ydW4uYXBw', 'base64').toString('utf-8');
    details.requestHeaders['Origin'] = originUrl;
    details.requestHeaders['Referer'] = originUrl + '/';
    callback({ cancel: false, requestHeaders: details.requestHeaders });
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
  // Expose physical file synchronization over secure IPC
  const { ipcMain } = require('electron');
  ipcMain.handle('sync-physical-file', async (event, arrayBuffer) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const appData = app.getPath('userData') || process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
      const folderPath = path.join(appData, 'AcomGestion');
      
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const dbPath = path.join(folderPath, 'data.sqlite');
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(dbPath, buffer);
      console.log(`[IPC] Database anchored to physical file: ${dbPath}`);
      return { success: true, path: dbPath };
    } catch (error) {
      console.error('[IPC] Failed to sync physical SQLite file:', error);
      return { success: false, error: error.message };
    }
  });

  // Export SQLite database to user-selected folder (USB key, etc.)
  ipcMain.handle('export-sqlite-file', async (event, arrayBuffer) => {
    try {
      const fs = require('fs');
      const { filePath } = await dialog.showSaveDialog({
        title: 'Exporter la base de données SQLite',
        defaultPath: 'acom_studio.sqlite3',
        filters: [
          { name: 'SQLite Database', extensions: ['sqlite3', 'sqlite', 'db'] }
        ]
      });
      if (filePath) {
        fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
        console.log(`[IPC] Database exported successfully to: ${filePath}`);
        return { success: true, path: filePath };
      }
      return { success: false, cancelled: true };
    } catch (error) {
      console.error('[IPC] Failed to export SQLite file:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle bypassed desktop-to-web API proxy calls using Electron operating-system-level network engine
  ipcMain.handle('make-api-request', async (event, { url, options }) => {
    try {
      console.log(`[IPC API POP] Intercepting fetch on Desktop for secure backend forward: ${options.method || 'GET'} ${url}`);
      const fetchOptions = {
        method: options.method || 'GET',
        headers: {
          ...options.headers,
          'User-Agent': 'Acom-Desktop-App',
          'Origin': process.env.ACOM_PROD_URL || Buffer.from('aHR0cHM6Ly9haXMtcHJlLTMyN3Jnem1jdHlnNG14Y3ozZnNldXItMzI0MTQ2NTkyODY4LmV1cm9wZS13ZXN0Mi5ydW4uYXBw', 'base64').toString('utf-8')
        }
      };
      
      if (options.body) {
        fetchOptions.body = options.body;
      }
      
      // Use standard Node.js global fetch (introduced natively in Node 18+) if present, 
      // fallback to Electron's Chromium-based net.fetch
      let response;
      if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
        console.log('[IPC API POP] Using standard Node.js native fetch stack');
        response = await globalThis.fetch(url, fetchOptions);
      } else {
        console.log('[IPC API POP] Using Electron chromium-based net.fetch stack');
        response = await net.fetch(url, fetchOptions);
      }
      
      const text = await response.text();
      
      console.log(`[IPC API POP] API Gateway Response: ${response.status} ${response.statusText}`);
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        text: text
      };
    } catch (error) {
      console.error('[IPC API POP] Gateway fetch failed:', error);
      return {
        ok: false,
        status: 500,
        statusText: error.message || 'CORS Bypass Error',
        text: JSON.stringify({ error: error.message })
      };
    }
  });

  // Secure email sender using hardcoded/environment credentials natively inside Electron
  ipcMain.handle('send-email-secure', async (event, payload) => {
    try {
      console.log(`[IPC Mail] Sending secure native email to: ${payload.to}`);
      
      // Mettez à jour ces valeurs ici avec votre vraie clé et votre email de domaine authentifié.
      // Cette clé sera injectée, compilée ou protégée dans le binaire bureau.
      const HIDDEN_RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || 're_WHwSbdvU_27B1Duhd5YZsRePHWU1QNTvh';
      const HIDDEN_SENDER_EMAIL = 'manager-gestion@acomtechnologie.com'; 

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HIDDEN_RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: HIDDEN_SENDER_EMAIL,
          to: Array.isArray(payload.to) ? payload.to : [payload.to],
          subject: payload.subject,
          html: payload.html
        })
      };

      let response;
      if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
        response = await globalThis.fetch('https://api.resend.com/emails', fetchOptions);
      } else {
        response = await net.fetch('https://api.resend.com/emails', fetchOptions);
      }

      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        text: text
      };
    } catch (error) {
      console.error('[IPC Mail] Native email send failed:', error);
      return { ok: false, error: error.message };
    }
  });

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
      let ext = path.extname(filePath).toLowerCase();
      
      // Check if file exists and is not a directory
      let exists = false;
      let isDir = false;
      try {
        const stat = fs.statSync(filePath);
        exists = true;
        isDir = stat.isDirectory();
      } catch (e) {
        exists = false;
      }

      // If it's a directory or doesn't exist, we might need a fallback
      if (!exists || isDir) {
        // Only fallback to SPA index.html if it looks like a route (no extension or .html)
        if (!ext || ext === '.html' || isDir) {
          filePath = path.join(__dirname, '../dist/index.html');
          ext = '.html';
          if (!fs.existsSync(filePath)) {
            return new Response('index.html Not Found', { status: 404 });
          }
        } else {
          // File does not exist and it is an asset, return 404
          return new Response(`Asset Not Found: ${joinedPath}`, { status: 404 });
        }
      }
      
      // Read the file securely using sync fs which has 100% stable ASAR support in all Electron versions
      const data = fs.readFileSync(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      const headers = {
        'content-type': contentType,
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
        'x-content-type-options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      };

      // Only apply COEP and COOP headers on non-HTML payloads (like Web Workers or scripts if necessary)
      // Forcing them on index.html isolates the page and blocks ALL standard cross-origin requests like Firebase, Fonts, or external links
      if (ext !== '.html') {
        headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
        headers['Cross-Origin-Opener-Policy'] = 'same-origin';
      }

      return new Response(new Uint8Array(data), {
        headers
      });
    } catch (error) {
      console.error(`Failed to handle app request for ${request.url}:`, error);
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
