import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import './PerformanceBarrier.css'

/**
 * PerformanceBarrier Component
 *
 * Displays a warning when a document exceeds a certain word count.
 * Features a dismissible button and automatically re-appears when the user types.
 */
const PerformanceBarrier = ({ words, onSplit, triggerReset }) => {
  const [isDismissed, setIsDismissed] = useState(false)

  // Auto-reset dismissal when typing occurs
  useEffect(() => {
    if (isDismissed) {
      setIsDismissed(false)
    }
  }, [triggerReset])

  // Only show if words exceed limit and not currently dismissed
  if (words <= 20000 || isDismissed) {
    return null
  }

  return (
    <div className="performance-barrier-banner">
      <div className="flex items-center gap-3">
        <span className="text-base" role="img" aria-label="warning">
          ⚠️
        </span>
        <div className="flex flex-col text-left">
          <span className="font-bold text-[var(--color-text-primary)]">
            Document exceeds 20,000 words
          </span>
          <span className="text-xs opacity-70">
            To prevent performance issues and "Black Screens", consider splitting this snippet.
          </span>
        </div>
      </div>

      <button onClick={onSplit} className="split-action-btn">
        Split & Link
      </button>

      <button
        className="close-banner-btn"
        onClick={() => setIsDismissed(true)}
        title="Hide for now"
      >
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  )
}

PerformanceBarrier.propTypes = {
  words: PropTypes.number.isRequired,
  onSplit: PropTypes.func.isRequired,
  triggerReset: PropTypes.any // Any dependency that should reset the dismissal state
}

export default React.memo(PerformanceBarrier)
