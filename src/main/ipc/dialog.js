/**
 * Dialog IPC Handlers
 */

import { ipcMain, dialog } from 'electron'

export const registerDialogHandlers = () => {
  // Confirm delete dialog
  ipcMain.handle('confirm-delete', async (event, message) => {
    const res = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Cancel', 'Delete'],
      defaultId: 1,
      cancelId: 0,
      title: 'Confirm Delete',
      message: message || 'Delete this item?',
      noLink: true
    })
    return res.response === 1
  })
}
