import React, { useState } from 'react'
import { Database, RefreshCw, Download, AlertCircle, CheckCircle2 } from 'lucide-react'

const BackupRestorePanel = () => {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [message, setMessage] = useState(null)

  // Load available backups
  const loadBackups = async () => {
    setLoading(true)
    try {
      if (window.api?.listBackups) {
        const backupList = await window.api.listBackups()
        setBackups(backupList)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load backups' })
    } finally {
      setLoading(false)
    }
  }

  // Create manual backup
  const handleCreateBackup = async () => {
    setLoading(true)
    setMessage(null)
    try {
      if (window.api?.createBackup) {
        const result = await window.api.createBackup()
        if (result.success) {
          setMessage({ type: 'success', text: '✓ Backup created successfully' })
          loadBackups()
        } else {
          setMessage({ type: 'error', text: result.message || 'Failed to create backup' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to create backup: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  // Restore from backup (MERGE, not replace)
  const handleRestore = async (backupPath) => {
    if (
      !confirm('This will merge snippets from the backup into your current database. Continue?')
    ) {
      return
    }

    setRestoring(true)
    setMessage(null)

    try {
      if (window.api?.restoreBackup) {
        const result = await window.api.restoreBackup(backupPath)
        setMessage({
          type: 'success',
          text: `✓ Restored ${result.added} snippets, ${result.settingsMerged || 0} settings merged`
        })
        // Refresh the page to show new data
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to restore: ${error.message}` })
    } finally {
      setRestoring(false)
    }
  }

  // Format timestamp for display
  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch {
      return timestamp
    }
  }

  React.useEffect(() => {
    loadBackups()
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Backup & Restore
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Create or restore snippets from backups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Download size={14} className={loading && !restoring ? 'animate-bounce' : ''} />
            Create Backup
          </button>
          <button
            onClick={loadBackups}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <RefreshCw size={14} className={loading && !restoring ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <Database className="text-blue-500 mt-0.5" size={16} />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="font-medium text-[var(--color-text-primary)] mb-1">Smart Merge Restore</p>
            <p>
              Restoring a backup will <strong>merge</strong> snippets into your current database.
              Existing snippets are preserved, and only new snippets from the backup are added.
            </p>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Available Backups ({backups.length})
        </h4>

        {loading ? (
          <div className="text-center py-8 text-sm text-[var(--color-text-secondary)]">
            Loading backups...
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <Database className="mx-auto mb-2 opacity-40" size={32} />
            <p className="text-sm text-[var(--color-text-secondary)]">No backups found</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Backups are created automatically when you start the app
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {backups.map((backup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {formatDate(backup.timestamp)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                      {backup.snippetCount || 0} snippets
                    </span>
                  </div>
                  <div
                    className="text-[11px] text-[var(--color-text-secondary)] truncate opacity-80"
                    title={backup.preview}
                  >
                    {backup.preview || 'No snippets found'}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                    {backup.size} • {backup.name}
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(backup.path)}
                  disabled={restoring}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Download size={12} />
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BackupRestorePanel
