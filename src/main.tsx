import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSQLite } from './services/sqliteService';

// Expose TypeScript typing for our custom electronAPI
interface ElectronAPI {
  isElectron: boolean;
  syncPhysicalFile: (buffer: ArrayBuffer) => Promise<any>;
  makeApiRequest: (url: string, options: any) => Promise<any>;
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
    if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
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

function Main() {
  useEffect(() => {
    initSQLite().catch(console.error);
  }, []);

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Main />);
