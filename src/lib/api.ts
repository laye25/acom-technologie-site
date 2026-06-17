// Global API utility to resolve request URLs correctly on both Web and Desktop platforms
const isDesktop = typeof window !== 'undefined' && (
  ('__TAURI__' in window) || 
  (window.process && (window.process as any).type) || 
  (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) || 
  (window.location && window.location.protocol && !['http:', 'https:'].includes(window.location.protocol))
);

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (typeof window === 'undefined') {
    return cleanPath;
  }

  // Check if we are hosted directly on the official web cloud run container endpoints
  const isCloudRunServer = 
    window.location.hostname === 'ais-pre-327rgzmctyg4mxcz3fseur-324146592868.europe-west2.run.app' ||
    window.location.hostname === 'ais-dev-327rgzmctyg4mxcz3fseur-324146592868.europe-west2.run.app';

  // If we are hosted directly on the Web container, we use standard relative paths
  if (isCloudRunServer) {
    return cleanPath;
  }

  // Otherwise, we are running in a client-only environment (Desktop app, local desktop build, capacitor, etc.).
  // We MUST route all backend API calls to the secure production public Cloud Run server.
  let base = '';
  try {
    base = localStorage.getItem('acom_desktop_api_base_url') || '';
  } catch {}

  if (!base) {
    // If not in localStorage, try pulling it from active merchant settings cache
    try {
      const activeMerchantObj = localStorage.getItem('merchant_data') || localStorage.getItem('active_merchant');
      if (activeMerchantObj) {
        const parsed = JSON.parse(activeMerchantObj);
        base = parsed?.managerNotifications?.apiBaseUrl || '';
      }
    } catch {}
  }

  // Fallback to the current environment's main Cloud Run URL
  if (!base) {
    base = 'https://ais-pre-327rgzmctyg4mxcz3fseur-324146592868.europe-west2.run.app';
  }

  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmedBase}${cleanPath}`;
};
