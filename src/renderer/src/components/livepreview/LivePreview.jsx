import React, { useState, useEffect, Component } from 'react'
import ReactMarkdown from 'react-markdown'
import { remarkAlert } from 'remark-github-blockquote-alert'
import Admonition from '../admonition/Admonition'

// ... existing imports

// Custom renderer for blockquotes/divs handled by remarkAlert
const BlockquoteRenderer = ({ className, children, ...props }) => {
  if (className?.includes('markdown-alert')) {
    const type = className.replace('markdown-alert markdown-alert-', '')
    const titleMatch = children?.find?.(
      (child) => child?.props?.className === 'markdown-alert-title'
    )
    const title = titleMatch?.props?.children

    // Filter out the title from children to avoid double rendering
    const content = React.Children.toArray(children).filter(
      (child) => child?.props?.className !== 'markdown-alert-title'
    )

    return (
      <Admonition type={type} title={title}>
        {content}
      </Admonition>
    )
  }
  return (
    <blockquote className={className} {...props}>
      {children}
    </blockquote>
  )
}
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

// Lazy load Mermaid to keep preview light
// Lazy load Mermaid to keep preview light
const MermaidDiagram = React.lazy(() => import('../mermaid/MermaidDiagram'))

// Extract CodeBlockRenderer to prevent re-creation on every render
const CodeBlockRenderer = React.memo(({ className, children, node, ...rest }) => {
  const match = /language-(\w+)/.exec(className || '')
  const codeContent = String(children).replace(/\n$/, '')
  const language = match ? match[1] : ''
  const meta = node?.data?.meta || ''

  // Parse title from meta string like: title="my-file.js"
  const titleMatch =
    meta.match(/title="([^"]+)"/) || meta.match(/title='([^']+)'/) || meta.match(/title=([^\s]+)/)
  const title = titleMatch ? titleMatch[1] : null

  // Special handling for Mermaid diagrams
  if (language === 'mermaid') {
    return (
      <React.Suspense fallback={<div className="text-xs opacity-50 p-4">Loading Diagram...</div>}>
        <MermaidDiagram chart={codeContent} />
      </React.Suspense>
    )
  }

  // PERFORMANCE HACK: If the code block is too large, Prism will freeze the UI.
  // We skip highlighting for blocks over 50,000 chars or 2000 lines.
  const isMassive = codeContent.length > 50000 || codeContent.split('\n').length > 2000

  if (match && !isMassive) {
    return (
      <div className="code-block-wrapper">
        <div className="code-block-header">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="code-language text-xs font-bold uppercase opacity-70">{match[1]}</span>
            {title && (
              <span className="text-xs opacity-50 truncate border-l pl-2 border-gray-600">
                {title}
              </span>
            )}
          </div>
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
})

const LivePreview = React.memo(({ code = '', language = 'markdown' }) => {
  // Memoize components object to prevent ReactMarkdown from remounting children
  const components = React.useMemo(
    () => ({
      // Strip event handlers from buttons to prevent React errors
      // eslint-disable-next-line no-unused-vars
      button({ onClick, ...props }) {
        return <button {...props} onClick={undefined} />
      },
      code: CodeBlockRenderer,
      blockquote: BlockquoteRenderer
    }),
    []
  )

  const normalizedLang = (language || 'markdown').toLowerCase()
  const isMarkdown = normalizedLang === 'markdown' || normalizedLang === 'md'
  const isPlainFormat = !isMarkdown

  if (isPlainFormat) {
    return (
      <div className="p-4 bg-transparent h-full overflow-auto">
        <pre
          className="font-mono text-sm outline-none"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: '1.5',
            margin: 0,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
          }}
        >
          {code}
        </pre>
      </div>
    )
  }

  return (
    <div className="markdown-body">
      <PreviewErrorBoundary>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks, remarkAlert]}
          rehypePlugins={[rehypeRaw]}
          components={components}
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
