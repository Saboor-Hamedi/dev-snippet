/**
 * Database Schema Definitions
 * Contains all CREATE TABLE and CREATE INDEX statements
 */

export const createTables = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '',
      code_draft TEXT,
      language TEXT NOT NULL DEFAULT 'markdown',
      timestamp INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'snippet',
      tags TEXT DEFAULT '',
      is_draft INTEGER DEFAULT 0,
      sort_index INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Optimized indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_snippets_title ON snippets(title COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
    CREATE INDEX IF NOT EXISTS idx_snippets_timestamp ON snippets(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_snippets_is_draft ON snippets(is_draft);
    CREATE INDEX IF NOT EXISTS idx_snippets_sort ON snippets(sort_index, title);
    
    -- Compound indexes for common filter combinations
    CREATE INDEX IF NOT EXISTS idx_snippets_draft_time ON snippets(is_draft, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_snippets_lang_time ON snippets(language, timestamp DESC);
  `)
}

export const createFTS5 = (db) => {
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
        title,
        code,
        tags,
        content='snippets',
        content_rowid='rowid',
        tokenize='porter unicode61'
      );

      -- Triggers to keep FTS index in sync
      CREATE TRIGGER IF NOT EXISTS snippets_fts_insert AFTER INSERT ON snippets BEGIN
        INSERT INTO snippets_fts(rowid, title, code, tags)
        VALUES (new.rowid, new.title, new.code, new.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS snippets_fts_delete AFTER DELETE ON snippets BEGIN
        DELETE FROM snippets_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS snippets_fts_update AFTER UPDATE ON snippets BEGIN
        DELETE FROM snippets_fts WHERE rowid = old.rowid;
        INSERT INTO snippets_fts(rowid, title, code, tags)
        VALUES (new.rowid, new.title, new.code, new.tags);
      END;
    `)
  } catch (e) {
    console.warn('FTS5 setup skipped (may already exist):', e.message)
  }
}
