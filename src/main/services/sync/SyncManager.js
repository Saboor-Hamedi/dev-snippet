import GitHubService from './GitHubService'
import { app } from 'electron'

const GIST_DESCRIPTION = 'Dev-Snippet-Backup-v1' // Signature to identify our gist
const BACKUP_FILENAME = 'dev-snippet-data.json'
const SETTINGS_FILENAME = 'dev-snippet-config.json'
const SENSITIVE_SETTINGS_KEYS = new Set(['github.token'])
const SYNC_STATUS_KEYS = {
  LAST_BACKUP_AT: 'sync.lastBackupAt',
  LAST_BACKUP_SUMMARY: 'sync.lastBackupSummary',
  LAST_RESTORE_AT: 'sync.lastRestoreAt',
  LAST_RESTORE_SUMMARY: 'sync.lastRestoreSummary',
  LAST_ERROR: 'sync.lastError'
}
const BYTE_TOLERANCE = 16 // Small tolerance for encoding differences

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class SyncManager {
  constructor() {
    this.db = null
    this.isSyncing = false
  }

  // Initialize with the database instance
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
      console.log(
        '[Sync] Setting token for backup, length:',
        token.length,
        'starts with:',
        token.substring(0, 4)
      )
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

      let targetGistId = null
      if (existingGist) {
        // 3. Update existing
        console.log(`[Sync] Updating existing Gist: ${existingGist.id}`)
        await GitHubService.updateGist(existingGist.id, files)
        targetGistId = existingGist.id
      } else {
        // 4. Create new
        console.log('[Sync] Creating new Gist')
        const gist = await GitHubService.createGist(GIST_DESCRIPTION, files, false) // False = Private
        targetGistId = gist?.id || null
      }

      this.recordBackupSuccess({
        gistId: targetGistId,
        snippetCount: data.snippets?.length || 0,
        folderCount: data.folders?.length || 0,
        payloadBytes: Buffer.byteLength(files[BACKUP_FILENAME].content || '', 'utf8')
      })

      return { success: true, timestamp: Date.now(), gistId: targetGistId }
    } catch (error) {
      console.error('[Sync] Backup failed:', error)
      this.recordSyncError('backup', error)
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

      // Verify token first
      try {
        const user = await GitHubService.getUser()
        console.log(`[Sync] Authenticated as GitHub user: ${user.login}`)
      } catch (e) {
        console.error('[Sync] Token verification failed during restore:', e.message)
        throw new Error(
          'Authentication failed: Token is invalid or expired. Please generate a new token.'
        )
      }

      // 1. Find Gist
      const gist = await GitHubService.findGistByDescription(GIST_DESCRIPTION)
      if (!gist) throw new Error('No backup found on GitHub')

      // 2. Get Full Content
      const fullGist = await GitHubService.getGist(gist.id)
      const dataFile = fullGist.files[BACKUP_FILENAME]

      if (!dataFile) throw new Error('Backup file not found in Gist')

      const backupContent = await this.fetchGistFileContent(dataFile, 'Backup data')
      let remoteData
      try {
        remoteData = JSON.parse(backupContent)
      } catch (parseError) {
        console.error('[Sync] Backup JSON parse failed after validated download', parseError)
        throw new Error(`Backup JSON parse failed: ${parseError.message}`)
      }

      // 3. Restore to DB
      this.restoreToDB(remoteData)

      this.recordRestoreSuccess({
        gistId: gist.id,
        snippetCount: remoteData?.snippets?.length || 0,
        folderCount: remoteData?.folders?.length || 0
      })

      return { success: true, timestamp: Date.now() }
    } catch (error) {
      console.error('[Sync] Restore failed:', error)
      this.recordSyncError('restore', error)
      throw error
    } finally {
      this.isSyncing = false
    }
  }

  setStatusValue(key, value) {
    if (!this.db) return
    if (value === undefined || value === null) {
      this.db.prepare('DELETE FROM settings WHERE key = ?').run(key)
      return
    }
    this.db
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run(key, typeof value === 'string' ? value : String(value))
  }

  getStatusValue(key) {
    if (!this.db) return null
    try {
      const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
      return row ? row.value : null
    } catch (err) {
      console.warn('[Sync] Failed to read status value', key, err)
      return null
    }
  }

  recordBackupSuccess(meta = {}) {
    const payload = { ...meta, operation: 'backup', at: Date.now() }
    this.setStatusValue(SYNC_STATUS_KEYS.LAST_BACKUP_AT, String(payload.at))
    this.setStatusValue(SYNC_STATUS_KEYS.LAST_BACKUP_SUMMARY, JSON.stringify(payload))
    this.clearLastError()
  }

  recordRestoreSuccess(meta = {}) {
    const payload = { ...meta, operation: 'restore', at: Date.now() }
    this.setStatusValue(SYNC_STATUS_KEYS.LAST_RESTORE_AT, String(payload.at))
    this.setStatusValue(SYNC_STATUS_KEYS.LAST_RESTORE_SUMMARY, JSON.stringify(payload))
    this.clearLastError()
  }

  recordSyncError(operation, error) {
    const payload = {
      operation,
      message: error?.message || String(error),
      at: Date.now()
    }
    this.setStatusValue(SYNC_STATUS_KEYS.LAST_ERROR, JSON.stringify(payload))
  }

  clearLastError() {
    this.setStatusValue(SYNC_STATUS_KEYS.LAST_ERROR, null)
  }

  parseJSON(value) {
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch (err) {
      return null
    }
  }

  getStatusSnapshot() {
    const numberOrNull = (value) => {
      if (!value && value !== '0') return null
      const num = Number(value)
      return Number.isNaN(num) ? null : num
    }

    return {
      lastBackupAt: numberOrNull(this.getStatusValue(SYNC_STATUS_KEYS.LAST_BACKUP_AT)),
      lastRestoreAt: numberOrNull(this.getStatusValue(SYNC_STATUS_KEYS.LAST_RESTORE_AT)),
      lastBackupSummary: this.parseJSON(this.getStatusValue(SYNC_STATUS_KEYS.LAST_BACKUP_SUMMARY)),
      lastRestoreSummary: this.parseJSON(
        this.getStatusValue(SYNC_STATUS_KEYS.LAST_RESTORE_SUMMARY)
      ),
      lastError: this.parseJSON(this.getStatusValue(SYNC_STATUS_KEYS.LAST_ERROR))
    }
  }

  maskToken(token) {
    if (!token) return null
    if (token.length <= 8) return `${token.slice(0, 2)}...${token.slice(-2)}`
    return `${token.slice(0, 4)}...${token.slice(-4)}`
  }

  async getStatus() {
    const token = this.getToken()
    const baseStatus = {
      ...this.getStatusSnapshot(),
      hasToken: !!token,
      maskedToken: token ? this.maskToken(token) : null,
      remoteAccount: null,
      gist: null,
      remoteAuthError: null,
      remoteGistError: null,
      statusVersion: 1
    }

    if (!token) {
      return baseStatus
    }

    try {
      GitHubService.setToken(token)
      try {
        const user = await GitHubService.getUser()
        baseStatus.remoteAccount = {
          login: user?.login,
          avatarUrl: user?.avatar_url,
          profileUrl: user?.html_url
        }
      } catch (authError) {
        baseStatus.remoteAuthError = authError?.message || 'Failed to verify GitHub token'
        return baseStatus
      }

      try {
        const gist = await GitHubService.findGistByDescription(GIST_DESCRIPTION)
        if (gist) {
          baseStatus.gist = {
            id: gist.id,
            url: gist.html_url,
            updatedAt: gist.updated_at,
            description: gist.description,
            owner: gist.owner ? { login: gist.owner.login } : null,
            files: Object.values(gist.files || {}).map((file) => ({
              filename: file.filename,
              size: file.size,
              language: file.language
            }))
          }
        }
      } catch (gistError) {
        baseStatus.remoteGistError = gistError?.message || 'Failed to fetch backup gist'
      }
    } catch (err) {
      baseStatus.remoteAuthError = err?.message || 'Failed to fetch sync status'
    }

    return baseStatus
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
        if (SENSITIVE_SETTINGS_KEYS.has(row.key)) return
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

  async fetchGistFileContent(fileMeta, label) {
    if (!fileMeta) throw new Error(`${label} file entry missing in gist`)
    if (!fileMeta.raw_url) throw new Error(`${label} file is missing raw_url (cannot download)`)

    const expectedBytes = typeof fileMeta.size === 'number' ? fileMeta.size : null
    const attempts = 3

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const content = await GitHubService.fetchRawFile(fileMeta.raw_url, { cacheBust: true })
        if (!content) {
          console.warn(`[Sync] ${label} attempt ${attempt} returned empty payload`)
        } else if (expectedBytes) {
          const actualBytes = Buffer.byteLength(content, 'utf8')
          if (actualBytes + BYTE_TOLERANCE < expectedBytes) {
            console.warn(
              `[Sync] ${label} attempt ${attempt} looked truncated (${actualBytes}/${expectedBytes} bytes)`
            )
          } else {
            return content
          }
        } else {
          return content
        }
      } catch (err) {
        console.warn(`[Sync] ${label} attempt ${attempt} failed`, err)
        if (attempt === attempts) throw err
      }

      await sleep(attempt * 200)
    }

    throw new Error(`${label} download failed: file appears truncated even after retries`)
  }
}

export default new SyncManager()
