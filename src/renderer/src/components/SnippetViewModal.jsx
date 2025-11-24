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

  // ... return your JSX here

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-5xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-primary-600/20 text-primary-400 text-sm font-medium rounded-lg">
              {snippet.language}
            </span>
            <span className="text-sm text-slate-400">
              {new Date(snippet.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
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
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className={`${isCode ? 'bg-slate-900 rounded-lg' : ''}`}>{highlightedContent}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/50">
          <button onClick={handleDelete} className="btn-danger">
            <svg
              className="w-4 h-4 inline-block mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button
              onClick={handleCopy}
              className={`${copied ? 'bg-green-600 hover:bg-green-700' : 'btn-primary'}`}
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
                  <svg
                    className="w-4 h-4 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
