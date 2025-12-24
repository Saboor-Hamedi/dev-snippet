/**
 * Prepared SQL Statements
 * Pre-compiled queries for better performance
 */

export const createPreparedStatements = (db) => {
  return {
    // Optimized: Get only metadata first (exclude deleted)
    getMetadata: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index FROM snippets WHERE is_deleted = 0 ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC'
    ),
    getMetadataPaginated: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index FROM snippets WHERE is_deleted = 0 ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC LIMIT ? OFFSET ?'
    ),
    // Full content only when needed (exclude deleted)
    getAll: db.prepare(
      'SELECT * FROM snippets WHERE is_deleted = 0 ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC'
    ),
    getById: db.prepare('SELECT * FROM snippets WHERE id = ?'),
    getRecent: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index FROM snippets WHERE is_draft = 0 AND is_deleted = 0 ORDER BY timestamp DESC LIMIT ?'
    ),
    getTrash: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, deleted_at FROM snippets WHERE is_deleted = 1 ORDER BY deleted_at DESC'
    ),
    save: db.prepare(`
      INSERT OR REPLACE INTO snippets 
      (id, title, code, language, timestamp, type, tags, is_draft, sort_index, is_deleted)
      VALUES (@id, @title, @code, @language, @timestamp, @type, @tags, @is_draft, @sort_index, 0)
    `),
    softDelete: db.prepare('UPDATE snippets SET is_deleted = 1, deleted_at = ? WHERE id = ?'),
    restore: db.prepare('UPDATE snippets SET is_deleted = 0, deleted_at = NULL WHERE id = ?'),
    permanentDelete: db.prepare('DELETE FROM snippets WHERE id = ?')
  }
}
