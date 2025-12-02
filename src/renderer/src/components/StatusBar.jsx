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
    <div
      className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-shrink-0"
    >
      {/* Show extension with same hover behavior as header buttons */}
      <span
        className="px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={canonical}
      >
        {ext ? ext : ''}
      </span>
      
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
