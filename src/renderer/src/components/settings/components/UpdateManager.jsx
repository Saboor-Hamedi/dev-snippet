import React, { useState, useEffect } from 'react'
import {
  RefreshCw,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Info
} from 'lucide-react'
import SettingRow from './SettingRow'

const UpdateManager = () => {
  const [status, setStatus] = useState('idle') // idle, checking, available, downloading, downloaded, error, no-update
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [updateInfo, setUpdateInfo] = useState(null)
  const [showRestartModal, setShowRestartModal] = useState(false)
  const [currentVersion, setCurrentVersion] = useState('Checking...')

  useEffect(() => {
    // 0. Get current version from main process
    if (window.api?.getVersion) {
      window.api.getVersion().then(setCurrentVersion)
    }

    // Check if the update API is available
    if (!window.api?.onUpdateAvailable) {
      console.warn('Update service not available yet. Please restart the application.')
      setStatus('error')
      setError('Update service not initialized.')
      return
    }

    // 1. Update Available
    const unsubAvailable = window.api.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setStatus('available')
    })

    // 2. Update Not Available
    const unsubNotAvailable = window.api.onUpdateNotAvailable(() => {
      setStatus('no-update')
      setTimeout(() => setStatus('idle'), 4000)
    })

    // 3. Download Progress
    const unsubProgress = window.api.onDownloadProgress((p) => {
      setStatus('downloading')
      setProgress(p.percent)
    })

    // 4. Update Downloaded
    const unsubDownloaded = window.api.onUpdateDownloaded(() => {
      setStatus('downloaded')
    })

    // 5. Update Error
    const unsubError = window.api.onUpdateError((err) => {
      // Clean up common error messages for better UX
      let msg = err
      if (err.includes('404')) msg = 'No releases found on GitHub.'
      if (err.includes('not-packed')) msg = 'Updater only works in installed version.'

      setError(msg)
      setStatus('error')
    })

    return () => {
      unsubAvailable()
      unsubNotAvailable()
      unsubProgress()
      unsubDownloaded()
      unsubError()
    }
  }, [])

  // Auto-check on mount
  // useEffect(() => {
  //   handleCheck(true)
  // }, [])

  const handleCheck = async (silent = false) => {
    if (!window.api?.checkForUpdates) {
      if (!silent) {
        setShowRestartModal(true)
      }
      return
    }

    try {
      // Force showing the checking state for better visual feedback, even in dev mode
      setError(null)
      setStatus('checking')

      // Artificial delay for visual feedback
      setTimeout(async () => {
        try {
          // checkForUpdates returns the updateInfo if found
          const info = await window.api.checkForUpdates()
          if (!info) {
            // No update found or skipped in dev mode
            setStatus('no-update')
            setTimeout(() => setStatus('idle'), 3000)
          }
        } catch (e) {
          // If it throws, it's an actual error (network, config, etc)
          setError(e.message || 'Connection failed')
          setStatus('error')
        }
      }, 1200)
    } catch (err) {
      setError('Communication error')
      setStatus('error')
    }
  }

  const handleDownload = async () => {
    try {
      setStatus('downloading')
      await window.api.downloadUpdate()
    } catch (err) {
      setError('Download failed.')
      setStatus('error')
    }
  }

  const handleInstall = () => {
    window.api.installUpdate()
  }

  const buttonBaseClass =
    'flex items-center justify-center gap-2 px-4 py-1.5 border rounded-[5px] text-xs transition-all min-w-[140px]'
  const buttonStyles = {
    backgroundColor: 'var(--color-bg-secondary)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)'
  }

  const renderStatus = () => {
    switch (status) {
      case 'idle':
        return (
          <button onClick={handleCheck} className={buttonBaseClass} style={buttonStyles}>
            <RefreshCw size={14} className={status === 'checking' ? 'animate-spin' : ''} />
            check for update...
          </button>
        )
      case 'checking':
        return (
          <div className={`${buttonBaseClass} opacity-60 pointer-events-none`} style={buttonStyles}>
            <Loader2 size={14} className="animate-spin" />
            Checking...
          </div>
        )
      case 'available':
        return (
          <button
            onClick={handleDownload}
            className={`${buttonBaseClass} bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20`}
          >
            <Download size={14} />
            Update and Download
          </button>
        )
      case 'downloading':
        return (
          <div className="flex flex-col items-end gap-2">
            <div className="w-36 h-1.5 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-[var(--color-accent-primary)] transition-all duration-300 shadow-[0_0_10px_var(--color-accent-primary)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] opacity-60 font-mono italic">{progress}% Downloaded</span>
          </div>
        )
      case 'downloaded':
        return (
          <button
            onClick={handleInstall}
            className={`${buttonBaseClass} animate-pulse bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20`}
          >
            <RotateCcw size={14} />
            Update and Restart
          </button>
        )
      case 'no-update':
        return (
          <div className="flex items-center gap-2 text-emerald-500 text-xs py-1.5 px-3">
            <CheckCircle size={14} />
            <span className="font-medium">Everything's up to date!</span>
          </div>
        )
      case 'error':
        return (
          <button
            onClick={handleCheck}
            className={`${buttonBaseClass} border-red-500/30 text-red-500 hover:bg-red-500/5 transition-colors`}
          >
            <AlertCircle size={14} />
            Retry Check
          </button>
        )
      default:
        return null
    }
  }

  return (
    <>
      <SettingRow
        label={
          <div className="flex items-center gap-2">
            <span>Software Updates</span>
            <span className="px-1.5 py-0.5 rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] font-mono text-[9px] border border-[var(--color-border)]">
              v{currentVersion}
            </span>
          </div>
        }
        description={
          status === 'error' ? (
            <span className="text-red-400/80">{error}</span>
          ) : status === 'available' ? (
            `New version ${updateInfo?.version} is ready for you!`
          ) : status === 'downloaded' ? (
            'Update downloaded successfully. Restart to apply.'
          ) : (
            'Stay up to date with the latest improvements and bug fixes.'
          )
        }
      >
        {renderStatus()}
      </SettingRow>

      {/* Restart Required Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div
            className="w-[340px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <button
              onClick={() => setShowRestartModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-full transition-colors"
            >
              <X size={16} className="opacity-40" />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Info size={24} className="text-blue-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold capitalize">System Reboot Required</h3>
                <p className="text-xs opacity-60 leading-relaxed">
                  The update service has been configured. Please restart Dev Snippet to activate
                  background update checking.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <button
                  onClick={() => setShowRestartModal(false)}
                  className="px-4 py-2 rounded-md text-xs font-medium border border-[var(--color-border)] hover:bg-white/5 transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={() => {
                    if (window.api?.relaunch) {
                      window.api.relaunch()
                    } else {
                      window.api.closeWindow()
                    }
                  }}
                  className="px-4 py-2 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Restart Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UpdateManager
