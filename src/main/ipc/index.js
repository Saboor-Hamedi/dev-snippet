/**
 * IPC Handlers Registration
 * Registers all IPC handlers from different modules
 */

import { registerWindowHandlers } from './window'
import { registerDatabaseHandlers } from './database'
import { registerFilesystemHandlers } from './filesystem'
import { createSettingsHandlers } from './settings'
import { registerBackupHandlers } from './backup'
import { registerDialogHandlers } from './dialog'

export const registerAllHandlers = (app, mainWindow, db, preparedStatements, getDB) => {
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
