import React from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable section wrapper for grouped settings
 * Provides consistent styling and spacing
 */
const SettingSection = ({ title, icon: Icon, iconColor, children, className = '' }) => {
  return (
    <section className={`mb-4 ${className}`}>
      {title && (
        <div className="flex items-center gap-1.5 mb-1 ml-2">
          {Icon && (
            <Icon
              size={11}
              style={{ color: 'var(--color-accent-primary)' }}
              className="opacity-100 flex-shrink-0 relative top-[1px]"
            />
          )}
          <h3
            className="text-[9px] font-bold uppercase tracking-wider opacity-60"
            style={{ color: 'var(--color-text-tertiary)', lineHeight: 1 }}
          >
            {title}
          </h3>
        </div>
      )}
      <div className="p-0">{children}</div>
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
