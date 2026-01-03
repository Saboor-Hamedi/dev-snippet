/**
 * Electron Main Process Entry Point
 */

import { app, BrowserWindow, globalShortcut, protocol } from 'electron'
import path from 'path'
import { initDB, getDB, getPreparedStatements } from './database'
import { createWindow } from './window'
import { registerAllHandlers } from './ipc'
import { toggleQuickCapture } from './QuickCapture'

// --- GLOBAL ERROR HANDLING ---
process.on('uncaughtException', (error) => {
  console.error('CRITICAL MAIN PROCESS ERROR (Uncaught):', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED PROMISE REJECTION:', reason)
})

let mainWindow = null

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.devsnippet.app')
  }

  const ENABLE_DEVTOOLS = !app.isPackaged

  // Initialize database
  const db = initDB(app)
  const preparedStatements = getPreparedStatements()

  // Create main window
  mainWindow = createWindow(app, ENABLE_DEVTOOLS)

  // 🚀 Register Global Quick Capture
  const shortcut = 'Shift+Alt+Space'
  globalShortcut.register(shortcut, () => {
    toggleQuickCapture(ENABLE_DEVTOOLS)
  })

  // Register 'asset' protocol
  protocol.registerFileProtocol('asset', (request, callback) => {
    const url = request.url.substr(8)
    const filePath = path.join(app.getPath('userData'), 'assets', decodeURI(url))
    callback({ path: filePath })
  })

  // Register all IPC handlers
  registerAllHandlers(app, mainWindow, db, preparedStatements, () => getDB(app), ENABLE_DEVTOOLS)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(app, !app.isPackaged)
    }
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
