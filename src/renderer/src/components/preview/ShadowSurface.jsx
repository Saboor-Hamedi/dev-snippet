import React, { useRef, useEffect, memo } from 'react'
import PropTypes from 'prop-types'

/**
 * ShadowSurface - A robust, reusable high-performance Shadow DOM wrapper for React.
 * Encapsulates styles and content while remaining part of the same execution context.
 */
const ShadowSurface = ({ html, styles, onRender, isDark, className = '' }) => {
  const hostRef = useRef(null)
  const shadowRootRef = useRef(null)
  const contentRef = useRef(null)
  const styleTagRef = useRef(null)

  // 1. Initialize Shadow Root (Once)
  useEffect(() => {
    if (hostRef.current && !shadowRootRef.current) {
      shadowRootRef.current = hostRef.current.attachShadow({ mode: 'open' })

      // Create content container
      const container = document.createElement('div')
      container.className = 'shadow-wrapper markdown-body'
      container.style.width = '100%'
      container.style.height = '100%'
      container.style.overflowY = 'auto'
      container.style.overflowX = 'hidden'
      container.style.boxSizing = 'border-box'
      container.style.scrollBehavior = 'smooth'
      shadowRootRef.current.appendChild(container)
      contentRef.current = container

      // Create style container
      const styleTag = document.createElement('style')
      styleTag.id = 'shadow-styles'
      shadowRootRef.current.appendChild(styleTag)
      styleTagRef.current = styleTag
    }
  }, [])

  // 2. Synchronize Styles
  useEffect(() => {
    if (styleTagRef.current && styles) {
      if (styleTagRef.current.textContent !== styles) {
        styleTagRef.current.textContent = styles
      }
    }
  }, [styles])

  // 2.1 Synchronize Dark Mode Class
  useEffect(() => {
    if (contentRef.current) {
      if (isDark) {
        contentRef.current.classList.add('dark')
      } else {
        contentRef.current.classList.remove('dark')
      }
    }
  }, [isDark])

  // 3. Synchronize Content & Trigger Render Hook
  const lastHtmlRef = useRef('')

  useEffect(() => {
    if (contentRef.current && html !== undefined) {
      // 3.1 Update HTML if it actually changed
      if (lastHtmlRef.current !== html) {
        contentRef.current.innerHTML = html
        lastHtmlRef.current = html
      }

      // 3.2 ALWAYS notify parent if render callback or content changed
      // This allows Mermaid to re-run on theme/font changes even if HTML is the same.
      if (onRender) {
        onRender(shadowRootRef.current, contentRef.current)
      }
    }
  }, [html, onRender])

  return (
    <div
      ref={hostRef}
      className={`shadow-host ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

ShadowSurface.propTypes = {
  html: PropTypes.string,
  styles: PropTypes.string,
  onRender: PropTypes.func,
  isDark: PropTypes.bool,
  className: PropTypes.string
}

export default memo(ShadowSurface)
