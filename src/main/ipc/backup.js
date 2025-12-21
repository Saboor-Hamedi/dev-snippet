/**
 * Backup Management IPC Handlers
 */

import { ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs/promises'
import fsSync from 'fs'
import Database from 'better-sqlite3'
import { createBackup } from '../database/index'

export const registerBackupHandlers = (app, getDB) => {
  // Create manual backup
  ipcMain.handle('backup:create', async () => {
    try {
      const dbPath = join(app.getPath('userData'), 'snippets.db')
      const userDataPath = app.getPath('userData')

      // Use the helper with force=false for manual backups too, unless we want to allow empty backups
      const backupPath = createBackup(dbPath, userDataPath, false)

      if (backupPath) {
        return { success: true, path: backupPath }
      }
      return { success: false, message: 'Skipped: Database is empty or no changes detected' }
    } catch (error) {
      console.error('Manual backup failed:', error)
      return { success: false, message: error.message }
    }
  })

  // List available backups
  ipcMain.handle('backup:list', async () => {
    try {
      const backupDir = join(app.getPath('userData'), 'backups')

      if (!fsSync.existsSync(backupDir)) {
        return []
      }

      const files = await fs.readdir(backupDir)
      const backups = []

      for (const file of files) {
        if (file.startsWith('snippets-backup-') && file.endsWith('.db')) {
          const filePath = join(backupDir, file)
          const stats = await fs.stat(filePath)

          // Extract timestamp from filename
          const timestampStr = file.replace('snippets-backup-', '').replace('.db', '')
          const timestamp = timestampStr.replace(
            /T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/,
            'T$1:$2:$3.$4Z'
          )

          // Get a preview of contents
          let snippetCount = 0
          let preview = ''
          try {
            const tempDb = new Database(filePath, { readonly: true })
            const countRow = tempDb.prepare('SELECT count(*) as count FROM snippets').get()
            snippetCount = countRow ? countRow.count : 0

            const highlights = tempDb
              .prepare('SELECT title FROM snippets ORDER BY timestamp DESC LIMIT 3')
              .all()
            preview = highlights.map((h) => h.title || 'Untitled').join(', ')
            if (snippetCount > 3) preview += '...'

            tempDb.close()
          } catch (e) {
            console.warn(`Could not read backup info for ${file}:`, e.message)
            preview = 'Database unreadable'
          }

          backups.push({
            name: file,
            path: filePath,
            timestamp: timestamp,
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            sizeBytes: stats.size,
            snippetCount,
            preview
          })
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      return backups
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  })

  // Restore from backup (merge, not replace)
  ipcMain.handle('backup:restore', async (event, backupPath) => {
    try {
      // Open the backup database
      const backupDb = new Database(backupPath, { readonly: true })

      // Get all snippets from backup
      const backupSnippets = backupDb.prepare('SELECT * FROM snippets').all()

      // Also get settings (optional, but good for "all tables")
      let backupSettings = []
      try {
        backupSettings = backupDb.prepare('SELECT * FROM settings').all()
      } catch (e) {
        console.warn('Backup has no settings table')
      }

      backupDb.close()

      // Get current database
      const currentDb = getDB()

      // Merge snippets (add only new ones, skip duplicates)
      let added = 0
      let skipped = 0

      for (const snippet of backupSnippets) {
        const existing = currentDb.prepare('SELECT id FROM snippets WHERE id = ?').get(snippet.id)

        if (!existing) {
          const columns = Object.keys(snippet).join(', ')
          const placeholders = Object.keys(snippet)
            .map(() => '?')
            .join(', ')
          const values = Object.values(snippet)

          currentDb
            .prepare(`INSERT INTO snippets (${columns}) VALUES (${placeholders})`)
            .run(...values)
          added++
        } else {
          skipped++
        }
      }

      // Merge settings (overwrite only if missing or update some?)
      // For settings, we usually want to keep current settings or merge missing ones
      let settingsMerged = 0
      for (const setting of backupSettings) {
        const existing = currentDb
          .prepare('SELECT key FROM settings WHERE key = ?')
          .get(setting.key)
        if (!existing) {
          currentDb
            .prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
            .run(setting.key, setting.value)
          settingsMerged++
        }
      }

      return {
        success: true,
        added,
        skipped,
        settingsMerged,
        total: backupSnippets.length
      }
    } catch (error) {
      console.error('Failed to restore backup:', error)
      throw new Error(`Restore failed: ${error.message}`)
    }
  })
}
