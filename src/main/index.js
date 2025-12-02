import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs/promises'
import Database from 'better-sqlite3'

// console.log('Process versions:', process.versions)

let db

function initDB() {
  const dbPath = join(app.getPath('userData'), 'snippets.db')
  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('busy_timeout = 5000')

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT,
      code TEXT,
      code_draft TEXT,
      language TEXT,
      timestamp INTEGER,
      type TEXT,
      tags TEXT,
      is_draft INTEGER,
      sort_index INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS theme (
      id TEXT PRIMARY KEY,
      name TEXT,
      colors TEXT
    );
  `)

  try {
    db.exec('DROP TABLE IF EXISTS projects')
  } catch {}

  // Ensure optional columns exist (migrations)
  try {
    const colsSnippets = db.prepare('PRAGMA table_info(snippets)').all()
    const ensureCol = (name, ddl) => {
      if (!colsSnippets.some((c) => c.name === name)) db.exec(ddl)
    }
    ensureCol('tags', 'ALTER TABLE snippets ADD COLUMN tags TEXT')
    ensureCol('code_draft', 'ALTER TABLE snippets ADD COLUMN code_draft TEXT')
    ensureCol('is_draft', 'ALTER TABLE snippets ADD COLUMN is_draft INTEGER')
    ensureCol('sort_index', 'ALTER TABLE snippets ADD COLUMN sort_index INTEGER')
  } catch {}

  // Projects removed

  return db
}

function getDB() {
  if (!db) {
    return initDB()
  }
  return db
}

function createWindow() {
  // Create the browser window.
    // Choose appropriate icon for the current platform.
    // Use a .ico on Windows (preferred), fall back to the PNG for other platforms/dev.
    const iconPath = process.platform === 'win32'
      ? join(__dirname, '..', 'resources', 'icon.ico')
      : join(__dirname, '../renderer/public/icon.png')
  
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    // Set the window icon based on the platform
    icon: iconPath,
    show: false,

    // remove frame for a cleaner look 
    frame: false,  // Remove the frame for a custom title bar
    // NOTE: Transparent windows on some platforms (Windows) can interfere
    // with native resizing/restore behavior. Keep `transparent: false`
    // to allow OS resizing and reliable minimize/maximize/restore.
    transparent: false,
    // Allow resizing and maximizing so the user can restore size
    // after minimize/compact actions.
    resizable: true,
    maximizable: true,
    minimizable: true,

    autoHideMenuBar: true,
    // alwaysOnTop: true, 
    focusable: true,
    // skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: true,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const url = new URL(details.url)
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        shell.openExternal(details.url)
      }
    } catch {}
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  const isDev = !app.isPackaged
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('dev-dialect.quick-snippets')
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    // optimizer.watchWindowShortcuts(window) // Commented out due to electron-toolkit bug
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Window controls
  ipcMain.handle('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.minimize()
    return true
  })

  ipcMain.handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && !win.isMaximized()) win.maximize()
    return true
  })

  ipcMain.handle('window:unmaximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && win.isMaximized()) win.unmaximize()
    return true
  })

  ipcMain.handle('window:toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) win.unmaximize()
      else win.maximize()
    }
    return true
  })

  ipcMain.handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.close()
    return true
  })

  // Window bounds helpers for custom resize handles
  ipcMain.handle('window:getBounds', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    return win.getBounds()
  })

  ipcMain.handle('window:setBounds', (event, bounds) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) return false
      // bounds: { x, y, width, height }
      win.setBounds(bounds)
      return true
    } catch (err) {
      console.error('Failed to set window bounds', err)
      return false
    }
  })

  ipcMain.handle('window:restore-default-size', (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) return false
      if (win.isMaximized()) win.unmaximize()
      // Restore default/min sizes
      win.setMinimumSize(600, 400)
      win.setSize(800, 600)
      // Center for a predictable restore position
      try {
        win.center()
      } catch {}
      return true
    } catch (err) {
      console.error('Failed to restore default window size', err)
      return false
    }
  })

  // File System IPC Handlers
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile']
    })
    if (canceled) {
      return null
    } else {
      return filePaths[0]
    }
  })

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled) {
      return null
    } else {
      return filePaths[0]
    }
  })

  ipcMain.handle('dialog:saveFile', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: 'snippets-export.json'
    })
    if (canceled) {
      return null
    } else {
      return filePath
    }
  })

  ipcMain.handle('fs:readFile', async (event, path) => {
    try {
      if (typeof path !== 'string') throw new Error('Invalid path')
      const content = await fs.readFile(path, 'utf-8')
      return content
    } catch (err) {
      console.error('Error reading file:', err)
      throw err
    }
  })

  ipcMain.handle('fs:writeFile', async (event, path, content) => {
    try {
      if (typeof path !== 'string') throw new Error('Invalid path')
      if (typeof content !== 'string') throw new Error('Invalid content')
      await fs.writeFile(path, content, 'utf-8')
      return true
    } catch (err) {
      console.error('Error writing file:', err)
      throw err
    }
  })

  ipcMain.handle('fs:readDirectory', async (event, path) => {
    try {
      if (typeof path !== 'string') throw new Error('Invalid path')
      const files = await fs.readdir(path, { withFileTypes: true })
      return files.map((file) => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: join(path, file.name)
      }))
    } catch (err) {
      console.error('Error reading directory:', err)
      throw err
    }
  })

  // Database IPC Handlers
  const db = getDB()

  // Snippets
  ipcMain.handle('db:getSnippets', () => {
    return db
      .prepare('SELECT * FROM snippets ORDER BY COALESCE(sort_index, 0) ASC, title ASC')
      .all()
  })

  // insert or update snippet
  ipcMain.handle('db:saveSnippet', (event, snippet) => {
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO snippets (id, title, code, language, timestamp, type, tags, is_draft, sort_index) VALUES (@id, @title, @code, @language, @timestamp, @type, @tags, @is_draft, @sort_index)'
    )
    stmt.run({ ...snippet, tags: snippet.tags || '', is_draft: snippet.is_draft ? 1 : 0 })
    return true
  })

  ipcMain.handle('db:deleteSnippet', (event, id) => {
    db.prepare('DELETE FROM snippets WHERE id = ?').run(id)
    return true
  })


  // Batch order update
  // Order update handlers removed per request

  // Draft handlers
  ipcMain.handle('db:saveSnippetDraft', (event, payload) => {
    const { id, code_draft, language } = payload
    const stmt = db.prepare(
      'UPDATE snippets SET code_draft = ?, is_draft = 1, language = COALESCE(?, language) WHERE id = ?'
    )
    stmt.run(code_draft, language || null, id)
    return true
  })

  ipcMain.handle('db:commitSnippetDraft', (event, id) => {
    const row = db.prepare('SELECT code_draft FROM snippets WHERE id = ?').get(id)
    if (row && row.code_draft != null) {
      const stmt = db.prepare(
        'UPDATE snippets SET code = code_draft, code_draft = NULL, is_draft = 0, timestamp = ? WHERE id = ?'
      )
      stmt.run(Date.now(), id)
    }
    return true
  })

  // Projects removed

  // Settings (Theme)
  ipcMain.handle('db:getSetting', (event, key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
    return row ? row.value : null
  })

  ipcMain.handle('db:saveSetting', (event, key, value) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
    return true
  })

  ipcMain.handle('db:getTheme', () => {
    const row = db.prepare('SELECT id, name, colors FROM theme WHERE id = ?').get('current')
    return row || null
  })

  ipcMain.handle('db:saveTheme', (event, theme) => {
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO theme (id, name, colors) VALUES (@id, @name, @colors)'
    )
    stmt.run(theme)
    return true
  })

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

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
