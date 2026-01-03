import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { SettingSection } from '../components'
import {
  Cloud,
  UploadCloud,
  DownloadCloud,
  Check,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                             SYNC TAB                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * FILE LOCATION:
 *   src/renderer/src/components/settings/sections/SyncTab.jsx
 *
 * PARENT COMPONENTS:
 *   - SettingsModal.jsx (src/renderer/src/components/settings/SettingsModal.jsx)
 *     └─> Renders this tab when activeTab === 'sync'
 *
 * CALLED/TRIGGERED FROM:
 *   1. User clicks "Sync" in settings sidebar navigation
 *   2. Command Palette → "Open Sync Control Center"
 *   3. Deep link: openSettingsModal() with viewParams.tab = 'sync'
 *
 * HOW TO SETUP GITHUB SYNC:
 *   1. Go to: https://github.com/settings/tokens
 *   2. Click "Generate new token" → "Classic"
 *   3. Name: "Dev Snippet Sync"
 *   4. Scopes: Check ONLY "gist" (read/write gists)
 *   5. Click "Generate token"
 *   6. Copy token (ghp_...)
 *   7. Paste in this tab's "Authentication" input
 *   8. Click "Connect"
 *   9. Use "Backup" to save to GitHub Gist
 *   10. Use "Restore" to load from GitHub Gist
 *
 * HOW IT WORKS:
 *   - Stores GitHub Personal Access Token (PAT) in SQLite database
 *   - Creates/updates a private GitHub Gist with app data
 *   - Gist contains: snippets, folders, settings (JSON format)
 *   - Backup: Uploads current data to Gist
 *   - Restore: Downloads Gist data and overwrites local database
 *   - Activity logs track all sync operations
 *
 * EMBEDDED CONTROL CENTER:
 *   - Click "Control Center" button to expand activity log
 *   - Shows real-time sync events (backup started, completed, errors)
 *   - Displays last backup/restore timestamps
 *   - Shows Gist ID for manual viewing on GitHub
 *   - Built-in troubleshooting guide for common errors (401, 403, 404)
 *
 * RELATED FILES:
 *   - src/main/services/sync/SyncManager.js - Backend sync logic
 *   - src/main/services/sync/GitHubService.js - GitHub API wrapper
 *   - src/main/ipc/sync.js - IPC handlers for sync operations
 *   - src/main/database/db.js - SQLite database for token storage
 *
 * ARCHITECTURE NOTES:
 *   - Uses Electron IPC to communicate with main process
 *   - Token is encrypted before storage (handled by SyncManager)
 *   - All sync operations are async with proper error handling
 *   - Activity log keeps last 50 events in component state
 *   - Gist is ALWAYS private for security
 *
 * ERROR CODES:
 *   - 401: Token is invalid or expired → Generate new token
 *   - 403: Token lacks "gist" scope → Regenerate with correct scope
 *   - 404: No backup found → Run "Backup" first before "Restore"
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Helper function to format timestamps for display
 * @param {number|null} value - Unix timestamp in milliseconds
 * @returns {string} Formatted date/time or em dash if invalid
 */
const formatDateTime = (value) => {
  if (!value && value !== 0) return '—'
  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const SyncTab = () => {
  const [token, setToken] = useState('')
  const [hasToken, setHasToken] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState('info') // info, success, error
  const [statusSnapshot, setStatusSnapshot] = useState(null)
  const [isStatusLoading, setIsStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState(null)

  // Embedded Control Center State
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [logs, setLogs] = useState([])

  const pushLog = useCallback((message, tone = 'info') => {
    setLogs((prev) => {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        tone,
        at: Date.now()
      }
      return [entry, ...prev].slice(50) // Keep last 50
    })
  }, [])

  const refreshStatus = useCallback(async () => {
    if (!window.api?.syncGetStatus) return
    setIsStatusLoading(true)
    try {
      const snapshot = await window.api.syncGetStatus()
      setStatusSnapshot(snapshot)
      setStatusError(null)
    } catch (err) {
      console.error('[SyncTab] Failed to load sync status', err)
      setStatusError(err.message || 'Failed to load status')
    } finally {
      setIsStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    loadToken()
    refreshStatus()
  }, [refreshStatus])

  const loadToken = async () => {
    if (window.api?.syncGetToken) {
      const storedToken = await window.api.syncGetToken()
      if (storedToken) {
        setToken(storedToken)
        setHasToken(true)
      } else {
        setHasToken(false)
      }
    } else {
      console.warn('[SyncTab] window.api.syncGetToken not available')
    }
  }

  const handleSaveToken = async () => {
    if (!token) return
    if (window.api?.syncSetToken) {
      await window.api.syncSetToken(token.trim())
      setHasToken(true)
      setStatusMsg('Token saved successfully')
      setStatusType('success')
      pushLog('Token updated manually', 'success')
    } else {
      console.warn('[SyncTab] window.api.syncSetToken not available')
    }
  }

  const getHelpfulError = (errorMsg) => {
    if (errorMsg.includes('401')) return 'Unauthorized: Token is invalid or expired.'
    if (errorMsg.includes('403')) return 'Forbidden: Token lacks "gist" scope or permissions.'
    if (errorMsg.includes('404')) return 'Not Found: No previous backup found.'
    return errorMsg.replace("Error invoking remote method 'sync:restore': Error: ", '')
  }

  const handleBackup = async () => {
    setIsSyncing(true)
    setStatusMsg('Backing up to GitHub Gist...')
    setStatusType('info')
    pushLog('Backup started...', 'info')
    try {
      await window.api.syncBackup()
      setStatusMsg('Backup successful!')
      setStatusType('success')
      pushLog('Backup completed successfully', 'success')
      await refreshStatus()
    } catch (err) {
      console.error(err)
      const msg = err.message || 'Unknown error'
      const friendlyVal = getHelpfulError(msg)
      setStatusMsg(`Backup failed: ${friendlyVal}`)
      setStatusType('error')
      pushLog(`Backup failed: ${msg}`, 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm('This will OVERWRITE your local data with the GitHub backup. Are you sure?'))
      return

    setIsSyncing(true)
    setStatusMsg('Restoring from GitHub Gist...')
    setStatusType('info')
    pushLog('Restore started...', 'info')
    try {
      await window.api.syncRestore()
      setStatusMsg('Restore successful! Please restart app.')
      setStatusType('success')
      pushLog('Restore completed successfully', 'success')
      await refreshStatus()
      // Optional: trigger a window reload or data refetch
    } catch (err) {
      console.error(err)
      const msg = err.message || 'Unknown error'
      const friendlyVal = getHelpfulError(msg)
      setStatusMsg(`Restore failed: ${friendlyVal}`)
      setStatusType('error')
      pushLog(`Restore failed: ${msg}`, 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <SettingSection title="GitHub Sync" icon={Cloud}>
        {/* Sync Control Center Panel */}
        <div className="p-3 mb-3 rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Sync Status
                </p>
                {hasToken ? (
                  <span className="flex items-center gap-1 text-[9px] text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">
                    <Check size={8} strokeWidth={3} /> CONNECTED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                    <AlertTriangle size={8} strokeWidth={3} /> DISCONNECTED
                  </span>
                )}
              </div>

              <div className="grid gap-x-4 gap-y-1 text-[10px] text-[var(--color-text-secondary)] sm:grid-cols-2">
                <div className="flex items-center gap-1">
                  <span className="opacity-50">Last backup:</span>
                  <span className="font-mono">{formatDateTime(statusSnapshot?.lastBackupAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="opacity-50">Last restore:</span>
                  <span className="font-mono">{formatDateTime(statusSnapshot?.lastRestoreAt)}</span>
                </div>
                {statusSnapshot?.gist?.url && (
                  <div className="sm:col-span-2 flex items-center gap-1 truncate">
                    <span className="opacity-50">Gist ID:</span>
                    <span className="font-mono truncate select-all">{statusSnapshot.gist.id}</span>
                  </div>
                )}
                {statusError && (
                  <div className="sm:col-span-2 text-red-400 font-medium truncate">
                    Error: {statusError}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-1.5 flex-shrink-0 mt-2 sm:mt-0">
              <button
                type="button"
                onClick={refreshStatus}
                disabled={isStatusLoading}
                className="inline-flex items-center justify-center p-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)] disabled:opacity-50 transition-colors"
                title="Refresh Status"
              >
                <RefreshCw size={12} className={isStatusLoading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold transition-all whitespace-nowrap ${
                  showAdvanced
                    ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                    : 'bg-[var(--color-accent-primary)] text-white hover:opacity-90'
                }`}
              >
                {showAdvanced ? (
                  <>
                    Hide Logs <ChevronUp size={10} />
                  </>
                ) : (
                  <>
                    Control Center <ChevronDown size={10} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Embedded Activity Log / Control Center */}
        {showAdvanced && (
          <div className="mb-4 p-0 rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Activity Log
              </span>
              <span className="text-[9px] opacity-50 font-mono">{logs.length} events</span>
            </div>
            <div className="max-h-32 overflow-y-auto p-2 space-y-1.5">
              {logs.length === 0 ? (
                <p className="text-[10px] text-[var(--color-text-tertiary)] text-center py-2 italic">
                  No recent activity recorded.
                </p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-[10px]">
                    <Clock
                      size={10}
                      className="mt-0.5 text-[var(--color-text-tertiary)] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={
                          log.tone === 'error'
                            ? 'text-red-400'
                            : log.tone === 'success'
                              ? 'text-green-400'
                              : 'text-[var(--color-text-secondary)]'
                        }
                      >
                        {log.message}
                      </span>
                      <div className="text-[9px] opacity-40">{formatDateTime(log.at)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Token Input (Compact) */}
        {!hasToken && (
          <div className="p-3 mb-3 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold">Authentication</h3>
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[9px] text-blue-400 hover:underline flex items-center gap-0.5"
              >
                Get Token <ExternalLink size={8} />
              </a>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full h-7 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 text-[11px] font-mono outline-none focus:border-[var(--color-accent-primary)] transition-colors pr-7"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-0 top-0 h-full w-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {showToken ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
              </div>
              <button
                onClick={handleSaveToken}
                disabled={!token}
                className="h-7 px-3 bg-[var(--color-accent-primary)] hover:opacity-90 text-white text-[10px] font-bold rounded transition-all disabled:opacity-50"
              >
                Connect
              </button>
            </div>
            <p className="text-[9px] text-[var(--color-text-tertiary)] mt-1.5 opacity-70">
              Requires <b>gist</b> scope permission.
            </p>
          </div>
        )}

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleBackup}
            disabled={!hasToken || isSyncing}
            className="flex items-center gap-2 p-2 rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-primary)]/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left relative overflow-hidden"
          >
            <div
              className={`p-1.5 rounded bg-[var(--color-bg-secondary)] group-hover:bg-[var(--color-accent-primary)] group-hover:text-white transition-colors ${isSyncing ? 'animate-pulse' : ''}`}
            >
              <UploadCloud size={14} className="opacity-70 group-hover:opacity-100" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold truncate">Backup</div>
              <div className="text-[9px] text-[var(--color-text-tertiary)] truncate">
                To GitHub Gist
              </div>
            </div>
          </button>

          <button
            onClick={handleRestore}
            disabled={!hasToken || isSyncing}
            className="flex items-center gap-2 p-2 rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] hover:border-red-400/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left relative overflow-hidden"
          >
            <div
              className={`p-1.5 rounded bg-[var(--color-bg-secondary)] group-hover:bg-red-500 group-hover:text-white transition-colors ${isSyncing ? 'animate-pulse' : ''}`}
            >
              <DownloadCloud size={14} className="opacity-70 group-hover:opacity-100" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold truncate">Restore</div>
              <div className="text-[9px] text-[var(--color-text-tertiary)] truncate">
                From GitHub Gist
              </div>
            </div>
          </button>
        </div>

        {/* Status Message (Compact) */}
        {statusMsg && (
          <div
            className={`text-[10px] px-2 py-1.5 rounded flex items-center gap-2 mb-3 border ${
              statusType === 'error'
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : statusType === 'success'
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                statusType === 'error'
                  ? 'bg-red-500'
                  : statusType === 'success'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
              }`}
            />
            {statusMsg}
          </div>
        )}

        {/* Troubleshooting (Mini) */}
        <div className="px-2 py-1.5 rounded bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border)/30]">
          <div className="flex items-start gap-1 text-[9px] text-[var(--color-text-tertiary)] opacity-60">
            <AlertTriangle size={10} className="mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <p>
                <span className="font-mono text-[var(--color-text-secondary)]">401</span>: Invalid
                Token
              </p>
              <p>
                <span className="font-mono text-[var(--color-text-secondary)]">403</span>: Missing
                Gist Scope
              </p>
              <p>
                <span className="font-mono text-[var(--color-text-secondary)]">404</span>: No Backup
                Found
              </p>
            </div>
          </div>
        </div>
      </SettingSection>
    </div>
  )
}

SyncTab.propTypes = {}

export default SyncTab
