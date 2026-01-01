/**
 * Database Core Engine
 *
 * This module manages the lifecycle of the local SQLite database.
 * It uses 'better-sqlite3' for high-performance, synchronous database operations
 * within the Electron main process.
 */

import { join } from 'path'
import fsSync from 'fs'
import Database from 'better-sqlite3'
import { createTables, createFTS5 } from './schema'
import { runMigrations } from './migrations'
import { createPreparedStatements } from './queries'

// Global singleton instances to persist the connection and pre-compiled queries
let db = null
let preparedStatements = null

/**
 * createBackup - Safety first!
 *
 * Automatically clones the snippets.db file before any major operations.
 * It implements a rolling backup system, keeping the last 20 versions
 * to prevent data loss even in case of file corruption or accidental deletion.
 */
export const createBackup = (dbPath, userDataPath, force = false) => {
  try {
    if (!fsSync.existsSync(dbPath)) return null

    // Check if database has content before backing up (prevent backing up empty state)
    if (!force) {
      const dbTemp = new Database(dbPath, { readonly: true })
      try {
        const count = dbTemp.prepare('SELECT count(*) as count FROM snippets').get().count
        if (count === 0) {
          console.log('ℹ️ Skipping auto-backup: Database is empty')
          dbTemp.close()
          return null
        }
      } catch (err) {
        console.warn('⚠️ Could not check database content for backup:', err.message)
      }
      dbTemp.close()
    }

    const backupDir = join(userDataPath, 'backups')
    if (!fsSync.existsSync(backupDir)) {
      fsSync.mkdirSync(backupDir, { recursive: true })
    }

    // Generate a clean ISO-timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = join(backupDir, `snippets-backup-${timestamp}.db`)

    // Perform a fast, native file copy
    fsSync.copyFileSync(dbPath, backupPath)

    // Maintenance: Clean up old backups to save disk space
    const backups = fsSync
      .readdirSync(backupDir)
      .filter((f) => f.startsWith('snippets-backup-'))
      .sort()
      .reverse()

    if (backups.length > 20) {
      backups.slice(20).forEach((f) => {
        try {
          fsSync.unlinkSync(join(backupDir, f))
        } catch (e) {
          console.warn('Failed to delete old backup:', f)
        }
      })
    }

    console.log(`✅ Database backup created: ${backupPath}`)
    return backupPath
  } catch (e) {
    console.warn('⚠️ Failed to create backup:', e.message)
    return null
  }
}

/**
 * initDB - The primary database bootstrapper.
 *
 * It manages the connection and applies critical SQLite PRAGMAs to optimize for
 * an Electron environment (favoring performance and non-blocking I/O).
 */
export const initDB = (app) => {
  const dbPath = join(app.getPath('userData'), 'snippets.db')
  const userDataPath = app.getPath('userData')

  // Create an automatic safety backup before we touch the database
  createBackup(dbPath, userDataPath)

  // Establish connection
  db = new Database(dbPath)

  /**
   * --- PERFORMANCE TUNING (Wal-Mode) ---
   * journal_mode = WAL: Massive performance boost for concurrent reads/writes.
   * cache_size = -64000: Allocates ~64MB of RAM for the page cache to speed up searches.
   * temp_store = MEMORY: Moves temp files to RAM to avoid disk I/O bottlenecks.
   * busy_timeout = 5000: Prevents "Database locked" errors during rapid saves.
   */
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('busy_timeout = 5000')
  db.pragma('cache_size = -64000')
  db.pragma('temp_store = MEMORY')
  db.pragma('mmap_size = 30000000000')
  db.pragma('page_size = 4096')
  db.pragma('auto_vacuum = INCREMENTAL')

  // 1. Structural Setup: Create base tables and FTS5 search indexes
  createTables(db)
  createFTS5(db)

  // 2. Data Integrity: Run any pending database migrations
  runMigrations(db)

  // 3. Optimization: Compile all SQL queries once into "Prepared Statements"
  // to avoid parsing overhead during high-frequency IPC requests.
  preparedStatements = createPreparedStatements(db)

  return db
}

/**
 * getDB - Persistent connection accessor.
 */
export const getDB = (app) => {
  if (!db) {
    return initDB(app)
  }
  return db
}

/**
 * getPreparedStatements - Returns pre-compiled queries for the IPC layer.
 */
export const getPreparedStatements = () => {
  return preparedStatements
}
