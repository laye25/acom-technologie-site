const { contextBridge, ipcRenderer } = require('electron');

window.onerror = (message, source, lineno, colno, error) => {
  console.error('Renderer Process Error:', { message, source, lineno, colno, error });
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('Renderer Process Unhandled Rejection:', event.reason);
});

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  syncPhysicalFile: async (arrayBuffer) => {
    return ipcRenderer.invoke('sync-physical-file', arrayBuffer);
  },
  exportSqliteFile: async (arrayBuffer) => {
    return ipcRenderer.invoke('export-sqlite-file', arrayBuffer);
  },
  makeApiRequest: async (url, options) => {
    return ipcRenderer.invoke('make-api-request', { url, options });
  },
  sendEmailSecure: async (payload) => {
    return ipcRenderer.invoke('send-email-secure', payload);
  },
  loadPhysicalDbFile: async () => {
    return ipcRenderer.invoke('load-physical-db-file');
  },
  saveDesktopSettings: async (settingsObj) => {
    return ipcRenderer.invoke('save-desktop-settings', settingsObj);
  },
  getDesktopSettings: async () => {
    return ipcRenderer.invoke('get-desktop-settings');
  }
});
