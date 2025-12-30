/**
 * Electron Main Process Entry Point
 * Refactored for better organization and maintainability
 */

const { app, BrowserWindow, globalShortcut, protocol } = require('electron')
const path = require('path')

// AUTO-DETECT: Enable DevTools in Dev, Disable in Production
const ENABLE_DEVTOOLS = !app.isPackaged

// --- GLOBAL ERROR HANDLING (Prevent App Collapse) ---
process.on('uncaughtException', (error) => {
  console.error('CRITICAL MAIN PROCESS ERROR (Uncaught):', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED PROMISE REJECTION in Main Process:', reason)
})

// Import modules
import { initDB, getDB, getPreparedStatements } from './database'
import { createWindow } from './window'
import { registerAllHandlers } from './ipc'
import { toggleQuickCapture } from '../renderer/src/components/QuickCapture/useQuickCapture'

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

  // Initialize database
  const db = initDB(app)
  const preparedStatements = getPreparedStatements()

  // Create main window
  mainWindow = createWindow(app, ENABLE_DEVTOOLS)

  // 🚀 Register Global Quick Capture (Shift + Alt + Space)
  const shortcut = 'Shift+Alt+Space'
  const ret = globalShortcut.register(shortcut, () => {
    toggleQuickCapture(app, ENABLE_DEVTOOLS)
  })
  if (!ret) {
    console.warn(`❌ Global shortcut [${shortcut}] registration failed.`)
  } else {
    console.log(`🚀 Global shortcut [${shortcut}] registered successfully.`)
  }

  // Register 'asset' protocol for local images
  protocol.registerFileProtocol('asset', (request, callback) => {
    const url = request.url.substr(8)
    const decodedUrl = decodeURI(url) // Handle spaces etc
    const assetsPath = path.join(app.getPath('userData'), 'assets')
    // Configure strict path to avoid traversal attacks (basic check)
    const filePath = path.join(assetsPath, decodedUrl)
    callback({ path: filePath })
  })

  // Register all IPC handlers
  registerAllHandlers(app, mainWindow, db, preparedStatements, () => getDB(app))

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(app, ENABLE_DEVTOOLS)
    }
  })

  // Cleanup shortcuts on quit
  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
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
