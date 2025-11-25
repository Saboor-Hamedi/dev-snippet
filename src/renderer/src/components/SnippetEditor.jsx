import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { X } from 'lucide-react'
import toCapitalized from '../hook/stringUtils'

const SnippetEditor = ({ onSave, initialSnippet, onCancel }) => {
  const [code, setCode] = useState(initialSnippet?.code || '')
  const [language, setLanguage] = useState(initialSnippet?.language || 'javascript')

  // Update state if initialSnippet changes
  useEffect(() => {
    if (initialSnippet) {
      setCode(initialSnippet.code)
      setLanguage(initialSnippet.language)
    }
  }, [initialSnippet])

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (code.trim()) {
          handleSave()
        }
      }
      // Escape to cancel
      if (e.key === 'Escape' && onCancel) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [code, language, onCancel])

  const handleSave = () => {
    // Validation
    if (!code.trim()) return

    // Auto-generate title based on the first line of code (without "Snippet:" prefix)
    const codePreview = code.trim().substring(0, 30)
    const title = `${codePreview}${code.length > 30 ? '...' : ''}`

    // Construct the object
    const newSnippet = {
      id: initialSnippet?.id || Date.now().toString(),
      title: initialSnippet?.title || title,
      code: code,
      language: language,
      timestamp: Date.now(),
      type: 'snippet'
    }

    // Send it back to the parent
    onSave(newSnippet)

    // Reset form only if not editing
    if (!initialSnippet) {
      setCode('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSave()
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* VS Code Style Header */}
      {onCancel && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 transition-colors duration-200">
          {/* Left side */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onCancel}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {initialSnippet ? 'Editing Snippet' : 'New Snippet'}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-600 flex-shrink-0">•</span>
              <small className="text-xs text-slate-500 dark:text-slate-400 font-mono flex-shrink-0">
                {toCapitalized(language)}
              </small>
            </div>
          </div>

          {/* Right side - Keyboard shortcuts */}
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
            <span>Ctrl+S to save</span>
            <span className="text-slate-400">•</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* EDITOR AREA */}
        <div className="flex-1 relative">
          <textarea
            placeholder="// Start typing your code here...
// Press Ctrl+S to save"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-300 p-4 font-mono text-sm resize-none focus:outline-none transition-colors duration-200"
            spellCheck="false"
            autoFocus
          />
        </div>

        {/* Footer - Language Selector */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 bg-white dark:bg-slate-800/50 flex items-center justify-between backdrop-blur-sm transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="bash">Bash / Shell</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
              <option value="sql">SQL</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="plaintext">Plain Text</option>
            </select>
          </div>

          {/* Save button for mobile/accessibility */}
          <button
            type="submit"
            className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-500 text-white rounded font-medium transition-colors md:hidden"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

SnippetEditor.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialSnippet: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    code: PropTypes.string,
    language: PropTypes.string,
    timestamp: PropTypes.number
  }),
  onCancel: PropTypes.func
}

export default SnippetEditor
