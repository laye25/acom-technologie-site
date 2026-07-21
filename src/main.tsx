// Polyfill for crypto.randomUUID to support non-secure contexts (HTTP, nested sandboxed iframes, etc.)
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    (window as any).crypto = {} as any;
  }
  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    } as any;
  }
}

import {StrictMode, useEffect, useState, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import { initSQLite } from './services/sqliteService';
import { desktopSessionManager } from './services/desktopSessionManager';

// Expose TypeScript typing for our custom electronAPI
interface ElectronAPI {
  isElectron: boolean;
  syncPhysicalFile: (buffer: ArrayBuffer) => Promise<any>;
  exportSqliteFile?: (buffer: ArrayBuffer) => Promise<any>;
  makeApiRequest: (url: string, options: any) => Promise<any>;
  sendEmailSecure: (payload: any) => Promise<{ok: boolean, status: number, text: string, json?: () => Promise<any>}>;
  loadPhysicalDbFile?: () => Promise<any>;
  saveDesktopSettings?: (settingsObj: any) => Promise<any>;
  getDesktopSettings?: () => Promise<any>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// In Electron environments, we wrap/intercept fetch requests directed to external API endpoints.
// This allows the desktop app to bypass all CORS limitations and browser-origin security proxies (e.g. Google Front End origin-blocking)
// by executing requests from Electron's main node process stack.
if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
    
    // Only intercept requests directed to external Cloud Run production/dev server API endpoints
    // Do NOT intercept Google APIs or Firebase endpoints as they handle CORS natively and use long-polling/streaming
    if (url.startsWith('http') && 
        !url.includes('localhost') && 
        !url.includes('127.0.0.1') &&
        !url.includes('googleapis.com') &&
        !url.includes('firebaseio.com') &&
        !url.includes('google.com')
    ) {
      try {
        console.log('[Desktop Fetch Bypasser] Routing fetch call natively via Node preflight stack:', url);
        
        let bodyText: string | undefined;
        if (init?.body) {
          if (typeof init.body === 'string') {
            bodyText = init.body;
          } else if (init.body instanceof URLSearchParams) {
            bodyText = init.body.toString();
          } else {
            bodyText = String(init.body);
          }
        }

        const headers: Record<string, string> = {};
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
              headers[key] = value;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
              headers[key] = value;
            });
          } else {
            Object.assign(headers, init.headers);
          }
        }

        const result = await window.electronAPI.makeApiRequest(url, {
          method: init?.method || 'GET',
          headers,
          body: bodyText
        });

        console.log(`[Desktop Fetch Bypasser] Result from ${url}:`, {
          status: result.status,
          statusText: result.statusText,
          text: result.text
        });

        // Convert the IPC result back to a standard Response object
        return new Response(result.text, {
          status: result.status,
          statusText: result.statusText,
          headers: new Headers({
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          })
        });
      } catch (err: any) {
        console.error('[Desktop Fetch Bypasser Error]', err);
        return new Response(JSON.stringify({ error: err.message || 'Electron Proxy Error' }), {
          status: 500,
          statusText: 'Electron Proxy Error'
        });
      }
    }
    
    return originalFetch(input, init);
  };
}

// Entry point for Acom Technologie application
// Suppress benign Vite WebSocket connection errors in the sandbox environment
if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason === 'WebSocket closed without opened.' || 
        (event.reason && event.reason.message && event.reason.message.includes('WebSocket'))) {
      event.preventDefault();
    }
  });
}

const LazyApp = lazy(() => import('./App.tsx'));

function Main() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initializeSystem() {
      try {
        // 1. Desktop Session Manager: Restore Firebase session into IndexedDB BEFORE Firebase Auth loads.
        // This ensures session persistence across origin changes (e.g. file:// to app://localhost).
        await desktopSessionManager.restoreSessionBeforeFirebaseInit();
      } catch (err) {
        console.warn('Session restoration skipped or failed:', err);
      }

      try {
        // 2. Initialize SQLite
        await initSQLite();
      } catch (err) {
        console.error('Failed to initialize SQLite database:', err);
      }
      
      setIsReady(true);
    }
    
    initializeSystem();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-[#3a5ccc] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Initialisation de la base de données sécurisée...</p>
      </div>
    );
  }

  return (
    <StrictMode>
      <Suspense fallback={null}>
        <LazyApp />
      </Suspense>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Main />);
