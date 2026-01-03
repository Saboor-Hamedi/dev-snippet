/**
 * Window Control IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron'
import { join } from 'path'
import fs from 'fs'

export const registerWindowHandlers = (app, mainWindow) => {
  const statePath = join(app.getPath('userData'), 'window-state.json')
  let currentState = {
    normal: { width: 800, height: 900, isMaximized: false },
    flow: { width: 750, height: 750 },
    lastMode: 'normal'
  }

  // Load existing state
  try {
    if (fs.existsSync(statePath)) {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'))
      currentState = { ...currentState, ...data }
    }
  } catch (err) {
    console.error('Failed to load window state:', err)
  }

  const saveState = () => {
    try {
      fs.writeFileSync(statePath, JSON.stringify(currentState, null, 2))
    } catch (err) {
      console.error('Failed to save window state:', err)
    }
  }

  // Debounced save
  let saveTimeout = null
  const debouncedSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(saveState, 500)
  }

  // Update state whenever window moves/resizes
  const updateCurrentModeState = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    const isMaximized = mainWindow.isMaximized()

    if (currentState.lastMode === 'flow') {
      if (!isMaximized && !mainWindow.isFullScreen()) {
        currentState.flow = { ...bounds }
      }
    } else {
      currentState.normal.isMaximized = isMaximized
      if (!isMaximized && !mainWindow.isFullScreen()) {
        currentState.normal = { ...bounds, isMaximized: false }
      }
    }
    debouncedSave()
  }

  if (mainWindow) {
    mainWindow.on('move', updateCurrentModeState)
    mainWindow.on('resize', updateCurrentModeState)
  }

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

  // Reload window
  ipcMain.handle('window:reload', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.webContents.reloadIgnoringCache()
      return true
    }
    return false
  })

  // Relaunch app
  ipcMain.handle('window:relaunch', (event) => {
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
        currentState.lastMode = 'normal'
        debouncedSave()
        win.setMinimumSize(800, 600)
        win.maximize()
        return true
      }
    } catch (err) {
      console.error('Failed to restore default size:', err)
    }
    return false
  })

  // RESET WINDOW
  ipcMain.handle('window:reset', (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        currentState = {
          normal: { width: 800, height: 900, isMaximized: true },
          flow: { width: 700, height: 700 },
          lastMode: 'normal'
        }
        saveState()
        win.setFullScreen(false)
        win.unmaximize()
        win.setMinimumSize(800, 600)
        win.setMaximumSize(9999, 9999)
        win.maximize()
        return true
      }
    } catch (err) {
      console.error('Failed to reset window:', err)
    }
    return false
  })

  // Set Flow Size
  ipcMain.handle('window:set-flow-size', (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        currentState.lastMode = 'flow'
        debouncedSave()
        if (win.isFullScreen()) win.setFullScreen(false)
        win.unmaximize()
        win.setResizable(true)
        setTimeout(() => {
          if (win.isDestroyed()) return
          const targetWidth = 750
          const targetHeight = 750
          win.setMinimumSize(targetWidth, targetHeight)
          win.setMaximumSize(targetWidth, targetHeight)
          win.setSize(targetWidth, targetHeight, true)
          win.center()
          setTimeout(() => {
            if (!win.isDestroyed()) {
              win.setMaximumSize(9999, 9999)
              win.center()
            }
          }, 150)
        }, 400)
        return true
      }
    } catch (err) {
      console.error('Failed to set flow size:', err)
    }
    return false
  })

  // Set zoom
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

  // Get zoom
  ipcMain.handle('window:getZoom', (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) return win.webContents.getZoomFactor()
    } catch (err) {}
    return 1.0
  })

  // Get App Version
  ipcMain.handle('app:getVersion', () => app.getVersion())

  // Open in a Mini Browser
  ipcMain.handle('window:openMiniBrowser', async (event, htmlContent) => {
    const path = require('path')
    const fsPromises = require('fs/promises')
    try {
      const tempPath = path.join(app.getPath('temp'), 'dev-snippet-mini-preview.html')
      await fsPromises.writeFile(tempPath, htmlContent, 'utf-8')
      const miniWin = new BrowserWindow({
        width: 800,
        height: 900,
        title: 'Snippet Preview',
        autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
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

  // Dirty state tracking
  let isAppDirty = false
  ipcMain.handle('window:set-dirty', (event, dirty) => {
    isAppDirty = !!dirty
    return true
  })

  if (mainWindow) {
    mainWindow.on('close', async (e) => {
      if (isAppDirty) {
        e.preventDefault()
        mainWindow.webContents.send('app:request-close')
      }
    })
  }
}
