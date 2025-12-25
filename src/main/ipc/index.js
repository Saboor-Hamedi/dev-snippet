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
import { registerUpdatesHandlers } from './updates'
import { registerExportHandlers } from './export'

export const registerAllHandlers = (app, mainWindow, db, preparedStatements, getDB) => {
  // Register all IPC handlers
  registerWindowHandlers(app, mainWindow)
  registerDatabaseHandlers(db, preparedStatements)
  registerFilesystemHandlers()
  const settingsHandlers = createSettingsHandlers(app, mainWindow)
  registerBackupHandlers(app, getDB)
  registerDialogHandlers()
  registerUpdatesHandlers(mainWindow)
  console.log('✅ Registering Export Handlers...')
  registerExportHandlers()
  return {
    settingsHandlers
  }
}
