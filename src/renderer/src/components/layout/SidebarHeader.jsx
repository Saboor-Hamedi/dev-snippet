import React from 'react'
import PropTypes from 'prop-types'
import { PanelLeft } from 'lucide-react'

const SidebarHeader = ({ children, className, onToggle }) => {
  return (
    <div
      className={`
        flex items-center justify-between px-3 py-2
        border-none
        min-h-[36px]
        ${className || ''}
      `}
      style={{
        backgroundColor: 'var(--header-bg)',
        borderBottom: 'none'
      }}
    >
      {onToggle && (
        <button
          onClick={onToggle}
          className="p-1 mr-2 rounded hover:bg-[var(--color-bg-tertiary)] opacity-60 hover:opacity-100 transition-all text-[var(--sidebar-text)]"
          title="Toggle Sidebar"
        >
          <PanelLeft size={16} strokeWidth={2} />
        </button>
      )}
      {children}
    </div>
  )
}

SidebarHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  onToggle: PropTypes.func
}

export default SidebarHeader
