import { useState, useCallback, memo, useEffect } from 'react'
import SnippetViewModal from './SnippetViewModal'
import useSyntaxHighlight from '../hook/useSyntaxHighlight'
import { useToast } from '../utils/ToastNotification'

const copyToClipboard = async (text) => {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Clipboard API failed, falling back to execCommand:', err)
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  } catch (err) {
    document.body.removeChild(textArea)
    return false
  }
}

const SnippetCard = ({ snippet, onRequestDelete }) => {
  const [copied, setCopied] = useState(false)
  const [isViewModalOpen, setisViewModalOpen] = useState(false)
  const [toast, showToast] = useToast()

  const highlightedContent = useSyntaxHighlight(snippet.code, snippet.language)
  const isCode = snippet.language !== 'text'

  const handleCopy = async () => {
    const success = await copyToClipboard(snippet.code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showToast('✓ Snippet Copied')
    } else {
      showToast('❌ Failed to copy snippet')
    }
  }

  const handleDelete = useCallback(() => {
    onRequestDelete(snippet.id)
  }, [onRequestDelete, snippet.id])

  const openModal = useCallback(() => {
    setisViewModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setisViewModalOpen(false)
  }, [])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        setisViewModalOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  })

  return (
    <div className="snippet-card group animate-fade-in">
      {toast && <div className="toast">{toast}</div>}

      <SnippetViewModal
        open={isViewModalOpen}
        onClose={closeModal}
        snippet={snippet}
        onRequestDelete={onRequestDelete}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-primary-600/20 text-primary-400 text-xs font-medium rounded-md">
            {snippet.language}
          </span>
          <span className="text-xs text-slate-500">
            {new Date(snippet.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* Code Preview */}
      <div
        className={`relative overflow-hidden rounded-lg mb-4 ${isCode ? 'bg-slate-900' : 'bg-slate-800/50'}`}
      >
        <div className="max-h-48 overflow-y-auto">
          <div className={`${isCode ? 'text-sm' : 'text-base'} p-4`}>{highlightedContent}</div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
      </div>

      {/* Card Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <svg
                className="w-4 h-4 inline-block mr-1.5"
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
              Copied
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 inline-block mr-1.5"
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
              Copy
            </>
          )}
        </button>

        <button
          onClick={openModal}
          className="px-3 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white rounded-lg text-sm font-medium transition-all"
        >
          <svg
            className="w-4 h-4 inline-block mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View
        </button>

        <button
          onClick={handleDelete}
          className="px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-sm font-medium transition-all"
        >
          <svg
            className="w-4 h-4 inline-block"
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
        </button>
      </div>
    </div>
  )
}

export default memo(SnippetCard)
