/**
 * IPC Handlers Registration
 * Registers all IPC handlers from different modules
 */

const { registerWindowHandlers } = require('./window')
const { registerDatabaseHandlers } = require('./database')
const { registerFilesystemHandlers } = require('./filesystem')
const { createSettingsHandlers } = require('./settings')
const { registerBackupHandlers } = require('./backup')
const { registerDialogHandlers } = require('./dialog')

const registerAllHandlers = (app, mainWindow, db, preparedStatements, getDB) => {
  // Register all IPC handlers
  registerWindowHandlers()
  registerDatabaseHandlers(db, preparedStatements)
  registerFilesystemHandlers()
  const settingsHandlers = createSettingsHandlers(app, mainWindow)
  registerBackupHandlers(app, getDB)
  registerDialogHandlers()
  return {
    settingsHandlers
  }
}

module.exports = { registerAllHandlers }
