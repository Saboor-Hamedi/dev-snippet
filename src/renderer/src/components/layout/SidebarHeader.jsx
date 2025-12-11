import React from 'react'
import PropTypes from 'prop-types'
import { Plus } from 'lucide-react'

const SidebarHeader = ({ title, count, itemLabel, onAction }) => (
  <div
    className="flex items-center justify-between border-b flex-shrink-0 transition-colors duration-200"
    style={{ backgroundColor: 'var(--color-background-soft)', borderColor: 'var(--border-color)' }}
  >
    <div className="flex items-center gap-3 p-2 ">
      <h1 className="text-sm font-medium" style={{ color: 'var(--sidebar-header-text)' }}>
        {title}
      </h1>
      <>
        <p className="text-xs" style={{ color: 'var(--sidebar-header-text)' }}>
          {count}
          {count !== 1 ? 's' : ''}
        </p>
      </>
    </div>

    {onAction && (
      <button
        onClick={onAction}
        className="flex-shrink-0 p-1 rounded transition-colors"
        style={{ color: 'var(--sidebar-header-text)' }}
        title={`New ${itemLabel || 'Item'}`}
      >
        <Plus size={12} />
      </button>
    )}
  </div>
)

// Export this too!
export const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <p className="text-slate-500">{message}</p>
  </div>
)

SidebarHeader.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  itemLabel: PropTypes.string,
  onAction: PropTypes.func
}

export default SidebarHeader
