/**
 * Database IPC Handlers
 */

import { ipcMain } from 'electron'

const transformRow = (row) => {
  if (!row) return row
  return {
    ...row,
    tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
    is_draft: !!row.is_draft
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
        WHERE snippets_fts MATCH ?
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
        WHERE title LIKE ? OR code LIKE ? OR tags LIKE ?
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
        const existing = db
          .prepare('SELECT id FROM snippets WHERE title = ? COLLATE NOCASE AND id != ?')
          .get(snippet.title.trim(), snippet.id)
        if (existing) {
          throw new Error('DUPLICATE_TITLE')
        }
      }
      const dbPayload = {
        ...snippet,
        // Ensure tags is a string for storage
        tags: Array.isArray(snippet.tags) ? snippet.tags.join(',') : snippet.tags || '',
        is_draft: snippet.is_draft ? 1 : 0,
        sort_index: snippet.sort_index ?? null
      }
      preparedStatements.save.run(dbPayload)
      return true
    } catch (err) {
      console.error('Failed to save snippet to DB:', err)
      throw err
    }
  })

  // Delete snippet
  ipcMain.handle('db:deleteSnippet', (event, id) => {
    preparedStatements.delete.run(id)
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
}
