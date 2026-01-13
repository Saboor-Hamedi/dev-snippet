import React from 'react'
import PropTypes from 'prop-types'

/**
 * Standard Sidebar Layout Primitives
 *
 * Usage:
 * <SidebarPane>
 *   <SidebarHeader>
 *      <h1>My Title</h1>
 *   </SidebarHeader>
 *
 *   <SidebarBody>
 *      {/* Scrollable Content Goes Here - Auto Scrolled! *\/}
 *      {item.map(...)}
 *   </SidebarBody>
 *
 *   <SidebarFooter>
 *      <button>Action</button>
 *   </SidebarFooter>
 * </SidebarPane>
 */

export const SidebarPane = ({ children, className = '' }) => {
  return (
    <div
      className={`h-full flex flex-col w-full overflow-hidden bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] ${className}`}
    >
      {children}
    </div>
  )
}

SidebarPane.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
}

export const SidebarHeader = ({ children, className = '' }) => {
  return (
    <div
      className={`flex-none z-10 relative border-b border-[var(--color-border)] select-none ${className}`}
    >
      {children}
    </div>
  )
}

SidebarHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
}

export const SidebarBody = ({ children, className = '', noPadding = false }) => {
  return (
    <div className="flex-1 relative min-h-0">
      <div
        className={`absolute inset-0 overflow-y-auto custom-scrollbar ${noPadding ? '' : 'p-2 pb-6'} space-y-4 ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

SidebarBody.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  noPadding: PropTypes.bool
}

export const SidebarFooter = ({ children, className = '' }) => {
  return (
    <div
      className={`flex-none border-t border-[var(--color-border)] bg-[var(--footer-bg)] p-2 ${className}`}
    >
      {children}
    </div>
  )
}

SidebarFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
}
