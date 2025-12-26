import React from 'react'
import PropTypes from 'prop-types'

const SidebarHeader = ({ children, className }) => {
  return (
    <div
      className={`
        flex items-center justify-between px-3 py-2
        border-b border-[#1e1e1e]
        min-h-[36px]
        ${className || ''}
      `}
      style={{
        backgroundColor: 'var(--header-bg)',
        borderBottomColor: 'var(--color-border)'
      }}
    >
      {children}
    </div>
  )
}

SidebarHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
}

export default SidebarHeader
