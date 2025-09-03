const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 340,
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: "#181c23",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  win.loadFile('index.html');
}

// IPC — komunikacja front↔backend
ipcMain.handle('run-automation', async () => {
  return new Promise((resolve) => {
    const proc = fork(path.join(__dirname, 'index.js'), [], { stdio: 'pipe', silent: true });
    let output = '';
    proc.stdout.on('data', d => {
      BrowserWindow.getAllWindows()[0].webContents.send('log', d.toString());
      output += d.toString();
    });
    proc.stderr.on('data', d => {
      BrowserWindow.getAllWindows()[0].webContents.send('log', '[ERR] ' + d.toString());
      output += '[ERR] ' + d.toString();
    });
    proc.on('exit', code => {
      resolve({ code, output });
    });
  });
});

app.whenReady().then(createWindow);
