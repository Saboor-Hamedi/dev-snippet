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

  useEffect(() => {
    // Check if the update API is available (avoiding crashes before restart)
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
      setError(err)
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

  const handleCheck = async () => {
    // If API is missing, show the "Nice Modal" instead of just a console log
    if (!window.api?.checkForUpdates) {
      setShowRestartModal(true)
      return
    }

    try {
      setError(null)
      setStatus('checking')
      // Small artificial delay for visual feedback if on fast connection
      setTimeout(async () => {
        try {
          await window.api.checkForUpdates()
        } catch (e) {
          setError('Update service unavailable')
          setStatus('error')
        }
      }, 800)
    } catch (err) {
      setError('Failed to check for updates.')
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

  // Common button styles to match SettingsPanel
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
            <RefreshCw size={14} />
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
            className={`${buttonBaseClass} bg-blue-500/10 border-blue-500/30 text-blue-400`}
          >
            <Download size={14} />
            Download {updateInfo?.version || ''}
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
            <span className="text-[10px] opacity-60">{progress}% Downloaded</span>
          </div>
        )
      case 'downloaded':
        return (
          <button
            onClick={handleInstall}
            className={`${buttonBaseClass} animate-pulse bg-green-500/10 border-green-500/50 text-green-400`}
          >
            <RotateCcw size={14} />
            Restart to Update
          </button>
        )
      case 'no-update':
        return (
          <div className="flex items-center gap-2 text-green-500/80 text-xs py-1.5 px-3">
            <CheckCircle size={14} />
            <span>App is up to date</span>
          </div>
        )
      case 'error':
        return (
          <button
            onClick={handleCheck}
            className={`${buttonBaseClass} border-red-500/30 text-red-400`}
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
        label="Software Updates"
        description={
          status === 'error'
            ? error
            : status === 'available'
              ? `Version ${updateInfo?.version} is available!`
              : 'Keep Dev Snippet updated for the latest features and security improvements.'
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
                <h3 className="text-sm font-semibold capitalize">Restart Required</h3>
                <p className="text-xs opacity-60 leading-relaxed">
                  The update service was just installed. Please restart the application to enable
                  update checking.
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
