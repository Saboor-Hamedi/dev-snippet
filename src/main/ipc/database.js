/**
 * @fileoverview Database IPC handlers for DevSnippet
 * Provides all communication between the renderer process and SQLite database.
 * Implements full-text search (FTS5), snippet CRUD, folder management, and WikiLink resolution.
 * @module ipc/database
 */

import { ipcMain, BrowserWindow } from 'electron'
import { propagateRename } from '../database/refactor'

/**
 * Notifies all renderer windows that database data has changed.
 * Triggers a UI refresh in all open windows via IPC event broadcast.
 * 
 * @private
 * @returns {void}
 * 
 * @example
 * // After saving a snippet
 * preparedStatements.save.run(snippet)
 * notifyDataChanged() // All windows refresh their UI
 */
const notifyDataChanged = () => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('db:data-changed')
    }
  })
}

/**
 * Transforms a raw database row into a frontend-friendly format.
 * Converts CSV tags to arrays and normalizes boolean fields.
 * 
 * @private
 * @param {Object|null} row - Raw database row from better-sqlite3
 * @param {string} row.tags - Comma-separated tag string (e.g., "react,hooks")
 * @param {number} row.is_draft - SQLite boolean (0 or 1)
 * @param {number} row.is_favorite - SQLite boolean (0 or 1)
 * @returns {Object|null} Transformed row or null if input is null
 * 
 * @example
 * const raw = { tags: 'react,hooks', is_draft: 1, is_favorite: 0 }
 * const transformed = transformRow(raw)
 * // { tags: ['react', 'hooks'], is_draft: true, is_favorite: 0 }
 */
const transformRow = (row) => {
  if (!row) return row
  return {
    ...row,
    tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
    is_draft: !!row.is_draft,
    is_favorite: row.is_favorite ? 1 : 0
  }
}


/**
 * Registers all database IPC handlers with the Electron main process.
 * Sets up bidirectional communication between renderer (React) and SQLite database.
 * 
 * **Registered Channels:**
 * - `db:getSnippets` - Fetch all or paginated snippets
 * - `db:getSnippetById` - Get single snippet by ID
 * - `db:saveSnippet` - Create or update snippet
 * - `db:searchSnippets` - Full-text search (FTS5)
 * - `db:deleteSnippet` - Soft delete snippet
 * - `db:getFolders` - Get folder hierarchy
 * - ... (and many more, see inline documentation)
 * 
 * @public
 * @param {import('better-sqlite3').Database} db - SQLite database instance
 * @param {Object} preparedStatements - Pre-compiled SQL statements for performance
 * @param {import('better-sqlite3').Statement} preparedStatements.getMetadata - Get snippet metadata only
 * @param {import('better-sqlite3').Statement} preparedStatements.getAll - Get full snippet content
 * @param {import('better-sqlite3').Statement} preparedStatements.getById - Get snippet by ID
 * @param {import('better-sqlite3').Statement} preparedStatements.save - Save/update snippet
 * @param {import('better-sqlite3').Statement} preparedStatements.softDelete - Soft delete snippet
 * @returns {void}
 * 
 * @example
 * // In main/index.js
 * import Database from 'better-sqlite3'
 * import { registerDatabaseHandlers } from './ipc/database.js'
 * 
 * const db = new Database('app.db')
 * const preparedStatements = {
 *   getMetadata: db.prepare('SELECT id, title FROM snippets'),
 *   // ... other statements
 * }
 * registerDatabaseHandlers(db, preparedStatements)
 */
export const registerDatabaseHandlers = (db, preparedStatements) => {
  /**
   * IPC Handler: Get all snippets or paginated subset
   * 
   * @channel db:getSnippets
   * @param {Object} options - Query options
   * @param {number} [options.limit] - Maximum snippets to return
   * @param {number} [options.offset] - Starting position for pagination
   * @param {boolean} [options.metadataOnly=true] - Fetch only metadata (no full `code`)
   * @returns {Object[]} Array of snippet objects
   * 
   * @performance Target: < 20ms for 10,000 snippets (metadata only)
   * 
   * @example
   * // Renderer process
   * const snippets = await window.api.getSnippets({ limit: 50, offset: 0 })
   */
  ipcMain.handle('db:getSnippets', (event, options = {}) => {
    const { limit, offset, metadataOnly = true } = options

    // Choose the statement based on whether we want full text or just metadata
    const stmt = metadataOnly ? preparedStatements.getMetadata : preparedStatements.getAll

    if (limit !== undefined && offset !== undefined) {
      if (metadataOnly) {
        return preparedStatements.getMetadataPaginated.all(limit, offset).map(transformRow)
      }
      // Fallback for full-paginated if needed (can be added later)
      return db.prepare(`${stmt.source} LIMIT ? OFFSET ?`).all(limit, offset).map(transformRow)
    }

    return stmt.all().map(transformRow)
  })

  /**
   * IPC Handler: Get single snippet by unique ID (full content)
   * 
   * @channel db:getSnippetById
   * @param {string} id - Snippet UUID
   * @returns {Object|null} Snippet object or null if not found
   * 
   * @performance Target: < 5ms (indexed lookup)
   * 
   * @example
   * const snippet = await window.api.getSnippetById('abc-123-def')
   */
  ipcMain.handle('db:getSnippetById', (event, id) => {
    return transformRow(preparedStatements.getById.get(id))
  })

  /**
   * IPC Handler: Get snippet by title (case-insensitive)
   * Used for WikiLink resolution: [[My Note]] -> snippet lookup
   * 
   * @channel db:getSnippetByTitle
   * @param {string} title - Snippet title to search for
   * @returns {Object|null} Snippet object or null if not found
   * 
   * @performance Target: < 5ms (assumes index on `title COLLATE NOCASE`)
   * 
   * @example
   * // WikiLink click handler
   * const linked = await window.api.getSnippetByTitle('React Hooks Guide')
   */
  ipcMain.handle('db:getSnippetByTitle', (event, title) => {
    if (!title) return null
    const row = db
      .prepare('SELECT * FROM snippets WHERE title = ? COLLATE NOCASE AND is_deleted = 0')
      .get(title.trim())
    return transformRow(row)
  })


  // Full-text search using FTS5 with robust LIKE fallback
  ipcMain.handle('db:searchSnippets', (event, query, limit = 250) => {
    if (!query || query.trim().length === 0) {
      return preparedStatements.getMetadata.all()
    }

    const trimmedQuery = query.trim()
    const terms = trimmedQuery.split(/\s+/).filter(Boolean)

    // 🚀 OPTIMIZATION: Use LIKE for short single-word queries (up to 3 chars)
    if (trimmedQuery.length < 4 && terms.length === 1) {
      const pattern = `%${trimmedQuery}%`
      const results = db
        .prepare(
          `
        SELECT id, title, code, language, timestamp, type, tags, is_draft, is_pinned, is_favorite, sort_index,
        CASE WHEN (code_draft IS NOT NULL AND code_draft != '' AND code_draft != code) THEN 1 ELSE 0 END as is_modified
        FROM snippets
        WHERE (title LIKE ? OR tags LIKE ? OR code LIKE ?) AND is_deleted = 0
        ORDER BY is_pinned DESC, timestamp DESC
        LIMIT ?
      `
        )
        .all(pattern, pattern, pattern, limit)
      return results.map(transformRow)
    }

    try {
      // Construct a robust FTS query: "term1"* AND "term2"* ...
      const ftsQuery = terms.map((term) => `"${term.replace(/"/g, '""')}"*`).join(' AND ')

      const results = db
        .prepare(
          `
          SELECT s.id, s.title, s.code, s.language, s.timestamp, s.type, s.tags, s.is_draft, s.is_pinned, s.is_favorite, s.sort_index, 
          CASE WHEN (s.code_draft IS NOT NULL AND s.code_draft != '' AND s.code_draft != s.code) THEN 1 ELSE 0 END as is_modified,
          snippet(snippets_fts, 1, '__MARK__', '__/MARK__', '...', 20) as match_context
          FROM (
            SELECT rowid, rank 
            FROM snippets_fts 
            WHERE snippets_fts MATCH ? 
            ORDER BY bm25(snippets_fts, 10.0, 1.0, 5.0) 
            LIMIT ?
          ) as fts
          JOIN snippets s ON s.rowid = fts.rowid
          JOIN snippets_fts ON snippets_fts.rowid = fts.rowid
          WHERE s.is_deleted = 0
          ORDER BY fts.rank
        `
        )
        .all(ftsQuery, limit)

      // Fallback if FTS is empty
      if (results.length === 0) throw new Error('No FTS')

      return results.map(transformRow)
    } catch (e) {
      // Final Fallback: Multi-term LIKE (All terms must exist in Title OR Code OR Tags)
      let queryStr = `
        SELECT id, title, code, language, timestamp, type, tags, is_draft, is_pinned, is_favorite, sort_index,
        CASE WHEN (code_draft IS NOT NULL AND code_draft != '' AND code_draft != code) THEN 1 ELSE 0 END as is_modified
        FROM snippets
        WHERE is_deleted = 0
      `
      const params = []
      terms.forEach((term) => {
        queryStr += ` AND (title LIKE ? OR code LIKE ? OR tags LIKE ?)`
        const p = `%${term}%`
        params.push(p, p, p)
      })
      queryStr += ` ORDER BY is_pinned DESC, timestamp DESC LIMIT ?`
      params.push(limit)

      const results = db.prepare(queryStr).all(...params)
      return results.map(transformRow)
    }
  })

  // Save snippet
  ipcMain.handle('db:saveSnippet', (event, snippet) => {
    try {
      // 🟢 WIKILINK REFACTORING LOGIC
      // Before saving, check if we are renaming an existing snippet.
      // If the title changed, we need to update all inbound links [[Old Title]] -> [[New Title]].
      const oldSnippet = preparedStatements.getById.get(snippet.id)
      const isRename =
        oldSnippet &&
        snippet.title &&
        oldSnippet.title !== snippet.title &&
        oldSnippet.title.trim() !== '' &&
        !snippet.is_draft // Only propagate if the new version is not a draft (though usually renaming happens on permanent titles)

      // PRO-TIP: Prevent duplicate titles to keep the library clean
      // We skip empty titles to allow multiple "New Drafts"
      if (snippet.title && snippet.title.trim()) {
        const folderId = snippet.folder_id || null
        const existing = db
          .prepare(
            'SELECT id FROM snippets WHERE title = ? COLLATE NOCASE AND id != ? AND (folder_id IS ?) AND is_draft = 0 AND is_deleted = 0'
          )
          .get(snippet.title.trim(), snippet.id, folderId)
        if (existing) {
          throw new Error('DUPLICATE_TITLE')
        }
      }

      const dbPayload = {
        id: snippet.id,
        title: snippet.title || '',
        code: snippet.code || '',
        language: snippet.language || 'markdown',
        timestamp: snippet.timestamp || Date.now(),
        type: snippet.type || 'snippet',
        tags: Array.isArray(snippet.tags) ? snippet.tags.join(',') : snippet.tags || '',
        is_draft: snippet.is_draft ? 1 : 0,
        is_favorite: snippet.is_favorite ? 1 : 0,
        is_pinned: snippet.is_pinned ? 1 : 0,
        sort_index: snippet.sort_index ?? null,
        folder_id: snippet.folder_id ?? null
      }

      // Execute Save and Propagation within a single atomic transaction
      db.transaction(() => {
        preparedStatements.save.run(dbPayload)

        if (isRename && !snippet.is_draft) {
          propagateRename(db, oldSnippet.title, snippet.title)
        }
      })()

      notifyDataChanged()
      return true
    } catch (err) {
      console.error('Failed to save snippet to DB:', err)
      throw err
    }
  })

  // Delete snippet (Soft Delete)
  ipcMain.handle('db:deleteSnippet', (event, id) => {
    // preparedStatements.delete is now permanentDelete, we use softDelete
    preparedStatements.softDelete.run(Date.now(), id)
    notifyDataChanged()
    return true
  })

  // Restore snippet
  ipcMain.handle('db:restoreSnippet', (event, id) => {
    preparedStatements.restore.run(id)
    notifyDataChanged()
    return true
  })

  // Permanent Delete
  ipcMain.handle('db:permanentDeleteSnippet', (event, id) => {
    preparedStatements.permanentDelete.run(id)
    notifyDataChanged()
    return true
  })

  // Save snippet draft (Silent sync for 'Modified' status dots)
  ipcMain.handle('db:saveSnippetDraft', (event, payload) => {
    const { id, code_draft, language } = payload
    const stmt = db.prepare(
      'UPDATE snippets SET code_draft = ?, language = COALESCE(?, language) WHERE id = ?'
    )
    stmt.run(code_draft, language || null, id)
    // NOTE: We intentionally DO NOT call notifyDataChanged() here.
    // Draft saving is a high-frequency background task. Triggering a
    // full UI refresh on every keystroke debounce causes massive rendering lag.
    return true
  })

  // Commit snippet draft
  ipcMain.handle('db:commitSnippetDraft', (event, id) => {
    const row = db.prepare('SELECT code_draft FROM snippets WHERE id = ?').get(id)
    if (row && row.code_draft != null) {
      const stmt = db.prepare(
        'UPDATE snippets SET code = code_draft, code_draft = NULL, is_draft = 0, timestamp = ? WHERE id = ?'
      )
      stmt.run(Date.now(), id)
      notifyDataChanged()
    }
    return true
  })

  // Get setting
  ipcMain.handle('db:getSetting', (event, key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
    return row ? row.value : null
  })

  // Save setting
  ipcMain.handle('db:saveSetting', (event, key, value) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
    return true
  })

  // --- FOLDERS ---
  ipcMain.handle('db:getFolders', () => {
    return preparedStatements.getFolders.all()
  })

  ipcMain.handle('db:saveFolder', (event, folder) => {
    try {
      // Prevent duplicate folder names in the same parent (exclude soft deleted)
      if (folder.name && folder.name.trim()) {
        const parentId = folder.parent_id || null
        const existing = db
          .prepare(
            'SELECT id FROM folders WHERE name = ? COLLATE NOCASE AND id != ? AND (parent_id IS ?) AND is_deleted = 0'
          )
          .get(folder.name.trim(), folder.id, parentId)
        if (existing) {
          throw new Error('DUPLICATE_FOLDER_NAME')
        }
      }
      const dbPayload = {
        id: folder.id,
        name: folder.name,
        parent_id: folder.parent_id || null,
        collapsed: folder.collapsed ? 1 : 0,
        sort_index: folder.sort_index || 0,
        created_at: folder.created_at || Date.now(),
        updated_at: Date.now()
      }
      preparedStatements.saveFolder.run(dbPayload)
      notifyDataChanged()
      return true
    } catch (err) {
      console.error('db:saveFolder failed:', err)
      throw err
    }
  })

  ipcMain.handle('db:deleteFolder', (event, id) => {
    try {
      const now = Date.now()

      const recursiveDelete = (folderId) => {
        // 1. Soft delete all snippets in this folder
        db.prepare('UPDATE snippets SET is_deleted = 1, deleted_at = ? WHERE folder_id = ?').run(
          now,
          folderId
        )

        // 2. Find all child folders
        const children = db
          .prepare('SELECT id FROM folders WHERE parent_id = ? AND is_deleted = 0')
          .all(folderId)

        // 3. Recurse into children
        for (const child of children) {
          recursiveDelete(child.id)
        }

        // 4. Soft delete the folder itself
        db.prepare('UPDATE folders SET is_deleted = 1, deleted_at = ? WHERE id = ?').run(
          now,
          folderId
        )
      }

      db.transaction(() => {
        recursiveDelete(id)
      })()

      notifyDataChanged()
      return true
    } catch (e) {
      console.error('Recursive folder delete failed:', e)
      throw e
    }
  })

  ipcMain.handle('db:restoreFolder', (event, id) => {
    try {
      const recursiveRestore = (folderId) => {
        // 1. Restore all snippets in this folder that were deleted at the same time or were simply in it
        // To be safe, we restore all snippets that have this folder_id and are deleted
        db.prepare('UPDATE snippets SET is_deleted = 0, deleted_at = NULL WHERE folder_id = ?').run(
          folderId
        )

        // 2. Find all child folders (even deleted ones)
        const children = db.prepare('SELECT id FROM folders WHERE parent_id = ?').all(folderId)

        // 3. Recurse
        for (const child of children) {
          recursiveRestore(child.id)
        }

        // 4. Restore the folder itself
        db.prepare('UPDATE folders SET is_deleted = 0, deleted_at = NULL WHERE id = ?').run(
          folderId
        )
      }

      db.transaction(() => {
        recursiveRestore(id)
      })()

      notifyDataChanged()
      return true
    } catch (e) {
      console.error('Recursive folder restore failed:', e)
      throw e
    }
  })

  ipcMain.handle('db:permanentDeleteFolder', (event, id) => {
    try {
      const recursivePermanentDelete = (folderId) => {
        // 1. Delete all snippets in this folder
        db.prepare('DELETE FROM snippets WHERE folder_id = ?').run(folderId)

        // 2. Find all child folders
        const children = db.prepare('SELECT id FROM folders WHERE parent_id = ?').all(folderId)

        // 3. Recurse
        for (const child of children) {
          recursivePermanentDelete(child.id)
        }

        // 4. Delete the folder itself
        db.prepare('DELETE FROM folders WHERE id = ?').run(folderId)
      }

      db.transaction(() => {
        recursivePermanentDelete(id)
      })()

      notifyDataChanged()
      return true
    } catch (e) {
      console.error('Recursive folder permanent delete failed:', e)
      throw e
    }
  })

  // Get Trash (unified)
  ipcMain.handle('db:getTrash', () => {
    const snippets = preparedStatements.getTrash.all().map(transformRow)
    const folders = preparedStatements.getFolderTrash.all().map((f) => ({ ...f, type: 'folder' }))
    return [...snippets, ...folders].sort((a, b) => (b.deleted_at || 0) - (a.deleted_at || 0))
  })

  ipcMain.handle('db:moveSnippet', (event, snippetId, folderId) => {
    preparedStatements.updateSnippetFolder.run(folderId || null, Date.now(), snippetId)
    notifyDataChanged()
    return true
  })

  ipcMain.handle('db:moveFolder', (event, folderId, parentId) => {
    preparedStatements.updateFolderParent.run(parentId || null, Date.now(), folderId)
    notifyDataChanged()
    return true
  })

  ipcMain.handle('db:toggleFolderCollapse', (event, folderId, collapsed) => {
    preparedStatements.toggleFolderCollapse.run(collapsed ? 1 : 0, folderId)
    return true
  })
}
