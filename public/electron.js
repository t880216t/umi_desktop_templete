// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const electron = require('electron')
const path = require('path')
const isDev = require('electron-is-dev');
const {onDevices} = require('./adb')

let mainWindow

function createWindow () {
  const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
  mainWindow = new BrowserWindow({
    width: Math.ceil(width * 0.8),
    height: Math.ceil(height * 0.8),
    center: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: true
  })

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:8000'
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  onDevices()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
