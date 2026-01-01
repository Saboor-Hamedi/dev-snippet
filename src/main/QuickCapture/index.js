/**
 * Quick Capture Window Manager
 * ---------------------------------------------
 * Centralizes creation, positioning, and lifecycle management of the
 * lightweight Quick Capture window. The window is intentionally isolated
 * from the main BrowserWindow so it can behave like a global utility panel
 * that is summoned via keyboard shortcuts regardless of app focus.
 */

import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

// -- Layout constants -------------------------------------------------------
const QUICK_CAPTURE_WIDTH = 650
const QUICK_CAPTURE_HEIGHT = 350
const TOP_OFFSET = 150

// Lazily instantiated BrowserWindow reference (shared across toggles)
let quickCaptureWindow = null

/**
 * Returns the display (and work area) closest to the user's cursor.
 * This keeps the window anchored to the monitor the user is actively using.
 */
const getActiveWorkArea = () => {
  const cursorPoint = screen.getCursorScreenPoint()
  const nearestDisplay = screen.getDisplayNearestPoint(cursorPoint)
  return nearestDisplay.workArea
}

/**
 * Calculates the horizontal coordinate that keeps the window centered.
 */
const getCenteredX = () => {
  const { width, x } = getActiveWorkArea()
  return Math.floor(x + width / 2 - QUICK_CAPTURE_WIDTH / 2)
}

/**
 * Applies consistent positioning (horizontally centered, pinned near the top).
 */
const positionWindow = (win) => {
  if (!win || win.isDestroyed()) return
  const { y } = getActiveWorkArea()
  const x = getCenteredX()
  win.setPosition(x, y + TOP_OFFSET)
}

/**
 * Decides which renderer entry to load based on environment (dev vs prod).
 */
const loadQuickCaptureContent = (win, enableDevtools) => {
  if (enableDevtools && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?mode=quick-capture`)
    return
  }

  win.loadFile(join(__dirname, '../renderer/index.html'), {
    query: { mode: 'quick-capture' }
  })
}

/**
 * Ensures the renderer knows to clear previous input every time we re-open.
 */
const notifyRendererReset = (win) => {
  try {
    win.webContents.send('qc:reset')
  } catch (err) {
    console.error('Quick Capture reset notification failed:', err)
  }
}

/**
 * Creates a brand-new BrowserWindow with the frosted overlay look.
 */
const buildQuickCaptureWindow = () =>
  new BrowserWindow({
    width: QUICK_CAPTURE_WIDTH,
    height: QUICK_CAPTURE_HEIGHT,
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

/**
 * Wires up lifecycle clean-up so we never retain zombie references.
 */
const attachLifecycleHooks = (win) => {
  win.on('closed', () => {
    quickCaptureWindow = null
  })

  win.on('blur', () => {
    if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) {
      quickCaptureWindow.hide()
    }
  })
}

/**
 * Shows + focuses the window with the preferred cinematic placement.
 */
const revealWindow = (win) => {
  if (!win || win.isDestroyed()) return
  positionWindow(win)
  win.showInactive() // Avoid stealing focus from text fields instantly
  win.focus()
  notifyRendererReset(win)
}

/**
 * Accessor used by toggle logic and tests to guarantee a live window.
 */
export const ensureQuickCaptureWindow = (enableDevtools) => {
  if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) {
    return quickCaptureWindow
  }

  quickCaptureWindow = buildQuickCaptureWindow()
  attachLifecycleHooks(quickCaptureWindow)
  loadQuickCaptureContent(quickCaptureWindow, enableDevtools)

  return quickCaptureWindow
}

/**
 * Imperative API consumed by the global shortcut + IPC handlers.
 */
export const toggleQuickCapture = (enableDevtools) => {
  const win = ensureQuickCaptureWindow(enableDevtools)
  if (!win) return

  if (win.isVisible()) {
    win.hide()
    return
  }

  const startReveal = () => revealWindow(win)

  if (win.webContents?.isLoading()) {
    win.once('ready-to-show', startReveal)
  } else {
    startReveal()
  }
}

/**
 * Helper for diagnostics—allows callers to verify whether the panel is open.
 */
export const isQuickCaptureVisible = () => Boolean(quickCaptureWindow?.isVisible())
