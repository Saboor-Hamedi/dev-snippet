import React from 'react'
import { Settings } from 'lucide-react'

const StatusBar = ({ onSettingsClick, zoomLevel = 1, title }) => {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-shrink-1">
      {/* Language/Extension display removed as per user request */}

      {/* Show zoom level */}
      {zoomLevel !== 1 && (
        <span
          className="px-1 py-0.5 rounded text-xs text-slate-500 dark:text-slate-400"
          title="Zoom Level (Ctrl/Cmd + +/- to adjust, Ctrl/Cmd + 0 to reset)"
        >
          {Math.round(zoomLevel * 100)}%
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
