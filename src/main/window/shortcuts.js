/**
 * Keyboard Shortcuts for DevTools
 */

export const setupDevToolsShortcuts = (mainWindow, ENABLE_DEVTOOLS) => {
  if (!ENABLE_DEVTOOLS) return

  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Only handle keyDown events, not keyUp (prevents double-firing)
    if (input.type !== 'keyDown') {
      return
    }

    // Ctrl+Shift+I or F12 to toggle DevTools
    if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
      event.preventDefault() // Prevent default behavior
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      } else {
        mainWindow.webContents.openDevTools()
      }
      return // Stop here, don't let it propagate
    }

    // Allow all other shortcuts to pass through to the renderer
    // This includes Ctrl+F (find), Ctrl+R (rename), Ctrl+S (save), etc.
  })
}
