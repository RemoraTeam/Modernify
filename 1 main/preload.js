const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mordenify', {
  runAutomation: () => ipcRenderer.invoke('run-automation'),
  onLog: (callback) => ipcRenderer.on('log', (_, msg) => callback(msg)),
});
