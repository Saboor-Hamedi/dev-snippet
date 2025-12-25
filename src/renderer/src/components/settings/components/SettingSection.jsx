import React from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable section wrapper for grouped settings
 * Provides consistent styling and spacing
 */
const SettingSection = ({ title, icon: Icon, iconColor, children, className = '' }) => {
  return (
    <section className={`mb-6 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-3 ml-3">
          {Icon && <Icon size={14} style={{ color: 'var(--color-accent-primary)' }} />}
          <h3
            className="text-xtiny font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {title}
          </h3>
        </div>
      )}
      <div
        className="rounded-md border shadow-sm"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)'
        }}
      >
        {children}
      </div>
    </section>
  )
}

SettingSection.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.elementType,
  iconColor: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

export default SettingSection
