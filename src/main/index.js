/**
 * Electron Main Process Entry Point
 * Refactored for better organization and maintainability
 */

const { app, BrowserWindow } = require('electron')

// AUTO-DETECT: Enable DevTools in Dev, Disable in Production
const ENABLE_DEVTOOLS = !app.isPackaged

// --- GLOBAL ERROR HANDLING (Prevent App Collapse) ---
process.on('uncaughtException', (error) => {
  console.error('CRITICAL MAIN PROCESS ERROR (Uncaught):', error)
  // We don't exit here immediately to allow some self-healing or logging
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED PROMISE REJECTION in Main Process:', reason)
})
// ----------------------------------------------------

// Import modules
import { initDB, getDB, getPreparedStatements } from './database'
import { createWindow } from './window'
import { registerAllHandlers } from './ipc'

// Main window reference
let mainWindow = null

/**
 * App Ready Handler
 */
app.whenReady().then(() => {
  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.devsnippet.app')
  }

  // App User Data Path verification
  console.log('📂 User Data Path:', app.getPath('userData'))

  // Initialize database
  const db = initDB(app)
  const preparedStatements = getPreparedStatements()

  // Create main window
  mainWindow = createWindow(app, ENABLE_DEVTOOLS)

  // Register all IPC handlers
  console.log('📦 Initializing all IPC handlers...')
  registerAllHandlers(app, mainWindow, db, preparedStatements, () => getDB(app))

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(app, ENABLE_DEVTOOLS)
    }
  })
})

/**
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
