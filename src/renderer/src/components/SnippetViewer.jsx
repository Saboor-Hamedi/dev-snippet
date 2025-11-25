// SNIPPET VIEWER - Full screen snippet view (opens when clicking on snippet card)
// Shows code with syntax highlighting and line numbers
import React from 'react'
import PropTypes from 'prop-types'
import useHighlight from '../hook/useHighlight'
import toCapitalized from '../hook/stringUtils'
import { Copy, X, Pencil } from 'lucide-react'

const SnippetViewer = ({ snippet, onClose, onEdit }) => {
  const highlightedContent = useHighlight(snippet?.code || '', snippet?.language || 'text')

  if (!snippet) return null

  const isCode = snippet.language !== 'text'
  const codeLines = snippet.code.split('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  const formattedTimestamp = new Date(snippet.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* VS Code Style Header - Matches SnippetEditor */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 transition-colors duration-200">
        {/* Left side */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title and language */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {snippet.title}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-600 flex-shrink-0">•</span>
            <small className="text-xs text-slate-500 dark:text-slate-400 font-mono flex-shrink-0">
              {toCapitalized(snippet.language)}
            </small>
          </div>
        </div>

        {/* Right side - Meta info and actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Meta info */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{codeLines.length} lines</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-500">{formattedTimestamp}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                title="Edit snippet"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Rest of your existing code view area remains the same */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 transition-colors duration-200">
        {isCode ? (
          <div className="flex min-h-full">
            {/* Line Numbers */}
            <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 px-3 py-4 select-none transition-colors duration-200">
              <div className="font-mono text-xs leading-6 text-slate-400 dark:text-slate-600 text-right">
                {codeLines.map((_, index) => (
                  <div key={index} className="h-6">
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 px-4 py-4">
              <pre className="font-mono text-sm leading-6 text-slate-800 dark:text-slate-200">
                <code className="hljs" dangerouslySetInnerHTML={{ __html: highlightedContent }} />
              </pre>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-base leading-7 text-slate-800 dark:text-slate-300">
                {snippet.code}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

SnippetViewer.propTypes = {
  snippet: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    code: PropTypes.string,
    language: PropTypes.string,
    timestamp: PropTypes.number
  }),
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func
}

export default SnippetViewer
