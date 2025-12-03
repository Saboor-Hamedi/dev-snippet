
import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const LivePreview = ({ code = '', language = 'javascript' }) => {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [displayCode, setDisplayCode] = useState(code)
  
  // Debounce preview rendering to reduce work while typing
  useEffect(() => {
    // Short debounce (150ms) keeps preview responsive but reduces frequent re-renders
    const t = setTimeout(() => {
      let processedCode = code
      
      // If content already has code blocks, use it as-is
      if (code.includes('```')) {
        setDisplayCode(code)
        return
      }
      
      // Only auto-wrap if content doesn't already have markdown formatting and content exists
      if (code.trim()) {
        // Check if it contains markdown elements (don't auto-wrap if it does)
        const markdownIndicators = [
          /^#{1,6}\s/m,        // Headers (# ## ### etc.)
          /^\*\s/m,            // Bullet lists
          /^\d+\.\s/m,         // Numbered lists
          /^\>\s/m,            // Blockquotes
          /\*\*.*\*\*/,        // Bold text
          /\*.*\*/,            // Italic text
          /\[.*\]\(.*\)/,      // Links
          /!\[.*\]\(.*\)/,     // Images
          /^\-{3,}$/m,         // Horizontal rules
          /^\|.*\|/m,          // Tables
          /`[^`]+`/,           // Inline code
        ]
        
        const hasMarkdown = markdownIndicators.some(pattern => pattern.test(code))
        
        // Only proceed with code detection if no markdown is found
        if (!hasMarkdown) {
          // Detect if it's primarily code (contains common programming patterns)
          const codeIndicators = [
            /^(import|export|const|let|var|function|class|interface|type)\s/m,
            /^(def|class|import|from|if|for|while|try|except|return)\s/m, // Python
            /^(public|private|protected|static|void|int|string|bool)\s/m, // Java/C#
            /^\s*#include/m,     // C/C++
            /\{[\s\S]*\}/,       // Code blocks with braces
            /\(\s*\)\s*=>/,      // Arrow functions
            /;\s*$/m,            // Statements ending with semicolon
            /<\/[^>]+>/,         // Closing HTML/XML tags
          ]
          
          const looksLikeCode = codeIndicators.some(pattern => pattern.test(code))
          
          if (looksLikeCode) {
            // Auto-wrap with code block using the detected/provided language
            processedCode = `\`\`\`${language}\n${code}\n\`\`\``
          }
        }
      }
      
      setDisplayCode(processedCode)
    }, 150)
    return () => clearTimeout(t)
  }, [code, language])

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
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
