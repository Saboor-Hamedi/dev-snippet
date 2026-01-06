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
import { registerAIHandlers } from '../AI/ipc'

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
  registerFilesystemHandlers(app) // Passing app instance here
  const settingsHandlers = createSettingsHandlers(app, mainWindow)
  registerBackupHandlers(app, getDB)
  registerDialogHandlers()
  registerUpdatesHandlers(mainWindow)
  registerExportHandlers()

  // Register Word export handler
  registerWordExportHandler(app)

  registerSyncHandlers(db)

  registerQuickCaptureHandlers(app, enableDevtools)

  // Register AI handlers last to ensure core startup is not blocked
  try {
    registerAIHandlers()
  } catch (e) {
    console.error('FAILED TO REGISTER AI HANDLERS:', e)
  }

  return {
    settingsHandlers
  }
}
