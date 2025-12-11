import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CopyButton from '../CopyButton'
import PropTypes from 'prop-types'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

const LivePreview = ({ code = '', language = 'markdown' }) => {
  // Debounce preview updates to avoid aggressive DOM churn while typing
  const [debouncedCode, setDebouncedCode] = useState(code)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedCode(code), 120)
    return () => clearTimeout(id)
  }, [code])

  // Calculate display code immediately (memoized) to avoid render delay
  const displayCode = React.useMemo(() => {
    return debouncedCode || ''
  }, [debouncedCode])

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          code({ className, children, ...rest }) {
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

LivePreview.propTypes = {
  code: PropTypes.string,
  language: PropTypes.string
}

export default LivePreview
