/**
 * Filesystem IPC Handlers
 */

import { ipcMain, dialog, shell, app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export const registerFilesystemHandlers = () => {
  // Open in system browser (for perfect markdown preview)
  ipcMain.handle('shell:previewInBrowser', async (event, htmlContent) => {
    try {
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

  // Save file dialog
  ipcMain.handle('dialog:saveFile', async () => {
    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return result.canceled ? null : result.filePath
  })

  // Open directory dialog
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Save asset (Local Asset Management)
  ipcMain.handle('fs:saveAsset', async (event, { fileName, buffer }) => {
    try {
      const userDataPath = app.getPath('userData')
      const assetsPath = path.join(userDataPath, 'assets')

      // Ensure assets directory exists
      try {
        await fs.access(assetsPath)
      } catch {
        await fs.mkdir(assetsPath, { recursive: true })
      }

      let finalFileName = fileName
      let filePath = path.join(assetsPath, finalFileName)

      // Prevent Overwrite: Check if file exists, if so, rename
      try {
        await fs.access(filePath)
        // File exists, generate unique name
        const namePart = path.parse(fileName).name
        const extPart = path.parse(fileName).ext
        finalFileName = `${namePart}-${Date.now()}${extPart}`
        filePath = path.join(assetsPath, finalFileName)
      } catch {
        // File does not exist, use original name
      }

      await fs.writeFile(filePath, Buffer.from(buffer))

      // Return the custom protocol URL
      return `asset://${finalFileName}`
    } catch (err) {
      console.error('Failed to save asset:', err)
      return null
    }
  })
}
