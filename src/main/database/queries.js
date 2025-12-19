/**
 * Prepared SQL Statements
 * Pre-compiled queries for better performance
 */

const createPreparedStatements = (db) => {
  return {
    getAll: db.prepare(
      'SELECT * FROM snippets ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC'
    ),
    getById: db.prepare('SELECT * FROM snippets WHERE id = ?'),
    getRecent: db.prepare(
      'SELECT * FROM snippets WHERE is_draft = 0 ORDER BY timestamp DESC LIMIT ?'
    ),
    save: db.prepare(`
      INSERT OR REPLACE INTO snippets 
      (id, title, code, language, timestamp, type, tags, is_draft, sort_index)
      VALUES (@id, @title, @code, @language, @timestamp, @type, @tags, @is_draft, @sort_index)
    `),
    delete: db.prepare('DELETE FROM snippets WHERE id = ?')
  }
}

module.exports = { createPreparedStatements }
