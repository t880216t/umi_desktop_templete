// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const electron = require('electron')
const path = require('path')
const isDev = require('electron-is-dev');

import adb from '../scripts/adb'

let mainWindow

function createWindow () {
  const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
  mainWindow = new BrowserWindow({
    width: Math.ceil(width * 0.8),
    height: Math.ceil(height * 0.8),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: true
  })

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:8000'
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    // mainWindow.webContents.openDevTools()
  })
  mainWindow.on('close', () => {
    ipcMain.removeAllListeners('open')
    ipcMain.removeAllListeners('connect')
    ipcMain.removeAllListeners('disconnect')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('did-finish-load', function () {
    adb.onDevices(mainWindow.webContents)
    ipcMain.on('connect', adb.connect)
    ipcMain.on('disconnect', adb.disconnect)
  })

}

app.whenReady().then(() => {
  createWindow()

  app.on('ready', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
