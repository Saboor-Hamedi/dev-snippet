/**
 * Prepared SQL Statements
 * Pre-compiled queries for better performance
 */

export const createPreparedStatements = (db) => {
  return {
    // Optimized: Get only metadata first (exclude deleted)
    getMetadata: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index, folder_id FROM snippets WHERE is_deleted = 0 ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC'
    ),
    getMetadataPaginated: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index, folder_id FROM snippets WHERE is_deleted = 0 ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC LIMIT ? OFFSET ?'
    ),
    // Full content only when needed (exclude deleted)
    getAll: db.prepare(
      'SELECT * FROM snippets WHERE is_deleted = 0 ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC'
    ),
    getById: db.prepare('SELECT * FROM snippets WHERE id = ?'),
    getRecent: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index, folder_id FROM snippets WHERE is_draft = 0 AND is_deleted = 0 ORDER BY timestamp DESC LIMIT ?'
    ),
    getTrash: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, deleted_at FROM snippets WHERE is_deleted = 1 ORDER BY deleted_at DESC'
    ),
    save: db.prepare(`
      INSERT OR REPLACE INTO snippets 
      (id, title, code, language, timestamp, type, tags, is_draft, sort_index, folder_id, is_deleted)
      VALUES (@id, @title, @code, @language, @timestamp, @type, @tags, @is_draft, @sort_index, @folder_id, 0)
    `),
    softDelete: db.prepare('UPDATE snippets SET is_deleted = 1, deleted_at = ? WHERE id = ?'),
    restore: db.prepare('UPDATE snippets SET is_deleted = 0, deleted_at = NULL WHERE id = ?'),
    permanentDelete: db.prepare('DELETE FROM snippets WHERE id = ?'),

    // --- FOLDER QUERIES ---
    getFolders: db.prepare(
      'SELECT * FROM folders WHERE is_deleted = 0 ORDER BY COALESCE(sort_index, 0) ASC, name COLLATE NOCASE ASC'
    ),
    getFolderTrash: db.prepare(
      'SELECT * FROM folders WHERE is_deleted = 1 ORDER BY deleted_at DESC'
    ),
    getFolderById: db.prepare('SELECT * FROM folders WHERE id = ?'),
    saveFolder: db.prepare(`
      INSERT OR REPLACE INTO folders (id, name, parent_id, collapsed, sort_index, created_at, updated_at, is_deleted)
      VALUES (@id, @name, @parent_id, @collapsed, @sort_index, @created_at, @updated_at, 0)
    `),
    softDeleteFolder: db.prepare('UPDATE folders SET is_deleted = 1, deleted_at = ? WHERE id = ?'),
    restoreFolder: db.prepare('UPDATE folders SET is_deleted = 0, deleted_at = NULL WHERE id = ?'),
    deleteFolder: db.prepare('DELETE FROM folders WHERE id = ?'),
    updateFolderParent: db.prepare('UPDATE folders SET parent_id = ?, updated_at = ? WHERE id = ?'),
    updateSnippetFolder: db.prepare(
      'UPDATE snippets SET folder_id = ?, timestamp = ? WHERE id = ?'
    ),
    toggleFolderCollapse: db.prepare('UPDATE folders SET collapsed = ? WHERE id = ?')
  }
}
