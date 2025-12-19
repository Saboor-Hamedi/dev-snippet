/**
 * Database IPC Handlers
 */

const { ipcMain } = require('electron')

const registerDatabaseHandlers = (db, preparedStatements) => {
  // Get all snippets
  ipcMain.handle('db:getSnippets', () => {
    return preparedStatements.getAll.all()
  })

  // Full-text search using FTS5
  ipcMain.handle('db:searchSnippets', (event, query) => {
    if (!query || query.trim().length === 0) {
      return preparedStatements.getAll.all()
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
        SELECT s.* FROM snippets s
        INNER JOIN snippets_fts fts ON s.rowid = fts.rowid
        WHERE snippets_fts MATCH ?
        ORDER BY rank
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
        SELECT * FROM snippets
        WHERE title LIKE ? OR code LIKE ? OR tags LIKE ?
        ORDER BY timestamp DESC
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

module.exports = { registerDatabaseHandlers }
