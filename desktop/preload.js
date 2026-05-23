const { contextBridge, ipcRenderer, dialog } = require('electron');

window.onerror = (message, source, lineno, colno, error) => {
  console.error('Renderer Process Error:', { message, source, lineno, colno, error });
  // If not handled, try showing an error box
  if (typeof dialog !== 'undefined') {
    dialog.showErrorBox('Erreur de rendu', `${message}\n${source}:${lineno}:${colno}`);
  }
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('Renderer Process Unhandled Rejection:', event.reason);
});
