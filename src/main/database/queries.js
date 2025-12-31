/**
 * Prepared SQL Statements
 *
 * This module pre-compiles all SQL queries into "Prepared Statements".
 * This is a major optimization: SQLite only needs to parse and plan these
 * queries once. Subsequent executions are significantly faster, especially
 * for rapid-fire IPC calls from the frontend.
 */

export const createPreparedStatements = (db) => {
  return {
    /**
     * --- SNIPPET METADATA QUERIES ---
     * Strategy: We only fetch the core metadata (IDs, titles, tags) for the
     * sidebar list. We exclude the 'code' content to keep the payload small
     * and UI snappy when the user has 1000s of snippets.
     */
    getMetadata: db.prepare(
      "SELECT id, title, language, timestamp, type, tags, is_draft, sort_index, folder_id, is_pinned, is_favorite, CASE WHEN (code_draft IS NOT NULL AND code_draft != '' AND code_draft != code) THEN 1 ELSE 0 END as is_modified FROM snippets WHERE is_deleted = 0 ORDER BY is_pinned DESC, COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC"
    ),

    // Paginated version for "Infinite Scroll" or batch loading
    getMetadataPaginated: db.prepare(
      "SELECT id, title, language, timestamp, type, tags, is_draft, sort_index, folder_id, is_pinned, is_favorite, CASE WHEN (code_draft IS NOT NULL AND code_draft != '' AND code_draft != code) THEN 1 ELSE 0 END as is_modified FROM snippets WHERE is_deleted = 0 ORDER BY is_pinned DESC, COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC LIMIT ? OFFSET ?"
    ),

    // Full fetch: Used when exporting or performing global operations
    getAll: db.prepare(
      'SELECT * FROM snippets WHERE is_deleted = 0 ORDER BY COALESCE(sort_index, 0) ASC, title COLLATE NOCASE ASC'
    ),

    // Targeted fetch: Used when the user clicks a specific snippet in the sidebar
    getById: db.prepare('SELECT * FROM snippets WHERE id = ?'),

    // Quick access for the "Recent" or "Changelog" view
    getRecent: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, is_draft, sort_index, folder_id, is_pinned, is_favorite FROM snippets WHERE is_draft = 0 AND is_deleted = 0 ORDER BY timestamp DESC LIMIT ?'
    ),

    // Trash bin logic
    getTrash: db.prepare(
      'SELECT id, title, language, timestamp, type, tags, deleted_at FROM snippets WHERE is_deleted = 1 ORDER BY deleted_at DESC'
    ),

    /**
     * --- PERSISTENCE ---
     * 'save' uses the INSERT OR REPLACE pattern.
     * This handles both initial creation and subsequent updates in a single query.
     */
    save: db.prepare(`
      INSERT OR REPLACE INTO snippets 
      (id, title, code, language, timestamp, type, tags, is_draft, sort_index, folder_id, is_deleted, is_pinned, is_favorite)
      VALUES (@id, @title, @code, @language, @timestamp, @type, @tags, @is_draft, @sort_index, @folder_id, 0, @is_pinned, @is_favorite)
    `),

    // Soft delete: Marks as deleted without removing file, allowing user to UNDO.
    softDelete: db.prepare('UPDATE snippets SET is_deleted = 1, deleted_at = ? WHERE id = ?'),

    restore: db.prepare('UPDATE snippets SET is_deleted = 0, deleted_at = NULL WHERE id = ?'),

    // Permanent wipe: Used when emptying the Trash.
    permanentDelete: db.prepare('DELETE FROM snippets WHERE id = ?'),

    /**
     * --- FOLDER ORGANIZATION ---
     */
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

    // Drag & Drop support queries: Update relationships
    updateFolderParent: db.prepare('UPDATE folders SET parent_id = ?, updated_at = ? WHERE id = ?'),

    updateSnippetFolder: db.prepare(
      'UPDATE snippets SET folder_id = ?, timestamp = ? WHERE id = ?'
    ),

    toggleFolderCollapse: db.prepare('UPDATE folders SET collapsed = ? WHERE id = ?')
  }
}
