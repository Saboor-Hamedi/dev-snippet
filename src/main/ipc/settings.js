/**
 * Settings File IPC Handlers
 */

import { ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs/promises'
import fsSync from 'fs'

let settingsWatcher = null
let lastSettingsContent = null

export const createSettingsHandlers = (app, mainWindow) => {
  const settingsPath = join(app.getPath('userData'), 'settings.json')

  // Watch settings file for external changes
  const startSettingsWatcher = () => {
    try {
      if (settingsWatcher) {
        settingsWatcher.close()
      }

      if (!fsSync.existsSync(settingsPath)) {
        return
      }

      settingsWatcher = fsSync.watch(settingsPath, async (eventType) => {
        if (eventType === 'change') {
          try {
            const newContent = await fs.readFile(settingsPath, 'utf-8')
            if (newContent !== lastSettingsContent) {
              lastSettingsContent = newContent
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('settings:changed', newContent)
              }
            }
          } catch (err) {
            console.error('Error reading settings file:', err)
          }
        }
      })
    } catch (err) {
      console.error('Failed to start settings watcher:', err)
    }
  }

  // Start watcher after a short delay
  setTimeout(startSettingsWatcher, 1000)

  // Read settings
  ipcMain.handle('settings:read', async () => {
    try {
      const data = await fs.readFile(settingsPath, 'utf-8')
      lastSettingsContent = data
      return data
    } catch (err) {
      if (err.code === 'ENOENT') {
        const defaultSettings = JSON.stringify({}, null, 2)
        await fs.writeFile(settingsPath, defaultSettings, 'utf-8')
        lastSettingsContent = defaultSettings
        return defaultSettings
      }
      throw err
    }
  })

  // Write settings
  ipcMain.handle('settings:write', async (event, content) => {
    if (typeof content !== 'string') throw new Error('Invalid content')
    await fs.writeFile(settingsPath, content, 'utf-8')
    lastSettingsContent = content
    startSettingsWatcher()
    return true
  })

  // Get settings path
  ipcMain.handle('settings:getPath', () => {
    return settingsPath
  })

  // Force create settings file
  ipcMain.handle('settings:forceCreate', async () => {
    const testSettings = {
      theme: 'dark',
      fontSize: 14,
      editor: { zoomLevel: 1.5 }
    }
    await fs.writeFile(settingsPath, JSON.stringify(testSettings, null, 2), 'utf-8')
    return true
  })

  return {
    stopWatcher: () => {
      if (settingsWatcher) {
        settingsWatcher.close()
      }
    }
  }
}
