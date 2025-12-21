/**
 * Database IPC Handlers
 */

import { ipcMain } from 'electron'

export const registerDatabaseHandlers = (db, preparedStatements) => {
  // Get snippets (all or paginated)
  ipcMain.handle('db:getSnippets', (event, options = {}) => {
    const { limit, offset, metadataOnly = true } = options

    // Choose the statement based on whether we want full text or just metadata
    const stmt = metadataOnly ? preparedStatements.getMetadata : preparedStatements.getAll
    const paginatedStmt = metadataOnly
      ? preparedStatements.getMetadataPaginated
      : preparedStatements.getAll // Note: I didn't create getAllPaginated but we could if needed

    if (limit !== undefined && offset !== undefined) {
      if (metadataOnly) {
        return preparedStatements.getMetadataPaginated.all(limit, offset)
      }
      // Fallback for full-paginated if needed (can be added later)
      return db.prepare(`${stmt.source} LIMIT ? OFFSET ?`).all(limit, offset)
    }

    return stmt.all()
  })

  // Get single snippet by ID (full content)
  ipcMain.handle('db:getSnippetById', (event, id) => {
    return preparedStatements.getById.get(id)
  })

  // Full-text search using FTS5
  ipcMain.handle('db:searchSnippets', (event, query) => {
    if (!query || query.trim().length === 0) {
      return preparedStatements.getMetadata.all()
    }

    try {
      const ftsQuery = query
        .trim()
        .split(/\s+/)
        .map((term) => `"${term.replace(/"/g, '""')}"`)
        .join(' OR ')

      const results = db
        .prepare(
          `
        SELECT s.id, s.title, s.language, s.timestamp, s.type, s.tags, s.is_draft, s.sort_index
        FROM snippets s
        INNER JOIN snippets_fts fts ON s.rowid = fts.rowid
        WHERE snippets_fts MATCH ?
        ORDER BY rank
        LIMIT 100
      `
        )
        .all(ftsQuery)

      return results
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
        LIMIT 100
      `
        )
        .all(likeQuery, likeQuery, likeQuery)
    }
  })

  // Save snippet
  ipcMain.handle('db:saveSnippet', (event, snippet) => {
    preparedStatements.save.run({
      ...snippet,
      tags: snippet.tags || '',
      is_draft: snippet.is_draft ? 1 : 0
    })
    return true
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
