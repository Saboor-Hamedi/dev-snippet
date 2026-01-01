/**
 * Window Creation and Management
 */

import { BrowserWindow, Menu, shell } from 'electron'
import { join } from 'path'
import { getWindowConfig } from './config'
import { setupDevToolsShortcuts } from './shortcuts'

export const createWindow = (app, ENABLE_DEVTOOLS) => {
  const config = getWindowConfig(app, ENABLE_DEVTOOLS)

  // Load saved state to apply on creation
  const statePath = join(app.getPath('userData'), 'window-state.json')
  let state = null
  try {
    const fs = require('fs')
    if (fs.existsSync(statePath)) {
      state = JSON.parse(fs.readFileSync(statePath, 'utf-8'))
    }
  } catch (err) {
    console.error('Failed to load window state for creation:', err)
  }

  // Override config with saved "Normal" bounds if last mode was normal
  if (state && state.lastMode === 'normal' && state.normal) {
    if (state.normal.width) {
      config.width = state.normal.width
      config.height = state.normal.height
      config.x = state.normal.x
      config.y = state.normal.y
    }
  }

  const mainWindow = new BrowserWindow(config)

  if (state && state.lastMode === 'normal' && state.normal?.isMaximized) {
    mainWindow.maximize()
  }

  // Completely remove the menu bar
  mainWindow.setMenu(null)
  Menu.setApplicationMenu(null)

  // Show window when ready
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const url = new URL(details.url)
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        shell.openExternal(details.url)
      }
    } catch {}
    return { action: 'deny' }
  })

  // Prevent navigation
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  // Setup DevTools shortcuts
  setupDevToolsShortcuts(mainWindow, ENABLE_DEVTOOLS)

  // Load the app
  if (ENABLE_DEVTOOLS && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // Note: In bundled code, file resolution depends on build structure
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}
