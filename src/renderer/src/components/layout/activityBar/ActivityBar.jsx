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
      className={`w-full h-[40px] flex items-center justify-center relative cursor-pointer group transition-all duration-200 ${
        glow
          ? 'bg-[var(--color-accent-primary)]/10 ring-1 ring-inset ring-[var(--color-accent-primary)]/20 shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.15)]'
          : isActive
            ? 'bg-[var(--color-bg-tertiary)] opacity-100'
            : 'hover:bg-[var(--color-bg-tertiary)]/50 opacity-80 hover:opacity-100'
      }`}
      style={itemStyle}
      title={item.label}
    >
      <div className="relative group-active:scale-90 transition-transform duration-150">
        <Icon strokeWidth={isActive ? 2 : 1.5} size={18} color={itemStyle.color} />
        {item.badge > 0 && (
          <div
            className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center font-bold"
            style={styles.badge}
          >
            <span className="text-[9px] px-0.5 pointer-events-none">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          </div>
        )}
      </div>
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full"
          style={styles.indicator}
        />
      )}
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
      className="w-[40px] h-full flex flex-col items-center z-10 select-none border-r border-[var(--color-border)] activity-bar transition-colors duration-300"
      style={{ backgroundColor: 'var(--activity-bar-bg)' }}
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
