/**
 * Window Creation and Management
 */

import { BrowserWindow, Menu, shell } from 'electron'
import { join } from 'path'
import { getWindowConfig } from './config'
import { setupDevToolsShortcuts } from './shortcuts'

export const createWindow = (app, ENABLE_DEVTOOLS) => {
  const config = getWindowConfig(app, ENABLE_DEVTOOLS)
  const mainWindow = new BrowserWindow(config)

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
