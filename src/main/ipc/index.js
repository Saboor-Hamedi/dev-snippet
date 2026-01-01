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
import { registerExportHandlers } from '../export/export'
import { registerWordExportHandler } from '../export/exportWord'
import { registerSyncHandlers } from './sync'
import { registerQuickCaptureHandlers } from '../QuickCapture/ipc'

export const registerAllHandlers = (
  app,
  mainWindow,
  db,
  preparedStatements,
  getDB,
  enableDevtools
) => {
  // Register all IPC handlers
  registerWindowHandlers(app, mainWindow)
  registerDatabaseHandlers(db, preparedStatements)
  registerFilesystemHandlers()
  const settingsHandlers = createSettingsHandlers(app, mainWindow)
  registerBackupHandlers(app, getDB)
  registerDialogHandlers()
  registerUpdatesHandlers(mainWindow)
  console.log('Registering Export Handlers...')
  registerExportHandlers()

  // Register Word export handler
  registerWordExportHandler(app)

  console.log('Registering Sync Handlers...')
  registerSyncHandlers(db)

  registerQuickCaptureHandlers(app, enableDevtools)

  return {
    settingsHandlers
  }
}
