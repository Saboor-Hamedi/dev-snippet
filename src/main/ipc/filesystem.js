/**
 * Filesystem IPC Handlers
 */

import { ipcMain, dialog, shell } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export const registerFilesystemHandlers = (appInstance) => {
  // Use passed instance to avoid top-level 'app' import circularity
  const getApp = () => appInstance || require('electron').app

  // Open in system browser
  ipcMain.handle('shell:previewInBrowser', async (event, htmlContent) => {
    try {
      const app = getApp()
      const tempPath = path.join(app.getPath('temp'), 'dev-snippet-preview.html')
      await fs.writeFile(tempPath, htmlContent, 'utf-8')
      await shell.openPath(tempPath)
      return true
    } catch (err) {
      console.error('Failed to open external preview:', err)
      return false
    }
  })

  // Open file dialog
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md', 'js', 'json', 'html', 'css'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Save asset
  ipcMain.handle('fs:saveAsset', async (event, { fileName, buffer }) => {
    try {
      const app = getApp()
      const userDataPath = app.getPath('userData')
      const assetsPath = path.join(userDataPath, 'assets')

      try {
        await fs.access(assetsPath)
      } catch {
        await fs.mkdir(assetsPath, { recursive: true })
      }

      let finalFileName = fileName
      let filePath = path.join(assetsPath, finalFileName)

      try {
        await fs.access(filePath)
        const namePart = path.parse(fileName).name
        const extPart = path.parse(fileName).ext
        finalFileName = `${namePart}-${Date.now()}${extPart}`
        filePath = path.join(assetsPath, finalFileName)
      } catch {}

      await fs.writeFile(filePath, Buffer.from(buffer))
      return `asset://${finalFileName}`
    } catch (err) {
      console.error('Failed to save asset:', err)
      return null
    }
  })
}
