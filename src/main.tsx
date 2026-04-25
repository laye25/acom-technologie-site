import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSQLite } from './services/sqliteService';

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
