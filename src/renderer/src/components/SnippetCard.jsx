// This is my snippets in the workbench
import { useState, useCallback, memo } from 'react'
import PropTypes from 'prop-types'
import useHighlight from '../hook/useHighlight'
import toCapitalized from '../hook/stringUtils'
import { useToast } from '../utils/ToastNotification'
import { Copy, Check, Eye, Trash2, Pencil } from 'lucide-react'
import MarkdownPreview from './MarkdownPreview.jsx'

const copyToClipboard = async (text) => {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
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
const SnippetCard = ({ snippet, onRequestDelete, onEdit, snippets = [], projects = [] }) => {
  const [copied, setCopied] = useState(false)
  const { toast, showToast } = useToast()

  const highlightedContent = useHighlight(snippet.code, snippet.language)
  const isCode = !['text', 'txt'].includes(snippet.language)
  const isMarkdownLike = /^(# |## |### |> |\* |\d+\. )/m.test(snippet.code || '') || /@\w+/.test(snippet.code || '')

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

  const handleEdit = useCallback(
    (e) => {
      e.stopPropagation()
      if (onEdit) {
        onEdit(snippet)
      }
    },
    [onEdit, snippet]
  )

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700
        group transition-all hover:border-primary-500/50 hover:shadow-md
        min-h-[200px] flex flex-col"
    >
      {toast && <div className="toast">{toast}</div>}

      {/* Card Header */}
      <div className="flex items-start justify-between p-3 pb-2">
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mb-1"
            title={snippet.title}
          >
            {snippet.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-500">{formattedTimestamp}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {toCapitalized(snippet.language)}
            </span>
          </div>
        </div>
      </div>

      {/* Code Preview */}
      <div className="flex-1 mb-3 px-3">
        <div
          className={`relative overflow-hidden rounded cursor-pointer transition-all h-full ${
            isCode
              ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
              : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
          }`}
          onClick={handleEdit}
        >
          <div className="max-h-32 overflow-y-hidden p-3">
            {isMarkdownLike ? (
              <MarkdownPreview
                content={snippet.code}
                snippets={[...(snippets || []), ...(projects || [])]}
                language={snippet.language}
                onSnippetClick={(matched) => onEdit && onEdit(matched)}
              />
            ) : isCode ? (
              <pre className="text-xs font-mono leading-5 m-0">
                <code
                  className="hljs block text-slate-600 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: highlightedContent }}
                />
              </pre>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {snippet.code}
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white dark:from-slate-800 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center flex-1 px-2 py-2 rounded text-xs font-medium transition-all ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>

        <button
          onClick={handleEdit}
          className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          title="Edit snippet"
        >
          <Pencil className="w-3 h-3" />
        </button>

        <button
          onClick={handleEdit}
          className="flex items-center justify-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          title="View snippet"
        >
          <Eye className="w-3 h-3" />
        </button>

        <button
          onClick={handleDelete}
          className="flex items-center justify-center p-1.5 hover:bg-red-100 dark:hover:bg-red-600/20 rounded text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          title="Delete snippet"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

SnippetCard.propTypes = {
  snippet: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired
  }).isRequired,
  onRequestDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  snippets: PropTypes.array,
  projects: PropTypes.array
}

export default memo(SnippetCard)
