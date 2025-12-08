import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CopyButton from '../CopyButton'
import detectLanguage from './detectLanguage.js'

const LivePreview = ({ code = '', language = 'javascript' }) => {
  const [copiedIndex, setCopiedIndex] = useState(null)
  
  // Detect language from content
  const detectedLanguage = React.useMemo(() => detectLanguage(code), [code])
  
  // Calculate display code immediately (memoized) to avoid render delay
  const displayCode = React.useMemo(() => {
    let processedCode = code

    // If content already has code blocks, use it as-is
    if (code.includes('```')) {
      return code
    }

    // Only auto-wrap if content doesn't already have markdown formatting and content exists
    if (code.trim()) {
      // Check if it contains markdown elements (don't auto-wrap if it does)
      const markdownIndicators = [
        /^#{1,6}\s/m, // Headers (# ## ### etc.)
        /^\*\s/m, // Bullet lists
        /^\d+\.\s/m, // Numbered lists
        /^\>\s/m, // Blockquotes
        /\*\*.*\*\*/, // Bold text
        /\*.*\*/, // Italic text
        /\[.*\]\(.*\)/, // Links
        /!\[.*\]\(.*\)/, // Images
        /^\-{3,}$/m, // Horizontal rules
        /^\|.*\|/m, // Tables
        /`[^`]+`/ // Inline code
      ]

      const hasMarkdown = markdownIndicators.some((pattern) => pattern.test(code))

      // Only proceed with code detection if no markdown is found
      if (!hasMarkdown) {
        // Detect if it's primarily code (contains common programming patterns)
        const codeIndicators = [
          /^(import|export|const|let|var|function|class|interface|type)\s/m,
          /^(def|class|import|from|try|except)\s/m, // Python
          /^(public|private|protected|static|void|int|string|bool)\s/m, // Java/C#
          /^\s*#include/m, // C/C++
          /\{[\s\S]*\}/, // Code blocks with braces
          /\(\s*\)\s*=>/, // Arrow functions
          /;\s*$/m, // Statements ending with semicolon
          /<\/[^>]+>/ // Closing HTML/XML tags
        ]

        const looksLikeCode = codeIndicators.some((pattern) => pattern.test(code))

        if (looksLikeCode) {
          // Auto-wrap with code block using the detected language
          processedCode = `\`\`\`${detectedLanguage}\n${code}\n\`\`\``
        }
      }
    }

    return processedCode
  }, [code, detectedLanguage])

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {}
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
                  <CopyButton text={String(children).replace(/\n$/, '')} />
                </div>
                <SyntaxHighlighter
                  PreTag="div"
                  language={match[1]}
                  style={dark}
                  customStyle={{
                    margin: 0,
                    width: '100%',
                    background: 'var(--color-bg-primary)',
                    borderTop: 'none',
                    borderTopLeftRadius: '0',
                    borderTopRightRadius: '0',
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
