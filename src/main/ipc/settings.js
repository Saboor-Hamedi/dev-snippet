/**
 * Settings File IPC Handlers
 */

import { ipcMain } from 'electron'
import path from 'path'
import fs from 'fs/promises'

export const createSettingsHandlers = (app, mainWindow) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json')

  // Read User Settings
  ipcMain.handle('settings:read', async () => {
    try {
      const data = await fs.readFile(settingsPath, 'utf-8')
      return data
    } catch (err) {
      if (err.code === 'ENOENT') {
        const defaultSettings = JSON.stringify({}, null, 2)
        await fs.writeFile(settingsPath, defaultSettings, 'utf-8')
        return defaultSettings
      }
      throw err
    }
  })

  // Write User Settings
  ipcMain.handle('settings:write', async (event, content) => {
    await fs.writeFile(settingsPath, content, 'utf-8')
    return true
  })

  // === READ DEFAULT SETTINGS (Preserves Comments) ===
  ipcMain.handle('settings:readDefault', async () => {
    try {
      const isDev = !app.isPackaged
      const filePath = isDev
        ? path.join(process.cwd(), 'src/renderer/src/config/defaultSettings.js')
        : path.join(process.resourcesPath, 'app.asar/src/renderer/src/config/defaultSettings.js')

      return await fs.readFile(filePath, 'utf-8')
    } catch (err) {
      console.error('Failed to read default settings:', err)
      throw err
    }
  })

  ipcMain.handle('settings:getPath', () => settingsPath)

  return {
    stopWatcher: () => {}
  }
}
