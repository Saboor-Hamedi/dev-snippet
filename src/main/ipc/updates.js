import { autoUpdater } from 'electron-updater'
import { ipcMain } from 'electron'

/**
 * Register Auto-Updater IPC Handlers
 * Allows the renderer to check for, download, and install updates
 */
export const registerUpdatesHandlers = (mainWindow) => {
  // Manual download flow for better UI control
  autoUpdater.autoDownload = false
  autoUpdater.allowPrerelease = true
  autoUpdater.logger = console

  // 1. Check for updates
  ipcMain.handle('updates:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return result?.updateInfo || null
    } catch (error) {
      console.error('[Update Error] Check failed:', error)
      throw error
    }
  })

  // 2. Start download
  ipcMain.handle('updates:download', async () => {
    try {
      return await autoUpdater.downloadUpdate()
    } catch (error) {
      console.error('[Update Error] Download failed:', error)
      throw error
    }
  })

  // 3. Install update
  ipcMain.handle('updates:install', () => {
    autoUpdater.quitAndInstall()
  })

  // --- Listeners to push events to renderer ---

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('updates:available', info)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('updates:not-available')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    // Round the progress for cleaner UI updates
    const roundedProgress = Math.floor(progressObj.percent)
    mainWindow.webContents.send('updates:progress', {
      ...progressObj,
      percent: roundedProgress
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('updates:downloaded', info)
  })

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('updates:error', err.message || 'Unknown update error')
  })
}
