import React, { useState, useEffect, Component } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CopyButton from '../CopyButton'
import PropTypes from 'prop-types'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'

class PreviewErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Preview Error:', error, errorInfo)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.children !== this.props.children) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-xs text-slate-500">Refreshing preview...</div>
    }
    return this.props.children
  }
}

const LivePreview = React.memo(({ code = '', language = 'markdown' }) => {
  // Optimization: If the snippet is truly massive, we could truncate or simplify further.
  // For now, we focus on making the individual components inside Markdown efficient.

  return (
    <div className="markdown-body">
      <PreviewErrorBoundary>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw]}
          components={{
            // Strip event handlers from buttons to prevent React errors
            // eslint-disable-next-line no-unused-vars
            button({ onClick, ...props }) {
              return <button {...props} onClick={undefined} />
            },
            code({ className, children, ...rest }) {
              const match = /language-(\w+)/.exec(className || '')
              const codeContent = String(children).replace(/\n$/, '')

              // PERFORMANCE HACK: If the code block is too large, Prism will freeze the UI.
              // We skip highlighting for blocks over 50,000 chars or 2000 lines.
              const isMassive = codeContent.length > 50000 || codeContent.split('\n').length > 2000

              if (match && !isMassive) {
                return (
                  <div className="code-block-wrapper">
                    <div className="code-block-header">
                      <span className="code-language">{match[1]}</span>
                      <CopyButton text={codeContent} />
                    </div>
                    <div className="code-block-body ">
                      <SyntaxHighlighter
                        PreTag="div"
                        language={match[1]}
                        style={dark}
                        customStyle={{
                          margin: 0,
                          width: '100%',
                          background: 'transparent',
                          padding: '1.25rem',
                          border: 'none',
                          borderRadius: '0',
                          boxShadow: 'none',
                          textShadow: 'none'
                          // fontSize: '0.85rem'
                        }}
                        wrapLongLines={true}
                        {...rest}
                      >
                        {codeContent}
                      </SyntaxHighlighter>
                    </div>
                    <div className="code-block-footer">
                      <div className="footer-meta">
                        <span>{codeContent.split('\n').length} lines</span>
                        <span className="separator">•</span>
                        <span>{Math.round(new Blob([codeContent]).size / 10.24) / 100} KB</span>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <code
                  {...rest}
                  className={className}
                  style={
                    isMassive
                      ? {
                          whiteSpace: 'pre-wrap',
                          display: 'block',
                          padding: '1em',
                          background: 'var(--color-bg-primary)'
                        }
                      : {}
                  }
                >
                  {children}
                </code>
              )
            }
          }}
        >
          {code}
        </ReactMarkdown>
      </PreviewErrorBoundary>
    </div>
  )
})

LivePreview.propTypes = {
  code: PropTypes.string,
  language: PropTypes.string
}

export default LivePreview
