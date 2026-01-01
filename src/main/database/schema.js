/**
 * Database Schema Definitions
 *
 * This file defines the blueprint of our application's data.
 * It includes core table definitions, performance-tuned indexes,
 * and advanced full-text search (FTS5) configurations.
 */

/**
 * createTables - Defines the relational structure.
 *
 * We use TEXT for IDs to support UUIDs/CUIDs and INTEGER for booleans/timestamps.
 * COLLATE NOCASE is applied to titles for natural, case-insensitive sorting.
 */
export const createTables = (db) => {
  db.exec(`
    -- The primary storage for all user snippets and notes
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '',
      code_draft TEXT,             -- Stores auto-saved changes before a manual Save
      language TEXT NOT NULL DEFAULT 'markdown',
      timestamp INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'snippet',
      tags TEXT DEFAULT '',
      is_draft INTEGER DEFAULT 0,
      sort_index INTEGER,
      folder_id TEXT,
      is_deleted INTEGER DEFAULT 0, -- Soft delete support (Trash bin)
      deleted_at INTEGER,
      is_pinned INTEGER DEFAULT 0
    );

    -- Hierarchical folder structure
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      collapsed INTEGER DEFAULT 0,
      sort_index INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      deleted_at INTEGER
    );

    -- Key-Value store for application-wide sync and UI settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    /**
     * --- PERFORMANCE INDEXES ---
     * We create indexes on common filter/sort columns (title, language, timestamp).
     * COLLATE NOCASE ensures that index scans for sorting aren't split by casing.
     */
    CREATE INDEX IF NOT EXISTS idx_snippets_title ON snippets(title COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
    CREATE INDEX IF NOT EXISTS idx_snippets_timestamp ON snippets(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_snippets_is_draft ON snippets(is_draft);
    CREATE INDEX IF NOT EXISTS idx_snippets_sort ON snippets(sort_index, title);
    
    -- Compound indexes: Highly effective for "Filters" (e.g., searching within all Javascript drafts)
    CREATE INDEX IF NOT EXISTS idx_snippets_draft_time ON snippets(is_draft, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_snippets_lang_time ON snippets(language, timestamp DESC);
  `)
}

/**
 * createFTS5 - Full-Text Search Configuration.
 *
 * This creates a virtual table that shadows the 'snippets' table.
 * It uses the Porter stemmer (tokenize='porter') to handle word variants
 * (e.g., searching for "coding" will find "code"), providing a
 * Google-like search experience over thousands of notes.
 */
export const createFTS5 = (db) => {
  try {
    db.exec(`
      -- External content FTS5 table linked to the main 'snippets' table
      CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts USING fts5(
        title,
        code,
        tags,
        content='snippets',
        content_rowid='rowid',
        tokenize='porter unicode61'
      );

      /**
       * --- FTS SYNCHRONIZATION TRIGGERS ---
       * Because FTS tables are "virtual", they don't auto-update.
       * These database-level triggers ensure that whenever a snippet is 
       * added, deleted, or edited, the search index is updated atomically.
       */
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
