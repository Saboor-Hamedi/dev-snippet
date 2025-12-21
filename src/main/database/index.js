/**
 * Database Initialization and Management
 */

import { join } from 'path'
import fsSync from 'fs'
import Database from 'better-sqlite3'
import { createTables, createFTS5 } from './schema'
import { runMigrations } from './migrations'
import { createPreparedStatements } from './queries'

let db = null
let preparedStatements = null

/**
 * Initialize database with automatic backup
 */
export const initDB = (app) => {
  const dbPath = join(app.getPath('userData'), 'snippets.db')

  // Create automatic backup before opening database
  try {
    if (fsSync.existsSync(dbPath)) {
      const backupDir = join(app.getPath('userData'), 'backups')
      if (!fsSync.existsSync(backupDir)) {
        fsSync.mkdirSync(backupDir, { recursive: true })
      }

      // Create timestamped backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = join(backupDir, `snippets-backup-${timestamp}.db`)
      fsSync.copyFileSync(dbPath, backupPath)

      // Keep only last 10 backups
      const backups = fsSync
        .readdirSync(backupDir)
        .filter((f) => f.startsWith('snippets-backup-'))
        .sort()
        .reverse()

      if (backups.length > 10) {
        backups.slice(10).forEach((f) => {
          try {
            fsSync.unlinkSync(join(backupDir, f))
          } catch (e) {
            console.warn('Failed to delete old backup:', f)
          }
        })
      }

      console.log(`✅ Database backup created: ${backupPath}`)
    }
  } catch (e) {
    console.warn('⚠️ Failed to create backup:', e.message)
  }

  // Open database
  db = new Database(dbPath)

  // Performance optimizations
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('busy_timeout = 5000')
  db.pragma('cache_size = -64000')
  db.pragma('temp_store = MEMORY')
  db.pragma('mmap_size = 30000000000')
  db.pragma('page_size = 4096')
  db.pragma('auto_vacuum = INCREMENTAL')

  // Create schema
  createTables(db)
  createFTS5(db)

  // Run migrations
  runMigrations(db)

  // Create prepared statements
  preparedStatements = createPreparedStatements(db)

  return db
}

/**
 * Get database instance
 */
export const getDB = (app) => {
  if (!db) {
    return initDB(app)
  }
  return db
}

/**
 * Get prepared statements
 */
export const getPreparedStatements = () => {
  return preparedStatements
}
