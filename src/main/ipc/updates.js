import { autoUpdater } from 'electron-updater'
import { ipcMain, app } from 'electron'
import https from 'https'

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

  // 0. Initial check on startup (Production only)
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('[Updater] Background check failed on startup:', err)
    })
  }

  // 1. Check for updates
  ipcMain.handle('updates:check', async () => {
    try {
      if (!mainWindow) return null

      // In Dev Mode, autoUpdater often fails or is skipped.
      // We'll perform a manual GitHub API check to see if a newer version exists.
      if (!app.isPackaged) {
        console.log('[Updater] Running manual version check in dev mode...')
        return new Promise((resolve) => {
          const options = {
            hostname: 'api.github.com',
            path: '/repos/Saboor-Hamedi/dev-snippet/releases/latest',
            headers: { 'User-Agent': 'dev-snippet-app' },
            timeout: 5000
          }

          https
            .get(options, (res) => {
              let data = ''
              res.on('data', (chunk) => {
                data += chunk
              })
              res.on('end', () => {
                try {
                  if (res.statusCode !== 200) {
                    console.warn(`[Updater] GitHub API returned ${res.statusCode}`)
                    return resolve(null)
                  }

                  const json = JSON.parse(data)
                  const latestVersion = json.tag_name.replace(/^v/, '')
                  const currentVersion = app.getVersion()

                  console.log(`[Updater] Current: ${currentVersion}, Latest: ${latestVersion}`)

                  if (latestVersion !== currentVersion) {
                    resolve({
                      version: latestVersion,
                      releaseNotes: json.body,
                      isManualCheck: true
                    })
                  } else {
                    resolve(null)
                  }
                } catch (e) {
                  console.error('[Updater] Failed to parse GitHub response:', e)
                  resolve(null)
                }
              })
            })
            .on('error', (err) => {
              console.warn('[Updater] Dev mode manual check failed:', err.message)
              resolve(null)
            })
        })
      }

      // Production check using electron-updater
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
