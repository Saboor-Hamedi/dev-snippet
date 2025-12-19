/**
 * Filesystem IPC Handlers
 */

const { ipcMain, dialog } = require('electron')
const fs = require('fs/promises')

const registerFilesystemHandlers = () => {
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

  // Read file
  ipcMain.handle('fs:readFile', async (event, path) => {
    if (typeof path !== 'string') throw new Error('Invalid path')
    return await fs.readFile(path, 'utf-8')
  })

  // Write file
  ipcMain.handle('fs:writeFile', async (event, path, content) => {
    if (typeof path !== 'string') throw new Error('Invalid path')
    if (typeof content !== 'string') throw new Error('Invalid content')
    await fs.writeFile(path, content, 'utf-8')
    return true
  })

  // Read directory
  ipcMain.handle('fs:readDirectory', async (event, path) => {
    if (typeof path !== 'string') throw new Error('Invalid path')
    const files = await fs.readdir(path, { withFileTypes: true })
    return files.map((file) => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      isFile: file.isFile()
    }))
  })
}

module.exports = { registerFilesystemHandlers }
