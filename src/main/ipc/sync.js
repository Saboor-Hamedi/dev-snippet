import { ipcMain } from 'electron'
import SyncManager from '../services/sync/SyncManager'

export const registerSyncHandlers = (db) => {
  // Initialize the manager with the database instance
  SyncManager.initialize(db)

  ipcMain.handle('sync:setToken', (event, token) => {
    SyncManager.setToken(token)
    return true
  })

  ipcMain.handle('sync:hasToken', () => {
    const token = SyncManager.getToken()
    return !!token
  })

  ipcMain.handle('sync:getToken', () => {
    return SyncManager.getToken()
  })

  ipcMain.handle('sync:getStatus', async () => {
    return await SyncManager.getStatus()
  })

  ipcMain.handle('sync:backup', async () => {
    return await SyncManager.backupToGist()
  })

  ipcMain.handle('sync:restore', async () => {
    return await SyncManager.restoreFromGist()
  })
}
