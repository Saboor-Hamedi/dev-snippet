import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs/promises'
import Database from 'better-sqlite3'

console.log('Process versions:', process.versions)

let db

function initDB() {
  const dbPath = join(app.getPath('userData'), 'snippets.db')
  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT,
      code TEXT,
      language TEXT,
      timestamp INTEGER,
      type TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT,
      code TEXT,
      language TEXT,
      timestamp INTEGER,
      type TEXT
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

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
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
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
    app.setAppUserModelId('com.electron')
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    // optimizer.watchWindowShortcuts(window) // Commented out due to electron-toolkit bug
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

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
      const content = await fs.readFile(path, 'utf-8')
      return content
    } catch (err) {
      console.error('Error reading file:', err)
      throw err
    }
  })

  ipcMain.handle('fs:writeFile', async (event, path, content) => {
    try {
      await fs.writeFile(path, content, 'utf-8')
      return true
    } catch (err) {
      console.error('Error writing file:', err)
      throw err
    }
  })

  ipcMain.handle('fs:readDirectory', async (event, path) => {
    try {
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
    return db.prepare('SELECT * FROM snippets ORDER BY title ASC').all()
  })

  // insert or update snippet
  ipcMain.handle('db:saveSnippet', (event, snippet) => {
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO snippets (id, title, code, language, timestamp, type) VALUES (@id, @title, @code, @language, @timestamp, @type)'
    )
    stmt.run(snippet)
    return true
  })

  ipcMain.handle('db:deleteSnippet', (event, id) => {
    db.prepare('DELETE FROM snippets WHERE id = ?').run(id)
    return true
  })

  // Projects
  ipcMain.handle('db:getProjects', () => {
    return db.prepare('SELECT * FROM projects ORDER BY title ASC').all()
  })

  ipcMain.handle('db:saveProject', (event, project) => {
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO projects (id, title, code, language, timestamp, type) VALUES (@id, @title, @code, @language, @timestamp, @type)'
    )
    stmt.run(project)
    return true
  })

  ipcMain.handle('db:deleteProject', (event, id) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
    return true
  })

  // Settings (Theme)
  ipcMain.handle('db:getSetting', (event, key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
    return row ? row.value : null
  })

  ipcMain.handle('db:saveSetting', (event, key, value) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
    return true
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
