// This is my snippets in the workbench
import { useState, useCallback, memo, useEffect } from 'react'
import SnippetViewModal from './SnippetViewModal'
import useSyntaxHighlight from '../hook/useSyntaxHighlight'
import { useToast } from '../utils/ToastNotification'
import { Copy, Check, Eye, Trash2 } from 'lucide-react'

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
  const { toast, showToast } = useToast()

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

  const formattedTimestamp = new Date(snippet.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

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
    <div
      className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700/70 
        group animate-fade-in transition-all hover:border-primary-500/50 hover:shadow-xl
        min-h-[280px] flex flex-col"
    >
      {toast && <div className="toast">{toast}</div>}

      <SnippetViewModal
        open={isViewModalOpen}
        onClose={closeModal}
        snippet={snippet}
        onRequestDelete={onRequestDelete}
      />

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-lg font-semibold text-white truncate mb-2" title={snippet.title}>
            {snippet.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary-600/20 text-primary-400 text-sm font-medium rounded-full border border-primary-500/30">
              {snippet.language}
            </span>
            <span className="text-sm text-slate-400">{formattedTimestamp}</span>
          </div>
        </div>
      </div>

      {/* Code Preview - Expanded */}
      <div className="flex-1 mb-5">
        <div
          className={`relative overflow-hidden rounded-lg cursor-pointer transition-all hover:shadow-xl h-full ${
            isCode
              ? 'bg-slate-900 border border-slate-700/50'
              : 'bg-slate-800/50 border border-slate-700/30'
          }`}
          onClick={openModal}
        >
          <div className="max-h-52 overflow-y-hidden">
            <div className={`${isCode ? 'text-sm font-mono' : 'text-base'} p-4 text-slate-300`}>
              {highlightedContent}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Card Actions - Improved */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium transition-all ${
            copied
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white hover:shadow-lg'
          }`}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>

        <button
          onClick={openModal}
          className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 text-slate-300 
      hover:bg-slate-600 hover:text-white rounded-lg sm:rounded-xl text-sm font-medium 
      transition-all hover:shadow-lg"
          title="View snippet"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          onClick={handleDelete}
          className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-3 bg-red-600/20 text-red-400 
      hover:bg-red-600 hover:text-white rounded-lg sm:rounded-xl text-sm font-medium 
      transition-all hover:shadow-lg"
          title="Delete snippet"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default memo(SnippetCard)
