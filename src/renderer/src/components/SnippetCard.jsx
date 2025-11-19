import { useState, useRef, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
// ✅ Safe clipboard utility
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
  const codeRef = useRef(null)
  // Optional: Highlight code on mount (if using Prism.js or similar)
  // Language mapping for syntax highlighter
  const languageMap = {
    javascript: 'javascript',
    python: 'python',
    html: 'html',
    css: 'css',
    java: 'java',
    cpp: 'cpp',
    php: 'php',
    ruby: 'ruby',
    other: 'text'
  }

  // end
  const handleCopy = async () => {
    const success = await copyToClipboard(snippet.code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      // Optional: show small toast or alert
      console.error('Failed to copy snippet')
    }
  }

  const handleDelete = () => {
    onRequestDelete(snippet.id)
  }

  return (
    <div className="snippet-card">
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">{snippet.title}</h3>
          <span className="card-language">{snippet.language}</span>
        </div>
        <div className="card-actions">
          <button className={`copy-button ${copied ? 'copied' : ''}`} onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button className="delete-button" onClick={handleDelete} title="Delete snippet">
            Delete
          </button>
        </div>
      </div>

      <div className="code-container">
        {/* <pre className="code-block">{snippet.code}</pre> */}
        <SyntaxHighlighter
          language={languageMap[snippet.language] || 'text'}
          style={tomorrow}
          customStyle={{
            margin: 0,
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
          showLineNumbers={true}
          wrapLongLines={true}
        >
          {snippet.code}
        </SyntaxHighlighter>
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
      </div>
    </div>
  )
}

export default SnippetCard
