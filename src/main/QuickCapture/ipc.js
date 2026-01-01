/**
 * Quick Capture IPC Bridge
 * -------------------------------------------------
 * Exposes renderer-friendly commands that toggle the Quick Capture window
 * without giving direct access to Electron primitives.
 */

import { ipcMain } from 'electron'
import { toggleQuickCapture } from './index'

const CHANNEL = 'quickCapture:toggle'

/**
 * Register the single IPC command used by the renderer + global shortcuts.
 */
export const registerQuickCaptureHandlers = (app, enableDevtools) => {
  ipcMain.handle(CHANNEL, () => {
    toggleQuickCapture(enableDevtools)
  })

  app.on('will-quit', () => {
    ipcMain.removeHandler(CHANNEL)
  })
}
