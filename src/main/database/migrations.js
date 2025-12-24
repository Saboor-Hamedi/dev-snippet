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
    const colsSnippets = db.prepare('PRAGMA table_info(snippets)').all()
    const ensureCol = (name, ddl) => {
      if (!colsSnippets.some((c) => c.name === name)) {
        db.exec(ddl)
      }
    }

    ensureCol('tags', 'ALTER TABLE snippets ADD COLUMN tags TEXT')
    ensureCol('code_draft', 'ALTER TABLE snippets ADD COLUMN code_draft TEXT')
    ensureCol('is_draft', 'ALTER TABLE snippets ADD COLUMN is_draft INTEGER')
    ensureCol('sort_index', 'ALTER TABLE snippets ADD COLUMN sort_index INTEGER')
    ensureCol('is_deleted', 'ALTER TABLE snippets ADD COLUMN is_deleted INTEGER DEFAULT 0') // Default to 0 (not deleted)
    ensureCol('deleted_at', 'ALTER TABLE snippets ADD COLUMN deleted_at INTEGER') // Timestamp of deletion
  } catch (e) {
    console.warn('Migration warning:', e.message)
  }
}
