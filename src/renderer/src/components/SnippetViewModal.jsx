import { useState } from 'react'
import useSyntaxHighlight from '../hook/useSyntaxHighlight'

const SnippetViewModal = ({ snippet, open, onClose, onRequestDelete }) => {
  const [copied, setCopied] = useState(false)

  // This ensures the hook runs on every render, even if snippet is null
  const highlightedContent = useSyntaxHighlight(snippet?.code || '', snippet?.language || 'text')

  // ✅ Now it is safe to return early
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
        className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span className="px-3 py-1.5 bg-primary-600/20 text-primary-400 text-sm font-medium rounded-lg flex-shrink-0">
              {snippet.language}
            </span>
            <div className="flex flex-col min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{snippet.title}</h3>
              <span className="text-xs text-slate-400">
                {new Date(snippet.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white flex-shrink-0 ml-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {isCode ? (
            <div className="flex min-h-full">
              {/* Line Numbers */}
              <div className="flex-shrink-0 bg-slate-900 border-r border-slate-800 px-4 py-6 select-none">
                <div className="font-mono text-xs leading-7 text-slate-600 text-right">
                  {snippet.code.split('\n').map((_, index) => (
                    <div key={index} className="h-7">
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Content */}
              <div className="flex-1 px-6 py-6">
                <pre className="font-mono text-sm leading-7 text-slate-200">
                  <code>{highlightedContent}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-base leading-7 text-slate-300">
                  {snippet.code}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-900/50 flex-shrink-0">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 hover:border-red-600 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition-all"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                copied
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
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
