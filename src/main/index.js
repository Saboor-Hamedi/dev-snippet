/**
 * Electron Main Process Entry Point
 * Refactored for better organization and maintainability
 */

// Set this to true for development, false for production
// When true: DevTools can be opened manually with Ctrl+Shift+I or F12
// When false: DevTools are completely disabled and cannot be opened
const ENABLE_DEVTOOLS = true // <-- CHANGE THIS FOR YOUR NEEDS

const { app, BrowserWindow } = require('electron')

// Import modules
const { initDB, getDB, getPreparedStatements } = require('./database')
const { createWindow } = require('./window')
const { registerAllHandlers } = require('./ipc')

// Main window reference
let mainWindow = null

/**
 * App Ready Handler
 */
app.whenReady().then(() => {
  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('dev-dialect.quick-snippets')
  }

  // Initialize database
  const db = initDB(app)
  const preparedStatements = getPreparedStatements()

  // Create main window
  mainWindow = createWindow(app, ENABLE_DEVTOOLS)

  // Register all IPC handlers
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
