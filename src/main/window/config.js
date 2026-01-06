/**
 * Window Configuration
 * Defines the main window settings
 */

import { join } from 'path'
import fsSync from 'fs'

export const getWindowConfig = (app, ENABLE_DEVTOOLS) => {
  // Choose appropriate icon for the current platform
  let iconPath

  if (app.isPackaged) {
    iconPath =
      process.platform === 'win32'
        ? join(process.resourcesPath, 'icon.ico')
        : join(process.resourcesPath, 'icon.png')
  } else {
    // In dev, use project path directly
    const projectRoot = join(__dirname, '../..')
    iconPath =
      process.platform === 'win32'
        ? join(projectRoot, 'resources/icon.ico')
        : join(projectRoot, 'resources/icon.png')
  }

  // Check if icon exists, try fallbacks
  try {
    if (!fsSync.existsSync(iconPath)) {
      const root = join(__dirname, '../..')
      const fallbacks = [
        join(root, 'build/icons/win/icon.ico'),
        join(root, 'build/icons/png/512x512.png'),
        join(root, 'build/icons/png/icon.png'),
        join(root, 'build/icon.ico'),
        join(root, 'build/icon.png'),
        join(root, 'resources/icon.ico'),
        join(root, 'resources/icon.png')
      ]

      for (const fallback of fallbacks) {
        if (fsSync.existsSync(fallback)) {
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
    height: 900,
    minWidth: 800,
    minHeight: 600,
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
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: true,
      sandbox: false,
      devTools: ENABLE_DEVTOOLS
    },
    roundedCorners: false,
    backgroundColor: '#1f2937' // Use a dark grey that matches app theme to prevent white flash
  }
}
