const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('modernify', {
  runAutomation: () => ipcRenderer.invoke('run-automation'),
  onLog: (callback) => ipcRenderer.on('log', (_, msg) => callback(msg)),
});
