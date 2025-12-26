import GitHubService from './GitHubService'
import { app } from 'electron'

const GIST_DESCRIPTION = 'Dev-Snippet-Backup-v1' // Signature to identify our gist
const BACKUP_FILENAME = 'dev-snippet-data.json'
const SETTINGS_FILENAME = 'dev-snippet-config.json'

class SyncManager {
  constructor() {
    this.db = null
    this.isSyncing = false
  }

  initialize(db) {
    this.db = db
  }

  setToken(token) {
    if (!this.db) throw new Error('Database not initialized')
    console.log('[SyncManager] Saving token:', token ? token.substring(0, 10) + '...' : 'NULL')
    GitHubService.setToken(token)
    // Persist token in SQLite 'settings' table
    this.db
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run('github.token', token)
  }

  getToken() {
    // Retrieve from SQLite
    if (!this.db) {
      console.error('[SyncManager] DB not initialized in getToken')
      return null
    }
    try {
      const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('github.token')
      console.log(
        '[SyncManager] Token retrieved from DB:',
        row
          ? row.value
            ? 'YES (Masked: ' + row.value.substring(0, 4) + '...)'
            : 'EMPTY STRING'
          : 'NULL (Row not found)'
      )
      // Trim just in case whitespace got saved
      return row && row.value ? row.value.trim() : null
    } catch (e) {
      console.warn('SyncManager: getToken failed (DB might not be ready)', e)
      return null
    }
  }

  /**
   * Main Public Method: Perform Backup (Push)
   */
  async backupToGist() {
    if (this.isSyncing) throw new Error('Sync already in progress')
    this.isSyncing = true

    try {
      const token = this.getToken()
      if (!token) throw new Error('No GitHub Token found')
      GitHubService.setToken(token)

      // Verify token first
      try {
        const user = await GitHubService.getUser()
        console.log(`[Sync] Authenticated as GitHub user: ${user.login}`)
      } catch (e) {
        console.error('[Sync] Token verification failed:', e.message)
        throw new Error('Authentication failed: Invalid Token')
      }

      // 1. Gather all data
      const data = this.gatherLocalData()
      const config = this.gatherLocalSettings() // Optional: Backup settings too

      const files = {
        [BACKUP_FILENAME]: { content: JSON.stringify(data, null, 2) },
        [SETTINGS_FILENAME]: { content: JSON.stringify(config, null, 2) }
      }

      // 2. Find existing Gist
      const existingGist = await GitHubService.findGistByDescription(GIST_DESCRIPTION)

      if (existingGist) {
        // 3. Update existing
        console.log(`[Sync] Updating existing Gist: ${existingGist.id}`)
        await GitHubService.updateGist(existingGist.id, files)
      } else {
        // 4. Create new
        console.log('[Sync] Creating new Gist')
        await GitHubService.createGist(GIST_DESCRIPTION, files, false) // False = Private
      }

      return { success: true, timestamp: Date.now() }
    } catch (error) {
      console.error('[Sync] Backup failed:', error)
      throw error
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Main Public Method: Restore (Pull)
   * WARNING: This overwrites local data in this V1 implementation
   */
  async restoreFromGist() {
    if (this.isSyncing) throw new Error('Sync already in progress')
    this.isSyncing = true

    try {
      const token = this.getToken()
      if (!token) throw new Error('No GitHub Token found')
      GitHubService.setToken(token)

      // 1. Find Gist
      const gist = await GitHubService.findGistByDescription(GIST_DESCRIPTION)
      if (!gist) throw new Error('No backup found on GitHub')

      // 2. Get Full Content
      const fullGist = await GitHubService.getGist(gist.id)
      const dataFile = fullGist.files[BACKUP_FILENAME]

      if (!dataFile) throw new Error('Backup file not found in Gist')

      const remoteData = JSON.parse(dataFile.content)

      // 3. Restore to DB
      this.restoreToDB(remoteData)

      return { success: true, timestamp: Date.now() }
    } catch (error) {
      console.error('[Sync] Restore failed:', error)
      throw error
    } finally {
      this.isSyncing = false
    }
  }

  // --- Private Helpers ---

  gatherLocalData() {
    // Queries matching standard export logic
    const snippets = this.db.prepare('SELECT * FROM snippets WHERE is_deleted = 0').all()
    const folders = this.db.prepare('SELECT * FROM folders WHERE is_deleted = 0').all()

    // Transform arrays if needed (e.g. tags)
    const processedSnippets = snippets.map((s) => ({
      ...s,
      tags: s.tags ? s.tags.split(',') : [],
      is_draft: !!s.is_draft
    }))

    return {
      version: '1.0',
      timestamp: Date.now(),
      snippets: processedSnippets,
      folders: folders
    }
  }

  gatherLocalSettings() {
    // Return all settings from DB as a simple object
    try {
      const settingsRows = this.db.prepare('SELECT * FROM settings').all()
      const settingsObj = {}
      settingsRows.forEach((row) => {
        settingsObj[row.key] = row.value
      })
      return settingsObj
    } catch (e) {
      console.warn('SyncManager: Failed to gather settings', e)
      return {}
    }
  }

  restoreToDB(data) {
    const { snippets, folders } = data

    // Transactional restore
    const restoreTx = this.db.transaction(() => {
      // 1. Clear existing (Soft) or Hard clear?
      // For V1 "Restore", we usually wipe to match remote exactly.
      // But let's be safe: we upsert based on ID.

      // Upsert Folders
      const insertFolder = this.db.prepare(`
        INSERT OR REPLACE INTO folders (id, name, parent_id, collapsed, sort_index, created_at, updated_at, is_deleted, deleted_at)
        VALUES (@id, @name, @parent_id, @collapsed, @sort_index, @created_at, @updated_at, @is_deleted, @deleted_at)
      `)

      folders.forEach((f) => {
        insertFolder.run({
          ...f,
          parent_id: f.parent_id || null, // Ensure explicit null
          collapsed: f.collapsed ? 1 : 0,
          is_deleted: f.is_deleted ? 1 : 0,
          deleted_at: f.deleted_at || null
        })
      })

      // Upsert Snippets
      const insertSnippet = this.db.prepare(`
        INSERT OR REPLACE INTO snippets (id, title, code, language, timestamp, type, tags, folder_id, is_draft, is_deleted, sort_index, deleted_at)
        VALUES (@id, @title, @code, @language, @timestamp, @type, @tags, @folder_id, @is_draft, @is_deleted, @sort_index, @deleted_at)
      `)

      snippets.forEach((s) => {
        insertSnippet.run({
          ...s,
          tags: Array.isArray(s.tags) ? s.tags.join(',') : s.tags,
          is_draft: s.is_draft ? 1 : 0,
          is_deleted: s.is_deleted ? 1 : 0,
          folder_id: s.folder_id || null, // Ensure null if undefined
          sort_index: s.sort_index || 0,
          deleted_at: s.deleted_at || null
        })
      })
    })

    restoreTx()
    console.log('[Sync] Local DB updated successfully')
  }
}

export default new SyncManager()
