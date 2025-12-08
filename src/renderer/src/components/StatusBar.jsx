import React from 'react'
import { Settings } from 'lucide-react'
import { getLanguage } from './language/languageRegistry.js'

// Get extension based on title or language
const getExtension = (title, language) => {
  if (title) {
    const ext = title.split('.').pop()
    if (ext && ext !== title) return `.${ext}`
  }
  if (!language) return '.txt'
  const langDef = getLanguage(language)
  return langDef && langDef.extensions && langDef.extensions[0]
    ? `.${langDef.extensions[0]}`
    : '.txt'
}

// Get language name based on selected language
const getLanguageName = (language) => {
  if (!language) return 'Markdown'
  const langDef = getLanguage(language)
  return langDef ? langDef.name : 'Plain Text'
}

const StatusBar = ({ onSettingsClick, language, zoomLevel = 1, title }) => {
  // Show extension and name based on selected language
  const ext = getExtension(title, language)
  const canonical = getLanguageName(language)
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-shrink-0">
      {/* Show extension with same hover behavior as header buttons */}
      <span
        className="px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={canonical}
      >
        {ext ? ext : ''}
      </span>

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
