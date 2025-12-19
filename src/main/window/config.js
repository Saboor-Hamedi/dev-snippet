/**
 * Window Configuration
 * Defines the main window settings
 */

const { join } = require('path')
const fsSync = require('fs')

const getWindowConfig = (app, ENABLE_DEVTOOLS) => {
  // Choose appropriate icon for the current platform
  let iconPath

  if (app.isPackaged) {
    iconPath =
      process.platform === 'win32'
        ? join(process.resourcesPath, 'icon.ico')
        : join(process.resourcesPath, 'icon.png')
  } else {
    iconPath =
      process.platform === 'win32'
        ? join(__dirname, '../../../resources/icon.ico')
        : join(__dirname, '../../../resources/icon.png')
  }

  // Check if icon exists, try fallbacks
  try {
    if (!fsSync.existsSync(iconPath)) {
      const fallbacks = [
        join(__dirname, '../../../build/icon.ico'),
        join(__dirname, '../../../build/icon.png'),
        join(__dirname, '../../../resources/icon.ico'),
        join(__dirname, '../../../resources/icon.png')
      ]

      for (const fallback of fallbacks) {
        if (fsSync.existsSync(fallback)) {
          console.log(`✅ Using fallback icon: ${fallback}`)
          iconPath = fallback
          break
        }
      }
    }
  } catch (err) {
    console.log(`Error checking icon: ${err.message}`)
  }

  return {
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    icon: iconPath,
    show: false,
    frame: false,
    transparent: false,
    resizable: true,
    maximizable: true,
    minimizable: true,
    autoHideMenuBar: true,
    focusable: true,
    webPreferences: {
      preload: join(__dirname, '../../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: true,
      sandbox: false,
      devTools: ENABLE_DEVTOOLS
    },
    roundedCorners: false
  }
}

module.exports = { getWindowConfig }
