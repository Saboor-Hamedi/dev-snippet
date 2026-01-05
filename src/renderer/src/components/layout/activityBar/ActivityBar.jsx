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
  RefreshCw
} from 'lucide-react'
import { useActivityBar } from './useActivityBar'

const ActivityButton = ({
  item,
  isActive,
  glow = false,
  styles,
  onSettings,
  handleAction,
  loading
}) => {
  const Icon = item.icon

  return (
    <button
      onClick={(e) => {
        e.currentTarget.blur()
        item.id === 'settings' ? onSettings() : handleAction(item)
      }}
      className={`w-full h-[48px] flex items-center justify-center relative cursor-pointer group transition-all duration-300 theme-exempt ${
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
          size={19}
          className={loading ? 'animate-spin' : ''}
          color={
            isActive || loading
              ? 'var(--activity-bar-active-fg, #ffffff)'
              : 'var(--activity-bar-inactive-fg, rgba(255,255,255,0.45))'
          }
        />
        {item.badge > 0 && !loading && (
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
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)

  const items = useMemo(
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
    if (isCheckingUpdate) return
    setIsCheckingUpdate(true)

    // Ensure spinner spins for at least 1.5s for better UX
    const minTime = new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      if (window.api?.checkForUpdates) {
        // Create a promise that resolves when specific update events occur
        const checkEventPromise = new Promise((resolve, reject) => {
          let cleaned = false
          const cleanup = () => {
            if (cleaned) return
            cleaned = true
            unsubAv && unsubAv()
            unsubNot && unsubNot()
            unsubErr && unsubErr()
          }

          const unsubAv = window.api.onUpdateAvailable((info) => {
            cleanup()
            resolve({ type: 'available', info })
          })
          const unsubNot = window.api.onUpdateNotAvailable(() => {
            cleanup()
            resolve({ type: 'not-available' })
          })
          const unsubErr = window.api.onUpdateError((err) => {
            cleanup()
            reject(err)
          })

          // Trigger the check
          window.api
            .checkForUpdates()
            .then((res) => {
              if (res === null) {
                cleanup()
                resolve({ type: 'dev-mode' })
              }
            })
            .catch((err) => {
              cleanup()
              reject(err)
            })

          // Safety timeout
          setTimeout(() => {
            cleanup()
            resolve({ type: 'timeout' })
          }, 15000)
        })

        // Wait for both the minimum timer and the event result
        const [_, result] = await Promise.all([minTime, checkEventPromise])

        if (result.type === 'available') {
          const ver = result.info.version || 'Unknown'
          showToast(`Update available: v${ver}`, 'success')
        } else if (result.type === 'not-available') {
          showToast('App is up to date', 'info')
        } else if (result.type === 'dev-mode') {
          showToast('App is up to date (Dev Mode)', 'info')
        } else if (result.type === 'timeout') {
          showToast('Update check timed out', 'error')
        }
      } else {
        // Mock for dev
        await minTime
        showToast('App is up to date (Dev Mode)', 'info')
      }
    } catch (error) {
      await minTime
      showToast('Failed to check for updates', 'error')
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const handleAction = (item) => {
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
      className="w-[48px] h-full flex flex-col items-stretch z-10 select-none activity-bar transition-colors duration-300 border-r border-white/5 overflow-hidden"
      style={{ backgroundColor: 'var(--activity-bar-bg, #09090b)' }}
    >
      <div className="flex flex-col w-full">
        {items.map((item) => (
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

      <div className="mt-auto flex flex-col w-full">
        <ActivityButton
          item={{ id: 'update', icon: RefreshCw, label: 'Check for Updates' }}
          isActive={false}
          styles={styles}
          onSettings={onSettings}
          handleAction={handleAction}
          loading={isCheckingUpdate}
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
