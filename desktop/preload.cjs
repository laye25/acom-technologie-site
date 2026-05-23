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
  }
});
