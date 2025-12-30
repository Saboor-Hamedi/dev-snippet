import { ipcMain, BrowserWindow } from 'electron'

const notifyDataChanged = () => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('db:data-changed')
    }
  })
}

const transformRow = (row) => {
  if (!row) return row
  return {
    ...row,
    tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
    is_draft: !!row.is_draft,
    is_favorite: row.is_favorite ? 1 : 0
  }
}

export const registerDatabaseHandlers = (db, preparedStatements) => {
  // Get snippets (all or paginated)
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

  // Get single snippet by ID (full content)
  ipcMain.handle('db:getSnippetById', (event, id) => {
    return transformRow(preparedStatements.getById.get(id))
  })

  // Get single snippet by Title (for WikiLinks)
  ipcMain.handle('db:getSnippetByTitle', (event, title) => {
    if (!title) return null
    const row = db
      .prepare('SELECT * FROM snippets WHERE title = ? COLLATE NOCASE AND is_deleted = 0')
      .get(title.trim())
    return transformRow(row)
  })

  // Full-text search using FTS5
  ipcMain.handle('db:searchSnippets', (event, query) => {
    if (!query || query.trim().length === 0) {
      return preparedStatements.getMetadata.all()
    }

    try {
      const stopWords = ['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'and']
      const rawTerms = query.trim().split(/\s+/)
      // Only filter stopwords if we have other significant words
      const terms =
        rawTerms.length > 1
          ? rawTerms.filter((t) => !stopWords.includes(t.toLowerCase()))
          : rawTerms

      const ftsQuery = terms.map((term) => `"${term.replace(/"/g, '""')}"*`).join(' AND ')

      const results = db
        .prepare(
          `
        SELECT s.id, s.title, s.language, s.timestamp, s.type, s.tags, s.is_draft, s.sort_index, snippet(snippets_fts, 1, '__MARK__', '__/MARK__', '...', 20) as match_context
        FROM snippets s
        INNER JOIN snippets_fts fts ON s.rowid = fts.rowid
        WHERE snippets_fts MATCH ? AND s.is_deleted = 0
        ORDER BY bm25(snippets_fts, 10.0, 1.0, 5.0)
        LIMIT 10
      `
        )
        .all(ftsQuery)

      return results.map(transformRow)
    } catch (e) {
      console.warn('FTS search failed, falling back to LIKE:', e.message)
      const likeQuery = `%${query}%`
      return db
        .prepare(
          `
        SELECT id, title, language, timestamp, type, tags, is_draft, sort_index 
        FROM snippets
        WHERE (title LIKE ? OR code LIKE ? OR tags LIKE ?) AND is_deleted = 0
        ORDER BY timestamp DESC
        LIMIT 10
      `
        )
        .all(likeQuery, likeQuery, likeQuery)
        .map(transformRow)
    }
  })

  // Save snippet
  ipcMain.handle('db:saveSnippet', (event, snippet) => {
    try {
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
      preparedStatements.save.run(dbPayload)
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

  // Save snippet draft
  ipcMain.handle('db:saveSnippetDraft', (event, payload) => {
    const { id, code_draft, language } = payload
    const stmt = db.prepare(
      'UPDATE snippets SET code_draft = ?, is_draft = 1, language = COALESCE(?, language) WHERE id = ?'
    )
    stmt.run(code_draft, language || null, id)
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
    preparedStatements.softDeleteFolder.run(Date.now(), id)
    notifyDataChanged()
    return true
  })

  ipcMain.handle('db:restoreFolder', (event, id) => {
    preparedStatements.restoreFolder.run(id)
    return true
  })

  ipcMain.handle('db:permanentDeleteFolder', (event, id) => {
    preparedStatements.deleteFolder.run(id)
    return true
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
