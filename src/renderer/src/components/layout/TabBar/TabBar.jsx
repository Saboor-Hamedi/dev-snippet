import React from 'react'
import './TabBar.css'
import { X, File } from 'lucide-react'
import { getFileIcon } from '../../../utils/iconUtils'

const TabBar = ({
  tabs = [],
  activeTabId,
  onTabClick,
  onTabClose,
  isSidebarOpen,
  sidebarWidth
}) => {
  return (
    <div className="tab-bar-container">
      <div className="tab-scroll-container">
        {tabs.map((tab) => {
          const { icon: FileIcon, color } = getFileIcon(null, tab.title || '')
          return (
            <div
              key={tab.id}
              className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => onTabClick && onTabClick(tab.id)}
            >
              <div className="tab-icon">
                <FileIcon size={14} style={{ color: color || 'var(--color-text-secondary)' }} />
              </div>
              <span className="tab-title">{(tab.title || 'Untitled').replace(/\.md$/, '')}</span>
              <button
                className="tab-close-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onTabClose && onTabClose(tab.id)
                }}
              >
                <X size={12} />
              </button>
              {/* Active Indicator Line */}
              {tab.id === activeTabId && <div className="tab-active-border" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TabBar

