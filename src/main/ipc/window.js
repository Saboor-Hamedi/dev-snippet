/**
 * Window Control IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron'

export const registerWindowHandlers = () => {
  // Minimize window
  ipcMain.handle('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.minimize()
    return true
  })

  // Maximize window
  ipcMain.handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.maximize()
    return true
  })

  // Unmaximize window
  ipcMain.handle('window:unmaximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.unmaximize()
    return true
  })

  // Toggle maximize
  ipcMain.handle('window:toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
    return true
  })

  // Close window
  ipcMain.handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.close()
    return true
  })

  // Relaunch app
  ipcMain.handle('window:relaunch', (event) => {
    const { app } = require('electron')
    app.relaunch()
    app.exit(0)
    return true
  })

  // Get window bounds
  ipcMain.handle('window:getBounds', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    return win.getBounds()
  })

  // Set window bounds
  ipcMain.handle('window:setBounds', (event, bounds) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win && bounds) {
        win.setBounds(bounds, true)
        return true
      }
    } catch (err) {
      console.error('Failed to set bounds:', err)
    }
    return false
  })

  // Restore default size
  ipcMain.handle('window:restore-default-size', (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        win.setSize(800, 600, true)
        win.center()
        return true
      }
    } catch (err) {
      console.error('Failed to restore default size:', err)
    }
    return false
  })

  // Set zoom factor
  ipcMain.handle('window:setZoom', (event, factor) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win && typeof factor === 'number' && factor > 0) {
        win.webContents.setZoomFactor(factor)
        return true
      }
    } catch (err) {
      console.error('Failed to set zoom factor:', err)
    }
    return false
  })

  // Get zoom factor
  ipcMain.handle('window:getZoom', (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        return win.webContents.getZoomFactor()
      }
    } catch (err) {}
    return 1.0
  })

  // Get App Version
  ipcMain.handle('app:getVersion', () => {
    const { app } = require('electron')
    return app.getVersion()
  })

  // Open in a Mini Browser (internal Electron window)
  ipcMain.handle('window:openMiniBrowser', async (event, htmlContent) => {
    const { app } = require('electron')
    const path = require('path')
    const fs = require('fs/promises')

    try {
      const tempPath = path.join(app.getPath('temp'), 'dev-snippet-mini-preview.html')
      await fs.writeFile(tempPath, htmlContent, 'utf-8')

      const miniWin = new BrowserWindow({
        width: 800,
        height: 900,
        title: 'Snippet Preview',
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      miniWin.setMenu(null)
      await miniWin.loadFile(tempPath)
      miniWin.show()
      return true
    } catch (err) {
      console.error('Failed to open mini browser preview:', err)
      return false
    }
  })
}
