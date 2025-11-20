import useSyntaxHighlight from '../hook/useSyntaxHighlight'
const SnippetViewModal = ({ snippet, open, onClose, onRequestDelete }) => {
  if (!open || !snippet) return null
  const highlightedContent = useSyntaxHighlight(snippet.code, snippet.language)
  const isCode = snippet.language !== 'text'
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code)
      // Optional: Add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDelete = () => {
    onRequestDelete(snippet.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content snippet-view-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          {/* <h3>{snippet.title}</h3> */}
          <span className="card-language">{snippet.language}</span>
        </div>

        <div className={`content-wrapper ${isCode ? 'code-wrapper' : 'text-wrapper'}`}>
          {highlightedContent}
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="btn-delete default-button" onClick={handleDelete}>
            Delete
          </button>
          <button className="btn-cancel default-button" onClick={onClose}>
            Close
          </button>
          <button className="btn-copy default-button" onClick={handleCopy}>
            Copy Code
          </button>
        </div>
      </div>
    </div>
  )
}

export default SnippetViewModal
