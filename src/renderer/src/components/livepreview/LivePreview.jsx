import React, { useState, useEffect, Component } from 'react'
import ReactMarkdown from 'react-markdown'
import { remarkAlert } from 'remark-github-blockquote-alert'
import Admonition from '../admonition/Admonition'

// ... existing imports

/**
 * Component for rendering semantic tags (#tag) and mentions (@name).
 */
const Tag = ({ children, type }) => (
  <span className={type === 'mention' ? 'preview-mention' : 'preview-tag'}>{children}</span>
)

/**
 * Component for rendering internal wiki-style links [[Snippet Title]].
 * Dispatches a 'app:open-snippet' event when clicked.
 */
const QuickLink = ({ title }) => {
  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Dispatch custom event to be caught by SnippetLibrary
    window.dispatchEvent(new CustomEvent('app:open-snippet', { detail: { title } }))
  }

  return (
    <span className="preview-quicklink" onClick={handleClick} title={`Jump to ${title}`}>
      {title}
    </span>
  )
}

/**
 * Splits a text string into an array of strings and React components
 * (Tags, Mentions, or QuickLinks) based on regex patterns.
 *
 * @param {string} text - The text to process.
 * @returns {Array|string} - An array containing string parts and React components.
 */
const processTextWithTags = (text) => {
  if (typeof text !== 'string') return text

  // Match #tag, @mention, or [[Snippet Title]]
  // Grouping ensures the split() includes the matching parts in the result array
  const splitRegex = /([#@][a-zA-Z0-9_-]+|\[\[.*?\]\])/g
  const parts = text.split(splitRegex)

  // Exact match patterns for identifying which type a part is
  const tagRegex = /^[#@][a-zA-Z0-9_-]+$/
  const wikiLinkRegex = /^\[\[(.*?)\]\]$/

  return parts.map((part, i) => {
    // Check for Wiki Link [[title]]
    const wikiMatch = part.match(wikiLinkRegex)
    if (wikiMatch) {
      const title = wikiMatch[1]
      return <QuickLink key={i} title={title} />
    }

    // Check for standard #tag or @mention
    if (tagRegex.test(part)) {
      const type = part.startsWith('@') ? 'mention' : 'tag'
      return (
        <Tag key={i} type={type}>
          {part}
        </Tag>
      )
    }
    return part
  })
}

/**
 * Recursively walks down the React component tree to find raw strings
 * and process them for tags/mentions/links. This allows tags to work
 * inside bold, italic, or even nested elements.
 *
 * @param {React.ReactNode} children - The children to walk.
 * @returns {React.ReactNode} - The processed children.
 */
const recursiveProcessTags = (children) => {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return processTextWithTags(child)
    }
    if (React.isValidElement(child) && child.props.children) {
      return React.cloneElement(child, {
        children: recursiveProcessTags(child.props.children)
      })
    }
    return child
  })
}

/**
 * Custom renderer for Paragraphs to support tag highlighting.
 */
const ParagraphRenderer = ({ children }) => {
  return <p>{recursiveProcessTags(children)}</p>
}

/**
 * Custom renderer for List Items to support tag highlighting.
 */
const ListRenderer = ({ children }) => {
  return <li>{recursiveProcessTags(children)}</li>
}

/**
 * Custom renderer for Headers (H1-H6) to support tag highlighting.
 */
const HeadingRenderer = ({ level, children }) => {
  const TagName = `h${level}`
  return <TagName>{recursiveProcessTags(children)}</TagName>
}

/**
 * Custom renderer for Blockquotes.
 * Integrates with remark-github-blockquote-alert for Admonitions.
 */
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
      blockquote: BlockquoteRenderer,
      p: ParagraphRenderer,
      li: ListRenderer,
      h1: (props) => <HeadingRenderer level={1} {...props} />,
      h2: (props) => <HeadingRenderer level={2} {...props} />,
      h3: (props) => <HeadingRenderer level={3} {...props} />,
      h4: (props) => <HeadingRenderer level={4} {...props} />,
      h5: (props) => <HeadingRenderer level={5} {...props} />,
      h6: (props) => <HeadingRenderer level={6} {...props} />
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
