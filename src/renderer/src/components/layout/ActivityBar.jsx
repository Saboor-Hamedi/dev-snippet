import React from 'react'
import PropTypes from 'prop-types'
import { Files, Palette, Settings } from 'lucide-react'

const ActivityBar = ({ activeTab, onTabChange, onSettings }) => {
  const items = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'themes', icon: Palette, label: 'Themes' }
  ]

  return (
    <div
      className="w-12 flex flex-col items-center z-10 select-none transition-colors duration-300"
      style={{
        backgroundColor: 'var(--activity-bar-bg, #161b22)',
        borderRight: '1px solid var(--color-border, #444)'
      }}
    >
      <div className="flex flex-col w-full">
        {items.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full h-12 flex items-center justify-center relative cursor-pointer transition-all duration-200"
              style={{
                color: isActive
                  ? 'var(--color-accent-primary, #ffffff)'
                  : 'var(--color-text-secondary, rgba(255, 255, 255, 0.4))',
                opacity: isActive ? 1 : 0.6
              }}
              title={item.label}
            >
              <Icon strokeWidth={isActive ? 2 : 1.5} size={22} />

              {/* Active Indicator Bar (Left Border) */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r-full"
                  style={{ backgroundColor: 'var(--color-accent-primary, #007fd4)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-auto flex flex-col w-full">
        <button
          onClick={onSettings}
          className="w-full h-12 flex items-center justify-center transition-opacity hover:opacity-100"
          style={{ color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.4))' }}
          title="Settings"
        >
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

ActivityBar.propTypes = {
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func.isRequired,
  onSettings: PropTypes.func
}

export default React.memo(ActivityBar)
