import React from 'react'
import { Settings } from 'lucide-react'

// Always return .md for markdown snippets
const getExtension = () => '.md'

// Always return 'Markdown' for language name
const getLanguageName = () => 'Markdown'

const StatusBar = ({ onSettingsClick }) => {
  // Only show Markdown extension and name
  const ext = getExtension()
  const canonical = getLanguageName()

  return (
    <div className="h-8 px-3 flex items-center justify-between bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex-shrink-0 z-50 relative">
      <div className="flex items-center gap-3">
        <span>Ext: {ext}</span>
        <span>Language: {canonical}</span>
      </div>
      <button
        onClick={onSettingsClick}
        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer z-50 relative"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  )
}

export default React.memo(StatusBar)
