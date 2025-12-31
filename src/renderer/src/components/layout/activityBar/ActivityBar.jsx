import React from 'react'
import PropTypes from 'prop-types'
import { Files, Palette, Settings, Trash2, Calendar } from 'lucide-react'
import { useActivityBar } from './useActivityBar'

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

  const items = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'daily-note', icon: Calendar, label: 'Daily Log', action: onDailyNote },
    { id: 'themes', icon: Palette, label: 'Themes' },
    { id: 'trash', icon: Trash2, label: 'Trash', badge: trashCount, action: onTrash }
  ]

  const [glowingTab, setGlowingTab] = React.useState(null)

  const handleAction = (item) => {
    if (item.action) {
      setGlowingTab(item.id)
      setTimeout(() => setGlowingTab(null), 1000)
      item.action()
    } else {
      onTabChange(item.id)
    }
  }

  const ActivityButton = ({ item, isActive, glow = false }) => {
    const Icon = item.icon
    const itemStyle = styles.item(isActive)

    return (
      <button
        onClick={(e) => {
          e.currentTarget.blur()
          item.id === 'settings' ? onSettings() : handleAction(item)
        }}
        className={`w-full h-[40px] flex items-center justify-center relative cursor-pointer transition-all duration-300 group ${
          glow
            ? 'bg-[var(--color-accent-primary)]/10 ring-1 ring-inset ring-[var(--color-accent-primary)]/20 shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.15)]'
            : 'hover:bg-white/5'
        }`}
        style={itemStyle}
        title={item.label}
      >
        <div className="relative group-active:scale-90 transition-transform duration-150">
          <Icon strokeWidth={isActive ? 2 : 1.5} size={18} color={itemStyle.color} />
          {item.badge > 0 && (
            <div
              className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center"
              style={styles.badge}
            >
              <span className="text-[9px] font-bold px-0.5">
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

  return (
    <div className="w-[40px] h-full flex flex-col items-center z-10 select-none transition-colors duration-300 bg-[var(--activity-bar-bg)] border-r border-[var(--color-border)]">
      <div className="flex flex-col w-full">
        {items.map((item) => (
          <ActivityButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            glow={glowingTab === item.id}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col w-full">
        <ActivityButton
          item={{ id: 'settings', icon: Settings, label: 'Settings' }}
          isActive={isSettingsOpen}
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
  trashCount: PropTypes.number
}

export default React.memo(ActivityBar)
