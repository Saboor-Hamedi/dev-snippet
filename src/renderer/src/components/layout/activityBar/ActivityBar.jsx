import React from 'react'
import PropTypes from 'prop-types'
import { Files, Palette, Settings, Trash2 } from 'lucide-react'
import { useActivityBar } from './useActivityBar'

const ActivityBar = ({
  activeTab,
  onTabChange,
  onSettings,
  isSettingsOpen,
  trashCount = 0,
  settings
}) => {
  const { styles } = useActivityBar(settings, activeTab, trashCount)

  const items = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'themes', icon: Palette, label: 'Themes' },
    { id: 'trash', icon: Trash2, label: 'Trash', badge: trashCount }
  ]

  return (
    <div className="w-[40px] h-full flex flex-col items-center z-10 select-none transition-colors duration-300 bg-[var(--activity-bar-bg)] border-r border-[var(--color-border)]">
      <div className="flex flex-col w-full">
        {items.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          const itemStyle = styles.item(isActive)

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full h-[40px] flex items-center justify-center relative cursor-pointer transition-all duration-200"
              style={itemStyle}
              title={item.label}
            >
              <div className="relative">
                {/* Native Look: 18px + Thin Stroke (1.5) */}
                <Icon strokeWidth={isActive ? 2 : 1.5} size={18} color={itemStyle.color} />

                {/* Badge for trash count */}
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

              {/* Active Indicator Bar (Left Border) - Thinner/Smaller */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full"
                  style={styles.indicator}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-col w-full">
        <button
          onClick={onSettings}
          className="w-full h-[40px] flex items-center justify-center relative cursor-pointer transition-all duration-200"
          style={styles.item(isSettingsOpen)}
          title="Settings"
        >
          <Settings
            size={18}
            strokeWidth={isSettingsOpen ? 2 : 1.5}
            color={styles.item(isSettingsOpen).color}
          />
          {isSettingsOpen && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full"
              style={styles.indicator}
            />
          )}
        </button>
      </div>
    </div>
  )
}

ActivityBar.propTypes = {
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func.isRequired,
  onSettings: PropTypes.func,
  trashCount: PropTypes.number
}

export default React.memo(ActivityBar)
