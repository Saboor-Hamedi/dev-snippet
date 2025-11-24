import { useState, useCallback, memo, useEffect } from 'react'
import SnippetViewModal from './SnippetViewModal'
import useSyntaxHighlight from '../hook/useSyntaxHighlight'
import { useToast } from '../utils/ToastNotification'
const copyToClipboard = async (text) => {
  // Try modern Clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Clipboard API failed, falling back to execCommand:', err)
    }
  }

  // Fallback: textarea + execCommand
  const textArea = document.createElement('textarea')
  textArea.value = text
  // Avoid scrolling to bottom
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

  // end
  const handleCopy = async () => {
    const success = await copyToClipboard(snippet.code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showToast('✓ Snippet Copied')
    } else {
      showToast('Failed to copy snippet')
    }
  }
  // Delete snippets
  const handleDelete = useCallback(() => {
    onRequestDelete(snippet.id)
  }, [onRequestDelete, snippet.id])

  // For model
  const openModal = useCallback(() => {
    setisViewModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setisViewModalOpen(false)
  }, [])

  // Close View Model
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
    <section>
      {toast && <div className="toast">{toast}</div>}
      {/* model */}

      <SnippetViewModal
        open={isViewModalOpen}
        onClose={closeModal}
        snippet={snippet}
        onRequestDelete={onRequestDelete}
      />
      {/*  end model */}
      <div className="snippet-card">
        <div className="card-header">
          <div className="card-title-section"></div>
        </div>

        {/* <div className="code-container">
          <pre className="code-block">{snippet.code}</pre>
        </div> */}
        <div className={`content-wrapper ${isCode ? 'code-wrapper' : 'text-wrapper'}`}>
          {highlightedContent}
        </div>

        <div className="card-footer">
          <span className="timestamp">
            {new Date(snippet.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <div className="card-actions">
            <button
              className={`copy-button default-button ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="delete-button default-button" onClick={handleDelete}>
              Delete
            </button>
            <button onClick={openModal} className="default-button">
              View
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(SnippetCard)
