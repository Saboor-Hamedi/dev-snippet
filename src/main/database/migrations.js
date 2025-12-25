/**
 * Database Migrations
 * Handles adding optional columns to existing tables
 */

export const runMigrations = (db) => {
  try {
    // Drop old projects table if it exists
    db.exec('DROP TABLE IF EXISTS projects')
  } catch {}

  // Ensure optional columns exist
  try {
    const ensureCol = (table, name, ddl) => {
      const info = db.prepare(`PRAGMA table_info(${table})`).all()
      if (!info.some((c) => c.name === name)) {
        db.exec(ddl)
      }
    }

    // Snippets table migrations
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

    // Folders table migrations
    ensureCol(
      'folders',
      'is_deleted',
      'ALTER TABLE folders ADD COLUMN is_deleted INTEGER DEFAULT 0'
    )
    ensureCol('folders', 'deleted_at', 'ALTER TABLE folders ADD COLUMN deleted_at INTEGER')
  } catch (e) {
    console.warn('Migration warning:', e.message)
  }
}
