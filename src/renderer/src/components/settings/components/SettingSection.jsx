import React from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable section wrapper for grouped settings
 * Provides consistent styling and spacing
 */
const SettingSection = ({ title, children, className = '' }) => {
  return (
    <section className={className}>
      {title && (
        <h3
          className="text-xtiny font-semibold uppercase tracking-wider mb-3 ml-3"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {title}
        </h3>
      )}
      <div
        className="rounded-md border overflow-hidden"
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
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

export default SettingSection
