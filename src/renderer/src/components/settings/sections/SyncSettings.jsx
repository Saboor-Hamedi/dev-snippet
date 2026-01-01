import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { SettingSection, SettingInput } from '../components'
import {
  Cloud,
  UploadCloud,
  DownloadCloud,
  Check,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'

const formatDateTime = (value) => {
  if (!value && value !== 0) return '—'
  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const SyncSettings = ({ onOpenControlCenter }) => {
  const [token, setToken] = useState('')
  const [hasToken, setHasToken] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState('info') // info, success, error
  const [statusSnapshot, setStatusSnapshot] = useState(null)
  const [isStatusLoading, setIsStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState(null)

  const refreshStatus = useCallback(async () => {
    if (!window.api?.syncGetStatus) return
    setIsStatusLoading(true)
    try {
      const snapshot = await window.api.syncGetStatus()
      setStatusSnapshot(snapshot)
      setStatusError(null)
    } catch (err) {
      console.error('[SyncSettings] Failed to load sync status', err)
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
      console.warn('[SyncSettings] window.api.syncGetToken not available')
    }
  }

  const handleSaveToken = async () => {
    if (!token) return
    if (window.api?.syncSetToken) {
      await window.api.syncSetToken(token.trim())
      setHasToken(true)
      setStatusMsg('Token saved successfully')
      setStatusType('success')
    } else {
      console.warn('[SyncSettings] window.api.syncSetToken not available')
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
    try {
      await window.api.syncBackup()
      setStatusMsg('Backup successful!')
      setStatusType('success')
      await refreshStatus()
    } catch (err) {
      console.error(err)
      const msg = err.message || 'Unknown error'
      setStatusMsg(`Backup failed: ${getHelpfulError(msg)}`)
      setStatusType('error')
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
    try {
      await window.api.syncRestore()
      setStatusMsg('Restore successful! Please restart app.')
      setStatusType('success')
      await refreshStatus()
      // Optional: trigger a window reload or data refetch
    } catch (err) {
      console.error(err)
      const msg = err.message || 'Unknown error'
      setStatusMsg(`Restore failed: ${getHelpfulError(msg)}`)
      setStatusType('error')
    } finally {
      setIsSyncing(false)
    }
  }

  const openSyncControlCenter = () => {
    if (typeof onOpenControlCenter === 'function') {
      onOpenControlCenter()
      return
    }
    window.dispatchEvent(new CustomEvent('app:open-sync-center'))
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <SettingSection title="GitHub Sync" icon={Cloud}>
        <div className="p-4 mb-4 rounded-none-none border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Sync Control Center</p>
              <p className="text-sm text-[var(--color-text-primary)]">View detailed history, gist status, and logs in one place.</p>
              <div className="mt-2 grid gap-1 text-[11px] text-[var(--color-text-secondary)] sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-[var(--color-text-primary)]">Last backup:</span> {formatDateTime(statusSnapshot?.lastBackupAt)}
                </div>
                <div>
                  <span className="font-semibold text-[var(--color-text-primary)]">Last restore:</span> {formatDateTime(statusSnapshot?.lastRestoreAt)}
                </div>
                {statusSnapshot?.gist?.url && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-[var(--color-text-primary)]">Gist:</span> {statusSnapshot.gist.id}
                  </div>
                )}
                {statusError && (
                  <div className="sm:col-span-2 text-red-400">Status error: {statusError}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={refreshStatus}
                disabled={isStatusLoading}
                className="inline-flex items-center gap-1 rounded-none-none border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isStatusLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={openSyncControlCenter}
                className="inline-flex items-center gap-2 rounded-none-none bg-[var(--color-accent-primary)] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[var(--color-accent-hover)]"
              >
                Open Control Center
              </button>
            </div>
          </div>
        </div>

        {/* Token Input */}
        <div className="p-4 rounded-none-none bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-4">
          <div className="flex items-center justify-between mb-4 ">
            <h3 className="text-sm font-medium">Authentication</h3>
            {hasToken ? (
              <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-none-full">
                <Check size={10} /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-none-full">
                <AlertTriangle size={10} /> Disconnected
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
            Create a{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline inline-flex items-center"
            >
              Personal Access Token (Classic) <ExternalLink size={10} className="ml-0.5" />
            </a>{' '}
            with <b>gist</b> scope and paste it here.
          </p>

          <div className="flex gap-2 ">
            <div className="relative flex-1 ">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste GitHub Token (ghp_...)"
                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-none px-3 py-1.5 text-sm outline-none focus:border-[var(--color-accent-primary)] transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={handleSaveToken}
              disabled={!token}
              className="px-4 py-1.5 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium rounded-none transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`text-xs px-3 py-2 rounded-none mb-4  ${
              statusType === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : statusType === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}
          >
            {statusMsg}
          </div>
        )}

        {/* Sync Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleBackup}
            disabled={!hasToken || isSyncing}
            className="flex items-center gap-2 p-2 rounded-none-none border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-primary)] transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="p-1.5 rounded-none bg-[var(--color-bg-primary)] group-hover:bg-[var(--color-accent-primary)]/10 transition-colors">
              <UploadCloud
                size={16}
                className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent-primary)] transition-colors"
              />
            </div>
            <div>
              <div className="text-xs font-medium">Backup to Cloud</div>
              <div className="text-[10px] text-[var(--color-text-tertiary)]">
                Overwrite GitHub Gist
              </div>
            </div>
          </button>

          <button
            onClick={handleRestore}
            disabled={!hasToken || isSyncing}
            className="flex items-center gap-2 p-2 rounded-none-none border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] hover:border-red-400/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="p-1.5 rounded-none bg-[var(--color-bg-primary)] group-hover:bg-red-400/10 transition-colors">
              <DownloadCloud
                size={16}
                className="text-[var(--color-text-secondary)] group-hover:text-red-400 transition-colors"
              />
            </div>
            <div>
              <div className="text-xs font-medium">Restore from Cloud</div>
              <div className="text-[10px] text-[var(--color-text-tertiary)]">
                Overwrite Local Data
              </div>
            </div>
          </button>
        </div>

        {/* Troubleshooting Hints */}
        <div className="mt-4 p-2 rounded-none-none bg-[var(--color-bg-secondary)] border border-[var(--color-border)/50]">
          <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1 opacity-70">
            <AlertTriangle size={10} /> Troubleshooting
          </h4>
          <ul className="grid grid-cols-1 gap-1 text-[10px] text-[var(--color-text-tertiary)]">
            <li className="flex items-start gap-2">
              <span className="font-mono text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 px-1 rounded-none">
                401
              </span>
              <span>Token is invalid or expired.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 px-1 rounded-none">
                403
              </span>
              <span>
                Token lacks <b>gist</b> scope or SSO permissions.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 px-1 rounded-none">
                404
              </span>
              <span>No previous backup found on GitHub.</span>
            </li>
          </ul>
        </div>
      </SettingSection>
    </div>
  )
}

SyncSettings.propTypes = {
  onOpenControlCenter: PropTypes.func
}

SyncSettings.defaultProps = {
  onOpenControlCenter: null
}

export default SyncSettings
