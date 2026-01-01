import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import UniversalModal from '../universal/UniversalModal'
import {
  AlertTriangle,
  Clock,
  Cloud,
  CloudDownload,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'

const BACKUP_FILENAME = 'dev-snippet-data.json'

const formatDateTime = (value) => {
  if (!value) return '—'
  try {
    const date = typeof value === 'number' ? new Date(value) : new Date(Number(value))
    if (Number.isNaN(date.getTime())) return '—'
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  } catch (err) {
    return '—'
  }
}

const formatBytes = (bytes) => {
  if (!bytes || Number.isNaN(Number(bytes))) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

const EmptyState = ({ title, description }) => (
  <div className="flex flex-col items-start rounded-none-none border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200">
    <AlertTriangle className="mb-2 h-5 w-5 text-amber-400" />
    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
    <p className="text-xs text-[var(--color-text-secondary)]">{description}</p>
  </div>
)

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
}

const SyncControlModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState(null)
  const [isStatusLoading, setIsStatusLoading] = useState(false)
  const [activeAction, setActiveAction] = useState(null)
  const [restoreAck, setRestoreAck] = useState(false)
  const [logs, setLogs] = useState([])
  const [bridgeError, setBridgeError] = useState(null)

  const emitToast = useCallback((message, type = 'info') => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: { message, type }
      })
    )
  }, [])

  const pushLog = useCallback((message, tone = 'info') => {
    setLogs((prev) => {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        tone,
        at: Date.now()
      }
      return [entry, ...prev].slice(0, 50)
    })
  }, [])

  const getBridge = useCallback(() => {
    if (typeof window === 'undefined') return null
    return window.api || null
  }, [])

  const fetchStatus = useCallback(async () => {
    setIsStatusLoading(true)
    try {
      const bridge = getBridge()
      if (!bridge?.syncGetStatus) {
        setBridgeError('Sync bridge is unavailable in this environment.')
        setStatus(null)
        return
      }
      setBridgeError(null)
      const snapshot = await bridge.syncGetStatus()
      setStatus(snapshot)
      pushLog('Status refreshed', 'system')
    } catch (err) {
      console.error('Sync status failed', err)
      pushLog(`Failed to load status: ${err.message}`, 'error')
      emitToast('Failed to load sync status', 'error')
    } finally {
      setIsStatusLoading(false)
    }
  }, [emitToast, getBridge, pushLog])

  useEffect(() => {
    if (isOpen) {
      setLogs([])
      setRestoreAck(false)
      fetchStatus()
    }
  }, [fetchStatus, isOpen])

  const handleBackup = useCallback(async () => {
    if (activeAction) return
    const bridge = getBridge()
    if (!bridge?.syncBackup) {
      const message = 'Sync bridge is unavailable in this environment.'
      pushLog(message, 'error')
      emitToast(message, 'error')
      return
    }
    setActiveAction('backup')
    pushLog('Backup started', 'info')
    try {
      await bridge.syncBackup()
      pushLog('Backup completed successfully', 'success')
      emitToast('Backup completed successfully', 'success')
      await fetchStatus()
    } catch (err) {
      console.error('Backup failed', err)
      pushLog(`Backup failed: ${err.message}`, 'error')
      emitToast(`Backup failed: ${err.message}`, 'error')
    } finally {
      setActiveAction(null)
    }
  }, [activeAction, emitToast, fetchStatus, getBridge, pushLog])

  const handleRestore = useCallback(async () => {
    if (activeAction || !restoreAck) return
    const bridge = getBridge()
    if (!bridge?.syncRestore) {
      const message = 'Sync bridge is unavailable in this environment.'
      pushLog(message, 'error')
      emitToast(message, 'error')
      return
    }
    setActiveAction('restore')
    pushLog('Restore started', 'info')
    try {
      await bridge.syncRestore()
      pushLog('Restore completed successfully', 'success')
      emitToast('Restore completed successfully', 'success')
      await fetchStatus()
    } catch (err) {
      console.error('Restore failed', err)
      pushLog(`Restore failed: ${err.message}`, 'error')
      emitToast(`Restore failed: ${err.message}`, 'error')
    } finally {
      setActiveAction(null)
      setRestoreAck(false)
    }
  }, [activeAction, emitToast, fetchStatus, getBridge, pushLog, restoreAck])

  const handleOpenSettings = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:open-settings'))
    }
    onClose()
  }

  const gistDataFile = useMemo(() => {
    if (!status?.gist?.files) return null
    return status.gist.files.find((file) => file.filename === BACKUP_FILENAME) || null
  }, [status])

  const bridge = getBridge()
  const bridgeCapable = Boolean(bridge?.syncBackup && bridge?.syncRestore && bridge?.syncGetStatus)
  const disableActions = !status?.hasToken || !!activeAction || !bridgeCapable

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sync Control Center"
      width="720px"
      className="sync-control-modal"
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={isStatusLoading}
            className="inline-flex items-center gap-2 rounded-none-none border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--hover-bg)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStatusLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-none-none bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-sm text-[var(--color-text-primary)]">
        <section className="rounded-none-none border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Connection
              </p>
              <h3 className="text-lg font-semibold">GitHub Gist</h3>
            </div>
            <ShieldCheck className={`h-5 w-5 ${status?.hasToken ? 'text-emerald-500' : 'text-[var(--color-text-tertiary)]'}`} />
          </div>

          {!bridgeCapable && (
            <div className="mb-3 rounded-none-none border border-[var(--color-border)]/60 bg-[var(--color-bg-secondary)]/60 p-3 text-xs text-[var(--color-text-secondary)]">
              {bridgeError || 'Sync bridge is unavailable in this environment.'}
            </div>
          )}

          {status?.hasToken ? (
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="text-[var(--color-text-secondary)]">Token</p>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {status.maskedToken}
                </p>
                {status.remoteAccount && (
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">{status.remoteAccount.login}</p>
                )}
              </div>
              <div>
                <p className="text-[var(--color-text-secondary)]">Last Backup</p>
                <p className="font-semibold">{formatDateTime(status.lastBackupAt)}</p>
                {status.lastBackupSummary && (
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    {status.lastBackupSummary.snippetCount || 0} snippets ·{' '}
                    {status.lastBackupSummary.folderCount || 0} folders
                  </p>
                )}
              </div>
              <div>
                <p className="text-[var(--color-text-secondary)]">Last Restore</p>
                <p className="font-semibold">{formatDateTime(status.lastRestoreAt)}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-secondary)]">Gist Updated</p>
                <p className="font-semibold">
                  {status.gist?.updatedAt ? formatDateTime(Date.parse(status.gist.updatedAt)) : '—'}
                </p>
                {gistDataFile && (
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    {gistDataFile.filename} · {formatBytes(gistDataFile.size)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No token configured"
              description="Add a GitHub token with gist scope to enable syncing."
            />
          )}

          {status?.lastError && (
            <div className="mt-4 rounded-none-none border border-amber-400/50 bg-amber-500/10 p-3 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Last error ({status.lastError.operation})
              </div>
              <p className="mt-1">{status.lastError.message}</p>
              <p className="mt-1 text-[11px] opacity-70">{formatDateTime(status.lastError.at)}</p>
            </div>
          )}

          {(status?.remoteAuthError || status?.remoteGistError) && (
            <div className="mt-3 rounded-none-none border border-red-400/50 bg-red-500/10 p-3 text-xs text-red-200">
              <p className="font-semibold">Connection issue</p>
              {status.remoteAuthError && <p>{status.remoteAuthError}</p>}
              {status.remoteGistError && <p>{status.remoteGistError}</p>}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={handleOpenSettings}
              className="rounded-none-none border border-[var(--color-border)] px-3 py-1 font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--hover-bg)]"
            >
              Manage Token
            </button>
            {status?.gist?.url && (
              <button
                type="button"
                onClick={async () => {
                  const gistUrl = status?.gist?.url
                  if (!gistUrl) {
                    emitToast('Gist link is unavailable', 'error')
                    return
                  }

                  try {
                    if (window.api?.openExternal) {
                      await window.api.openExternal(gistUrl)
                    } else {
                      window.open(gistUrl, '_blank', 'noopener,noreferrer')
                    }
                    pushLog('Opened gist in browser', 'system')
                    emitToast('Opened gist in browser', 'success')
                  } catch (err) {
                    console.error('Failed to open gist link', err)
                    pushLog(`Failed to open gist link: ${err.message}`, 'error')
                    emitToast('Could not open gist link', 'error')
                  }
                }}
                className="inline-flex items-center gap-2 rounded-none-none border border-[var(--color-border)] px-3 py-1 font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--hover-bg)]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open Backup Gist
              </button>
            )}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={disableActions}
            onClick={handleBackup}
            className={`flex flex-col rounded-none-none border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 text-left shadow-sm transition hover:border-emerald-400/60 hover:shadow ${disableActions ? 'opacity-60' : ''}`}
          >
            <div className="mb-2 flex items-center gap-2 text-emerald-500">
              {activeAction === 'backup' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">Backup Now</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Snapshot snippets + settings to your private gist.
            </p>
          </button>

          <div className={`rounded-none-none border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 shadow-sm ${!status?.hasToken ? 'opacity-60' : ''}`}>
            <div className="mb-2 flex items-center gap-2 text-rose-500">
              {activeAction === 'restore' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CloudDownload className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">Restore Backup</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Overwrite local data with the latest gist snapshot.
            </p>
            <label className="mt-3 flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                className="rounded-none border-[var(--color-border)] text-rose-500 focus:ring-rose-400"
                checked={restoreAck}
                onChange={(e) => setRestoreAck(e.target.checked)}
                disabled={!status?.hasToken || !!activeAction}
              />
              I understand this will overwrite local data.
            </label>
            <button
              type="button"
              onClick={handleRestore}
              disabled={!restoreAck || disableActions}
              className="mt-3 w-full rounded-none-none bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Execute Restore
            </button>
          </div>
        </section>

        <section className="rounded-none-none border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-text-secondary)]">
            <History className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Activity</span>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)]">No activity yet.</p>
          ) : (
            <ul className="max-h-40 space-y-2 overflow-y-auto pr-1 text-xs">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start gap-2 border-b border-[var(--color-border)]/40 pb-2 last:border-b-0"
                >
                  <Clock className="mt-0.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                  <div>
                    <p
                      className={
                        log.tone === 'error'
                          ? 'text-red-500'
                          : log.tone === 'success'
                            ? 'text-emerald-500'
                            : 'text-[var(--color-text-secondary)]'
                      }
                    >
                      {log.message}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">
                      {formatDateTime(log.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </UniversalModal>
  )
}

SyncControlModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default memo(SyncControlModal)
