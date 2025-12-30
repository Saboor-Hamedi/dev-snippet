/**
 * Database Migrations
 *
 * In a local desktop app, we can't easily run SQL scripts for every update.
 * This module implements a "Defensive Column Injection" strategy.
 * On every boot, it checks the current schema and patches it with any
 * newly required columns, ensuring the database evolves gracefully
 * without losing user data.
 */

export const runMigrations = (db) => {
  try {
    // Legacy Cleanup: Remove tables that are no longer part of the architecture.
    db.exec('DROP TABLE IF EXISTS projects')
  } catch {}

  /**
   * ensureCol - A robust helper to add a column only if it's missing.
   * This prevents "duplicate column" errors if the app restarts multiple times.
   */
  try {
    const ensureCol = (table, name, ddl) => {
      // Query SQLite's internal schema metadata
      const info = db.prepare(`PRAGMA table_info(${table})`).all()
      const exists = info.some((c) => c.name === name)

      if (!exists) {
        console.log(`🔧 Migrating: Adding [${name}] to [${table}]`)
        db.exec(ddl)
      }
    }

    // --- SNIPPET TABLE EVOLUTION ---
    ensureCol('snippets', 'tags', 'ALTER TABLE snippets ADD COLUMN tags TEXT')
    ensureCol('snippets', 'code_draft', 'ALTER TABLE snippets ADD COLUMN code_draft TEXT')
    ensureCol('snippets', 'is_draft', 'ALTER TABLE snippets ADD COLUMN is_draft INTEGER')
    ensureCol('snippets', 'sort_index', 'ALTER TABLE snippets ADD COLUMN sort_index INTEGER')
    ensureCol(
      'snippets',
      'is_deleted',
      'ALTER TABLE snippets ADD COLUMN is_deleted INTEGER DEFAULT 0'
    )
    ensureCol('snippets', 'deleted_at', 'ALTER TABLE snippets ADD COLUMN deleted_at INTEGER')
    ensureCol('snippets', 'folder_id', 'ALTER TABLE snippets ADD COLUMN folder_id TEXT')
    ensureCol(
      'snippets',
      'is_pinned',
      'ALTER TABLE snippets ADD COLUMN is_pinned INTEGER DEFAULT 0'
    )

    // Feature: Favorites support
    ensureCol(
      'snippets',
      'is_favorite',
      'ALTER TABLE snippets ADD COLUMN is_favorite INTEGER DEFAULT 0'
    )

    // --- FOLDER TABLE EVOLUTION ---
    ensureCol(
      'folders',
      'is_deleted',
      'ALTER TABLE folders ADD COLUMN is_deleted INTEGER DEFAULT 0'
    )
    ensureCol('folders', 'deleted_at', 'ALTER TABLE folders ADD COLUMN deleted_at INTEGER')
  } catch (e) {
    console.warn('⚠️ Migration warning (non-critical):', e.message)
  }
}
