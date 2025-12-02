
import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const LivePreview = ({ code = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [displayCode, setDisplayCode] = useState(code)
  // Debounce preview rendering to reduce work while typing
  useEffect(() => {
    // Short debounce (150ms) keeps preview responsive but reduces frequent re-renders
    const t = setTimeout(() => setDisplayCode(code), 150)
    return () => clearTimeout(t)
  }, [code])

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="markdown-body">
      <ReactMarkdown
        components={{
          code({ className, children, inline, ...rest }) {
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <div className="code-block-wrapper">
                <div className="code-block-header">
                  <span className="code-language">Code • {match[1]}</span>
                  <button
                    className={`copy-code-btn ${copiedIndex === className ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), className)}
                    title="Copy code"
                  >
                      {copiedIndex === className ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  PreTag="div"
                  language={match[1]}
                  style={dark}
                  customStyle={{
                    margin: 0,
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '5px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                  wrapLongLines={true}
                  {...rest}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            )
          }
        }}
      >
        {displayCode}
      </ReactMarkdown>
    </div>
  )
}

export default LivePreview
