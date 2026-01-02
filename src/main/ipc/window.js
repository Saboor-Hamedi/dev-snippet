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
      // Don't save flow state if it's maximized (though it shouldn't be)
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

  // Reload window (Hard Refresh)
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

  // Restore default size (Now used to return to "Normal Mode")
  ipcMain.handle('window:restore-default-size', (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        currentState.lastMode = 'normal'
        debouncedSave()

        // Always return to Maximized for a true "Normal" feel as requested
        win.setMinimumSize(800, 600) // Reset to standard minimum
        win.maximize()
        return true
      }
    } catch (err) {
      console.error('Failed to restore default size:', err)
    }
    return false
  })

  // RESET WINDOW (Hard reset everything)
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

  // Set Flow Size (800x900)
  ipcMain.handle('window:set-flow-size', (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win) {
        currentState.lastMode = 'flow'
        debouncedSave()

        // 1. Force Exit any restrictive OS states immediately
        if (win.isFullScreen()) win.setFullScreen(false)
        win.unmaximize()
        win.setResizable(true)

        // 2. Multi-stage resize to fight OS "snapping" or delay
        setTimeout(() => {
          if (win.isDestroyed()) return

          const targetWidth = 750
          const targetHeight = 750

          // Force the size and centering
          win.setMinimumSize(targetWidth, targetHeight)
          win.setMaximumSize(targetWidth, targetHeight) // Temporarily lock to force it
          win.setSize(targetWidth, targetHeight, true)
          win.center()

          setTimeout(() => {
            if (!win.isDestroyed()) {
              win.setMaximumSize(9999, 9999) // Unlock but keep the size
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
    return app.getVersion()
  })

  // Open in a Mini Browser (internal Electron window)
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

  // EXIT PROTECTION: Track dirty state and warn on close
  let isAppDirty = false
  ipcMain.handle('window:set-dirty', (event, dirty) => {
    isAppDirty = !!dirty
    return true
  })

  if (mainWindow) {
    mainWindow.on('close', async (e) => {
      if (isAppDirty) {
        e.preventDefault()
        const { dialog } = require('electron')
        const result = await dialog.showMessageBox(mainWindow, {
          type: 'warning',
          buttons: ['Stay', 'Discard and Exit'],
          defaultId: 0,
          cancelId: 0,
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to leave?',
          detail: 'Changes you made may not be saved.',
          noLink: true
        })

        if (result.response === 1) {
          isAppDirty = false // Reset to avoid loop
          mainWindow.close()
        }
      }
    })
  }
}
