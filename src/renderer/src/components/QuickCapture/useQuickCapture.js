import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

let quickCaptureWindow = null

export const createQuickCaptureWindow = (app, ENABLE_DEVTOOLS) => {
  if (quickCaptureWindow) {
    if (quickCaptureWindow.isVisible()) {
      quickCaptureWindow.hide()
    } else {
      positionAndShow()
    }
    return quickCaptureWindow
  }

  const { width } = screen.getPrimaryDisplay().workAreaSize

  quickCaptureWindow = new BrowserWindow({
    width: 650,
    height: 350, // Increased to accommodate textarea + glow
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  quickCaptureWindow.on('closed', () => {
    quickCaptureWindow = null
  })

  // Constants for DRY (Should match QuickCapture.css)
  const WIN_WIDTH = 650
  const WIN_HEIGHT = 350

  // Center horizontally, but place at 150px from top
  const positionAndShow = () => {
    if (!quickCaptureWindow || quickCaptureWindow.isDestroyed()) return
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
    quickCaptureWindow.setPosition(Math.floor(screenWidth / 2 - WIN_WIDTH / 2), 150)
    quickCaptureWindow.show()
    quickCaptureWindow.focus()
    // 🧹 Signal the renderer to clear the previous input
    quickCaptureWindow.webContents.send('qc:reset')
  }

  quickCaptureWindow.on('blur', () => {
    if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) {
      quickCaptureWindow.hide()
    }
  })

  // Load with query param
  if (ENABLE_DEVTOOLS && process.env['ELECTRON_RENDERER_URL']) {
    quickCaptureWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?mode=quick-capture`)
  } else {
    quickCaptureWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { mode: 'quick-capture' }
    })
  }

  return quickCaptureWindow
}

export const toggleQuickCapture = (app, ENABLE_DEVTOOLS) => {
  if (!quickCaptureWindow || quickCaptureWindow.isDestroyed()) {
    createQuickCaptureWindow(app, ENABLE_DEVTOOLS)
    // The create call will show it correctly.
    // Wait for it to be ready
    quickCaptureWindow.once('ready-to-show', () => {
      const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
      quickCaptureWindow.setPosition(Math.floor(screenWidth / 2 - 325), 150)
      quickCaptureWindow.show()
      quickCaptureWindow.focus()
    })
  } else {
    if (quickCaptureWindow.isVisible()) {
      quickCaptureWindow.hide()
    } else {
      const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
      quickCaptureWindow.setPosition(Math.floor(screenWidth / 2 - 325), 150)
      quickCaptureWindow.show()
      quickCaptureWindow.focus()
      quickCaptureWindow.webContents.send('qc:reset')
    }
  }
}
