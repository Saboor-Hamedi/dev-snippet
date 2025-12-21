import React from 'react'
import PropTypes from 'prop-types'

const StatusBar = ({ onSettingsClick, zoomLevel = 1, title, isLargeFile = false }) => {
  return (
    <div className="flex items-center justify-end gap-3 text-xs text-slate-600 dark:text-slate-300 flex-1 px-4">
      {/* Large File Performance Mode Indicator */}
      {isLargeFile && (
        <span
          className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
          title="Performance Mode: Some features disabled for large files"
        >
          Performance Mode
        </span>
      )}

      <div className="flex items-center gap-3 opacity-70">
        {/* File Extension */}
        <span className="font-mono text-[10px] uppercase tracking-wider">
          {title?.split('.').pop() || 'PLAINTEXT'}
        </span>

        {/* Separator */}
        <span className="text-slate-300 dark:text-slate-700">|</span>

        {/* Zoom Level */}
        <span
          className="font-mono text-[10px]"
          title="Zoom Level (Ctrl/Cmd + +/- to adjust, Ctrl/Cmd + 0 to reset)"
        >
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>
    </div>
  )
}

export default React.memo(StatusBar)

StatusBar.propTypes = {
  onSettingsClick: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number,
  title: PropTypes.string,
  isLargeFile: PropTypes.bool
}
