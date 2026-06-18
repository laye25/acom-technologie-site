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

  const prodUrl = atob('aHR0cHM6Ly9haXMtcHJlLTMyN3Jnem1jdHlnNG14Y3ozZnNldXItMzI0MTQ2NTkyODY4LmV1cm9wZS13ZXN0Mi5ydW4uYXBw');
  const devUrl = atob('aHR0cHM6Ly9haXMtZGV2LTMyN3Jnem1jdHlnNG14Y3ozZnNldXItMzI0MTQ2NTkyODY4LmV1cm9wZS13ZXN0Mi5ydW4uYXBw');
  
  // Check if we are hosted directly on the official web cloud run container endpoints
  const isCloudRunServer = 
    window.location.hostname === new URL(prodUrl).hostname ||
    window.location.hostname === new URL(devUrl).hostname;

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
    base = prodUrl;
  }

  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmedBase}${cleanPath}`;
};


export const sendEmailDirectlyOrViaBackend = async (payload: {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
}, config?: { resendApiKey?: string; defaultFrom?: string }) => {
  // If we are in the desktop Electron app, route securely through the native IPC layer
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.sendEmailSecure) {
    console.log("[Mail Engine] Routing email securely via Desktop IPC bypassing frontend exposure.");
    const result = await window.electronAPI.sendEmailSecure(payload);
    return {
      ...result,
      statusText: result.ok ? 'OK' : 'Error',
      text: async () => result.text,
      json: async () => {
        try {
          return JSON.parse(result.text);
        } catch {
          return { error: result.text };
        }
      }
    } as any;
  }

  // Fallback for direct front-end calls if a key is provided directly (e.g. from an admin/SaaS config override)
  if (config?.resendApiKey) {
    console.log("[Mail Engine] Routing email directly via Resend API from browser.");
    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: payload.from || config.defaultFrom || 'ACOM Desktop <onboarding@resend.dev>',
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html
      })
    });
  } 
  
  // Default fallback through backend
  return fetch(getApiUrl('/api/send-email'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};
