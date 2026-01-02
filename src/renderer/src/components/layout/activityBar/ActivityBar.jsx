import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Files, Palette, Settings, Trash2, Calendar } from 'lucide-react'
import { useActivityBar } from './useActivityBar'

const ActivityButton = ({ item, isActive, glow = false, styles, onSettings, handleAction }) => {
  const Icon = item.icon
  const itemStyle = styles.item(isActive)

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

      {/* Active Selection Indicator (Neutral) */}
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] bg-white rounded-r-full transition-all duration-300 ${
          isActive ? 'h-6 opacity-80' : 'h-0 opacity-0'
        }`}
      />

      <div className="relative group-active:scale-95 transition-transform duration-150 z-10">
        <Icon
          strokeWidth={isActive ? 2 : 1.5}
          size={19}
          color={isActive ? '#ffffff' : 'rgba(255,255,255,0.45)'}
        />
        {item.badge > 0 && (
          <div className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center font-bold bg-red-500 text-white shadow-sm">
            <span className="text-[8px] px-0.5 pointer-events-none">
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
  isSettingsOpen,
  trashCount = 0,
  settings
}) => {
  const { styles } = useActivityBar(settings, activeTab, trashCount)
  const [glowingTab, setGlowingTab] = useState(null)

  const items = useMemo(
    () => [
      { id: 'explorer', icon: Files, label: 'Explorer' },
      { id: 'daily-note', icon: Calendar, label: 'Daily Log', action: onDailyNote },
      { id: 'themes', icon: Palette, label: 'Themes' },
      { id: 'trash', icon: Trash2, label: 'Trash', badge: trashCount, action: onTrash }
    ],
    [onDailyNote, onTrash, trashCount]
  )

  const handleAction = (item) => {
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
      className="w-[48px] h-full flex flex-col items-center z-10 select-none activity-bar transition-colors duration-300 border-right border-white/5"
      style={{ backgroundColor: '#09090b' }}
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
  trashCount: PropTypes.number,
  isSettingsOpen: PropTypes.bool,
  settings: PropTypes.object
}

export default ActivityBar
