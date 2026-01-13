import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Files,
  Palette,
  Settings,
  Trash2,
  Calendar,
  Share2,
  Sparkles,
  RefreshCw,
  Download,
  RotateCcw,
  Book
} from 'lucide-react'
import { useActivityBar } from './useActivityBar'

const ActivityButton = ({
  item,
  isActive,
  glow = false,
  styles,
  onSettings,
  handleAction,
  loading,
  progress = 0,
  isDownloading = false
}) => {
  const Icon = item.icon

  return (
    <button
      onClick={(e) => {
        e.currentTarget.blur()
        item.id === 'settings' ? onSettings() : handleAction(item)
      }}
      className={`w-full h-[36px] flex items-center justify-center relative cursor-pointer group transition-all duration-300 theme-exempt ${
        isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'
      }`}
      style={{ background: 'transparent' }}
      title={item.label}
    >
      {/* Sliding Hover Overlay */}
      <div className="absolute inset-0 bg-white/[0.05] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 pointer-events-none" />

      {/* Active Selection Indicator */}
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] rounded-r-full transition-all duration-300 ${
          isActive && !loading ? 'h-6 opacity-100' : 'h-0 opacity-0'
        }`}
        style={{
          backgroundColor: 'var(--activity-bar-active-border, #ffffff)'
        }}
      />

      {/* Change icon on activitybar hover */}
      <div
        className={`flex items-center justify-center w-full h-full relative z-10 transition-transform duration-150 ${!loading && 'group-active:scale-95'}`}
      >
        <Icon
          strokeWidth={isActive ? 2 : 1.5}
          size={item.iconSize || 19}
          className={loading ? 'animate-spin' : ''}
          color={
            isActive || loading
              ? 'var(--activity-bar-active-fg, #ffffff)'
              : 'var(--activity-bar-inactive-fg, rgba(255,255,255,0.45))'
          }
        />
        
        {/* Round Progress Indicator */}
        {isDownloading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg 
              className="w-8 h-8 -rotate-90 drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]"
              viewBox="0 0 32 32"
            >
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="transparent"
                className="text-white/10"
              />
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke="var(--activity-bar-active-fg, #ffffff)"
                strokeWidth="2.5"
                fill="transparent"
                strokeDasharray={81.68}
                strokeDashoffset={81.68 - (81.68 * progress) / 100}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
          </div>
        )}

        {item.badge > 0 && !loading && !isDownloading && (
          <div
            className="absolute top-3 right-3  min-w-[10px] h-[10px] rounded-full flex items-center justify-center font-bold shadow-sm"
            style={{
              backgroundColor: 'var(--activity-bar-badge-bg, #ef4444)',
              color: 'var(--activity-bar-badge-fg, #ffffff)'
            }}
          >
            <span className="text-[6px] px-0.5 pointer-events-none">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

const ActivityBar = ({
  activeTab,
  onTabChange,
  onSettings,
  onDailyNote,
  onTrash,
  onAIPilot,
  isSettingsOpen,
  trashCount = 0,
  settings,
  showToast
}) => {
  const { styles } = useActivityBar(settings, activeTab, trashCount)
  const [glowingTab, setGlowingTab] = useState(null)
  const [updateStatus, setUpdateStatus] = useState('idle')
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Update Lifecycle Listeners
  React.useEffect(() => {
    if (!window.api?.onUpdateAvailable) return
    const unsubAvailable = window.api.onUpdateAvailable(() => setUpdateStatus('available'))
    const unsubNotAvailable = window.api.onUpdateNotAvailable(() => {
      setUpdateStatus('no-update')
      setTimeout(() => setUpdateStatus('idle'), 3000)
    })
    const unsubProgress = window.api.onDownloadProgress((p) => {
      setUpdateStatus('downloading')
      setDownloadProgress(p.percent)
    })
    const unsubDownloaded = window.api.onUpdateDownloaded(() => setUpdateStatus('downloaded'))
    const unsubError = (err) => {
      let msg = err
      if (typeof err === 'string' && err.includes('not-packed')) {
        msg = 'Updater only works in installed version.'
      }
      showToast(msg, 'error')
      setUpdateStatus('error')
      setTimeout(() => setUpdateStatus('idle'), 4000)
    }

    if (window.api.onUpdateError) window.api.onUpdateError(unsubError)

    return () => {
      unsubAvailable()
      unsubNotAvailable()
      unsubProgress()
      unsubDownloaded()
    }
  }, [])

  const topItems = useMemo(
    () => [
      { id: 'explorer', icon: Files, label: 'Explorer' },
      { id: 'graph', icon: Share2, label: 'Knowledge Graph' },
      { id: 'ai', icon: Sparkles, label: 'AI Pilot', action: onAIPilot },
      { id: 'daily-note', icon: Calendar, label: 'Daily Log', action: onDailyNote },
      { id: 'themes', icon: Palette, label: 'Themes' },
      { id: 'trash', icon: Trash2, label: 'Trash', badge: trashCount, action: onTrash }
    ],
    [onDailyNote, onTrash, onAIPilot, trashCount]
  )

  const handleUpdateCheck = async () => {
    if (updateStatus === 'checking') return
    if (updateStatus === 'available') {
      try {
        setUpdateStatus('downloading')
        await window.api.downloadUpdate()
      } catch (err) {
        showToast('Download start failed', 'error')
        setUpdateStatus('available')
      }
      return
    }
    if (updateStatus === 'downloaded') {
      window.api.installUpdate()
      return
    }
    if (!window.api?.checkForUpdates) {
      showToast('Update feature unavailable', 'error')
      return
    }
    setUpdateStatus('checking')
    const safetyTimer = setTimeout(() => {
      setUpdateStatus((prev) => (prev === 'checking' ? 'idle' : prev))
      showToast('Check timed out', 'error')
    }, 15000)

    try {
      const info = await window.api.checkForUpdates()
      clearTimeout(safetyTimer)
      if (!info) {
        setUpdateStatus('no-update')
        setTimeout(() => setUpdateStatus('idle'), 3000)
        showToast('App is up to date', 'info')
      } else {
        setUpdateStatus('available')
      }
    } catch (error) {
      clearTimeout(safetyTimer)
      setUpdateStatus('error')
      showToast(error.message || 'Update check failed', 'error')
      setTimeout(() => setUpdateStatus('idle'), 4000)
    }
  }

  const handleAction = (item) => {
    if (item.id === 'docs') {
      window.dispatchEvent(new CustomEvent('app:open-docs'))
      return
    }
    if (item.id === 'update') {
      handleUpdateCheck()
      return
    }
    if (item.action) {
      if (item.id !== 'daily-note') {
        setGlowingTab(item.id)
        setTimeout(() => setGlowingTab(null), 1000)
      }
      item.action()
    } else {
      onTabChange(item.id)
    }
  }

  return (
    <div
      className="w-[48px] flex-shrink-0 h-full flex flex-col items-stretch z-10 select-none activity-bar transition-all duration-300 border-r border-white/5 overflow-hidden py-2"
      style={{ backgroundColor: 'var(--activity-bar-bg, #09090b)' }}
    >
      {/* Top Section: Navigation */}
      <div className="flex flex-col w-full gap-1">
        {topItems.map((item) => (
          <ActivityButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            glow={glowingTab === item.id}
            styles={styles}
            onSettings={onSettings}
            handleAction={handleAction}
          />
        ))}
      </div>

      {/* Bottom Section: System */}
      <div className="mt-auto flex flex-col w-full gap-1">
        <ActivityButton
          item={{ 
            id: 'docs', 
            icon: Book,
            label: 'Documentation'
          }}
          isActive={false}
          styles={styles}
          onSettings={onSettings}
          handleAction={handleAction}
        />
        <ActivityButton
          item={{ 
            id: 'update', 
            icon: updateStatus === 'downloaded' ? RotateCcw : updateStatus === 'available' ? Download : RefreshCw,
            label: updateStatus === 'downloaded' ? 'Restart to Update' : updateStatus === 'available' ? 'Download Update' : 'Check for Updates'
          }}
          isActive={updateStatus !== 'idle'}
          styles={styles}
          onSettings={onSettings}
          handleAction={handleAction}
          loading={updateStatus === 'checking'}
          isDownloading={updateStatus === 'downloading'}
          progress={downloadProgress}
        />
        <ActivityButton
          item={{ id: 'settings', icon: Settings, label: 'Settings' }}
          isActive={isSettingsOpen}
          styles={styles}
          onSettings={onSettings}
          handleAction={handleAction}
        />
      </div>
    </div>
  )
}

ActivityBar.propTypes = {
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func.isRequired,
  onSettings: PropTypes.func,
  onDailyNote: PropTypes.func,
  onTrash: PropTypes.func,
  onAIPilot: PropTypes.func,
  trashCount: PropTypes.number,
  isSettingsOpen: PropTypes.bool,
  settings: PropTypes.object
}

export default ActivityBar
