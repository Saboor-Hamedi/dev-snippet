import React from 'react'
import { Settings } from 'lucide-react'
import PropTypes from 'prop-types'

const StatusBar = ({ onSettingsClick, zoomLevel = 1, title, isLargeFile = false }) => {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-shrink-1">
      {/* Language/Extension display removed as per user request */}
      <span className="px-1 py-0.5 rounded text-xs text-slate-500 dark:text-slate-400">
        {title?.split('.').pop() || 'Untitled'}
      </span>

      {/* Show zoom level - Always visible for clarity during debug */}
      <span
        className="px-1 py-0.5 rounded text-xs text-slate-500 dark:text-slate-400"
        title="Zoom Level (Ctrl/Cmd + +/- to adjust, Ctrl/Cmd + 0 to reset)"
      >
        {Math.round(zoomLevel * 100)}%
      </span>

      {/* Large File Performance Mode Indicator */}
      {isLargeFile && (
        <span
          className="px-1.5 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
          title="Performance Mode: Some features disabled for large files"
        >
          ⚡ Performance
        </span>
      )}

      <button
        onClick={onSettingsClick}
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
        title="Settings"
      >
        <Settings className="w-3 h-3" />
      </button>
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
