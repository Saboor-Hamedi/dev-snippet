import { autoUpdater } from 'electron-updater'
import { ipcMain } from 'electron'

/**
 * Register Auto-Updater IPC Handlers
 * Allows the renderer to check for, download, and install updates
 */
export const registerUpdatesHandlers = (mainWindow) => {
  // Manual download flow for better UI control
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true // Install on quit too (VS Code style)
  autoUpdater.allowPrerelease = true
  autoUpdater.logger = console

  // 1. Check for updates
  ipcMain.handle('updates:check', async () => {
    try {
      // Safety check: if we are in dev, just return null to simulate "up to date"
      // instead of hanging the UI
      if (
        process.env.NODE_ENV === 'development' ||
        !mainWindow ||
        (mainWindow.webContents?.getOwnerBrowserWindow &&
          !mainWindow.webContents.getOwnerBrowserWindow().isPackaged)
      ) {
        // Fallback for dev mode
        console.log('[Updater] Skipping check in dev mode.')
        return null
      }

      // Check for updates
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
    autoUpdater.quitAndInstall(true, true) // isSilent, isForceRunAfter
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
