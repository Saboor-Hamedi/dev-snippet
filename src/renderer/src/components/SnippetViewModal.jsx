import { useState } from 'react'
import { X, Trash2, Copy, Check } from 'lucide-react'
import useHighlight from '../hook/useHighlight'
import toCapitalized from '../hook/stringUtils'

const SnippetViewModal = ({ snippet, open, onClose, onRequestDelete }) => {
  const [copied, setCopied] = useState(false)

  const highlightedContent = useHighlight(snippet?.code || '', snippet?.language || 'text')

  if (!open || !snippet) return null

  const isCode = snippet.language !== 'text'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDelete = () => {
    onRequestDelete(snippet.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[80vh] overflow-hidden animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* VS Code Style Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900 flex-shrink-0">
          {/* Left side: File info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors flex-shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* File name and language */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium text-white truncate">{snippet.title}</span>
              <span className="text-xs text-slate-500 flex-shrink-0">•</span>
              <small className="text-xs text-slate-400 font-mono flex-shrink-0">
                {toCapitalized(snippet.language)}
              </small>
            </div>
          </div>

          {/* Right side: Meta info */}
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
            <span>
              {new Date(snippet.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Code Content - Clean structure */}
        <div className="flex-1 overflow-auto bg-slate-950">
          {isCode ? (
            <div className="p-4">
              <pre className="font-mono text-sm leading-6 m-0">
                <code
                  className="hljs block"
                  dangerouslySetInnerHTML={{ __html: highlightedContent }}
                />
              </pre>
            </div>
          ) : (
            <div className="p-6">
              <pre className="whitespace-pre-wrap font-sans text-base leading-7 text-slate-300 m-0">
                {snippet.code}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 bg-slate-900 flex-shrink-0">
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 hover:border-red-600 rounded-md font-medium transition-all flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            Delete
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-md font-medium transition-all"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                copied
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SnippetViewModal
