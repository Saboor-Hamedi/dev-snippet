/**
 * Backup Management IPC Handlers
 */

const { ipcMain } = require('electron')
const { join } = require('path')
const fs = require('fs/promises')
const fsSync = require('fs')
const Database = require('better-sqlite3')

const registerBackupHandlers = (app, getDB) => {
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

          backups.push({
            name: file,
            path: filePath,
            timestamp: timestamp,
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            sizeBytes: stats.size
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
      backupDb.close()

      // Get current database
      const currentDb = getDB()

      // Merge snippets (add only new ones, skip duplicates)
      let added = 0
      let skipped = 0

      for (const snippet of backupSnippets) {
        // Check if snippet already exists
        const existing = currentDb.prepare('SELECT id FROM snippets WHERE id = ?').get(snippet.id)

        if (!existing) {
          // Add new snippet
          currentDb
            .prepare(
              `
            INSERT INTO snippets (id, title, code, code_draft, language, timestamp, type, tags, is_draft, sort_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
            )
            .run(
              snippet.id,
              snippet.title,
              snippet.code,
              snippet.code_draft,
              snippet.language,
              snippet.timestamp,
              snippet.type,
              snippet.tags,
              snippet.is_draft,
              snippet.sort_index
            )
          added++
        } else {
          skipped++
        }
      }

      return {
        success: true,
        added,
        skipped,
        total: backupSnippets.length
      }
    } catch (error) {
      console.error('Failed to restore backup:', error)
      throw new Error(`Restore failed: ${error.message}`)
    }
  })
}

module.exports = { registerBackupHandlers }
