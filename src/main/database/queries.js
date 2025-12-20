/**
 * Prepared SQL Statements
 * Pre-compiled queries for better performance
 */

export const createPreparedStatements = (db) => {
  return {
    // Optimized for performance: Get only metadata first
    getMetadata: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index FROM snippets ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC'
    ),
    getMetadataPaginated: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index FROM snippets ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC LIMIT ? OFFSET ?'
    ),
    // Full content only when needed
    getAll: db.prepare(
      'SELECT * FROM snippets ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC'
    ),
    getById: db.prepare('SELECT * FROM snippets WHERE id = ?'),
    getRecent: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index FROM snippets WHERE is_draft = 0 ORDER BY timestamp DESC LIMIT ?'
    ),
    save: db.prepare(`
      INSERT OR REPLACE INTO snippets 
      (id, title, code, language, timestamp, type, tags, is_draft, sort_index)
      VALUES (@id, @title, @code, @language, @timestamp, @type, @tags, @is_draft, @sort_index)
    `),
    delete: db.prepare('DELETE FROM snippets WHERE id = ?')
  }
}
