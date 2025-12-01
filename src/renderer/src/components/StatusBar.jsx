import React from 'react'

// Always return .md for markdown snippets
const getExtension = () => '.md'

// Always return 'Markdown' for language name
const getLanguageName = () => 'Markdown'

const StatusBar = () => {
  // Only show Markdown extension and name
  const ext = getExtension()
  const canonical = getLanguageName()
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-8 px-3 flex items-center justify-between bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
      style={{ zIndex: 50 }}
    >
      <div className="flex items-center gap-3">
        <span>Ext: {ext}</span>
        <span>Language: {canonical}</span>
      </div>
    </div>
  )
}

export default React.memo(StatusBar)
