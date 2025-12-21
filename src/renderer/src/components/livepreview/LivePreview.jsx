import React, { useState, useEffect, Component, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import CopyButton from '../CopyButton'
import PropTypes from 'prop-types'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'

/**
 * Component for rendering semantic tags (#tag) and mentions (@name).
 */
const Tag = ({ children, type }) => (
  <span className={type === 'mention' ? 'preview-mention' : 'preview-tag'}>{children}</span>
)

/**
 * Component for rendering internal wiki-style links [[Snippet Title]].
 * Dispatches a 'app:open-snippet' event when clicked.
 * Indicates 'ghost' status if the snippet doesn't exist.
 */
const QuickLink = ({ title, exists = true }) => {
  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Dispatch custom event to be caught by SnippetLibrary
    window.dispatchEvent(new CustomEvent('app:open-snippet', { detail: { title } }))
  }

  return (
    <span
      className={`preview-quicklink ${!exists ? 'is-ghost' : ''}`}
      onClick={handleClick}
      title={exists ? `Jump to ${title}` : `Snippet "${title}" not created yet (Click to create)`}
    >
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
const processTextWithTags = (text, existingTitles = []) => {
  if (typeof text !== 'string') return text

  // Match #tag, @mention, or [[Snippet Title]]
  // Grouping ensures the split() includes the matching parts in the result array
  const splitRegex = /([#@][a-zA-Z0-9_-]+|\[\[.*?\]\])/g
  const parts = text.split(splitRegex)

  // Exact match patterns for identifying which type a part is
  const tagRegex = /^[#@][a-zA-Z0-9_-]+$/
  const wikiLinkRegex = /^\[\[(.*?)\]\]$/

  return parts.filter(Boolean).map((part, i) => {
    // Check for Wiki Link [[title]]
    const wikiMatch = part.match(wikiLinkRegex)
    if (wikiMatch) {
      const title = wikiMatch[1]
      const exists = existingTitles.some((t) => t.toLowerCase() === title.toLowerCase().trim())
      return <QuickLink key={`wiki-${i}`} title={title} exists={exists} />
    }

    // Check for standard #tag or @mention
    if (tagRegex.test(part)) {
      const type = part.startsWith('@') ? 'mention' : 'tag'
      return (
        <Tag key={`tag-${i}`} type={type}>
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
const recursiveProcessTags = (children, existingTitles = [], depth = 0) => {
  // Safety: Prevent excessive recursion depth which can freeze the UI on malformed inputs
  if (depth > 5) return children

  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return processTextWithTags(child, existingTitles)
    }
    if (React.isValidElement(child) && child.props.children) {
      return React.cloneElement(child, {
        children: recursiveProcessTags(child.props.children, existingTitles, depth + 1)
      })
    }
    return child
  })
}

/**
 * Global prop sanitizer to prevent hazardous raw HTML attributes from crashing React.
 * Blocks string-based event handlers and React-specific metadata.
 */
const sanitizeProps = (allProps) => {
  if (!allProps) return {}
  const { node, existingTitles, isContentMatch, ...props } = allProps
  const safe = {}
  Object.keys(props).forEach((k) => {
    // 1. Block event handlers that are strings (from raw HTML)
    if (k.startsWith('on') && typeof props[k] === 'string') return
    // 2. Block React special props and internal metadata
    if (k === 'key' || k === 'ref') return
    // 3. Block JSX-style spread names that are interpreted as literal attributes (e.g. {...props})
    if (k.includes('{') || k.includes('}') || k.includes('.')) return
    safe[k] = props[k]
  })
  return safe
}

/**
 * Custom renderer for Paragraphs to support tag highlighting.
 */
const ParagraphRenderer = ({ children, existingTitles, ...props }) => {
  const safeProps = sanitizeProps(props)
  return <p {...safeProps}>{recursiveProcessTags(children, existingTitles)}</p>
}

/**
 * Custom renderer for List Items to support tag highlighting.
 */
const ListRenderer = ({ children, existingTitles, ...props }) => {
  const safeProps = sanitizeProps(props)
  return <li {...safeProps}>{recursiveProcessTags(children, existingTitles)}</li>
}

/**
 * Custom renderer for Headers (H1-H6) to support tag highlighting.
 */
const HeadingRenderer = ({ level, children, existingTitles, ...props }) => {
  const TagName = `h${level}`
  const safeProps = sanitizeProps(props)
  return <TagName {...safeProps}>{recursiveProcessTags(children, existingTitles)}</TagName>
}

/**
 * Custom renderer for Blockquotes.
 */
const BlockquoteRenderer = ({ className, children, node, ...props }) => {
  const safeProps = sanitizeProps(props)
  return (
    <blockquote className={className} {...safeProps}>
      {children}
    </blockquote>
  )
}

/**
 * Common HTML element renderers sanitized to prevent string-based event handlers
 * from crashing React when processing raw HTML.
 */
const SafeDiv = (allProps) => {
  const props = sanitizeProps(allProps)
  return <div {...props} />
}

const SafeSpan = (allProps) => {
  const props = sanitizeProps(allProps)
  return <span {...props} />
}

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
  // We skip highlighting for blocks over 500,000 chars or 2000 lines.
  const isMassive = codeContent.length > 500000 || codeContent.split('\n').length > 2000

  if (match && !isMassive) {
    // eslint-disable-next-line no-unused-vars
    const { key: _key, onMouseDown, ...safeRest } = rest
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
            {...safeRest}
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

  // eslint-disable-next-line no-unused-vars
  const { key: _key, onMouseDown, ...safeRest } = rest
  return (
    <code
      {...safeRest}
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

const LivePreview = React.memo(({ code = '', language = 'markdown', snippets = [] }) => {
  // Extract titles for ghost link validation
  const existingTitles = useMemo(() => {
    return snippets.map((s) => (s.title || '').trim()).filter(Boolean)
  }, [snippets])

  // Memoize components object to prevent ReactMarkdown from remounting children
  const components = useMemo(
    () => ({
      // Strip event handlers from buttons to prevent React errors
      button(props) {
        const safeProps = sanitizeProps(props)
        return <button {...safeProps} />
      },
      code: CodeBlockRenderer,
      blockquote: BlockquoteRenderer,
      div: SafeDiv,
      span: SafeSpan,
      p: (props) => <ParagraphRenderer {...props} existingTitles={existingTitles} />,
      li: (props) => <ListRenderer {...props} existingTitles={existingTitles} />,
      h1: (props) => <HeadingRenderer level={1} {...props} existingTitles={existingTitles} />,
      h2: (props) => <HeadingRenderer level={2} {...props} existingTitles={existingTitles} />,
      h3: (props) => <HeadingRenderer level={3} {...props} existingTitles={existingTitles} />,
      h4: (props) => <HeadingRenderer level={4} {...props} existingTitles={existingTitles} />,
      h5: (props) => <HeadingRenderer level={5} {...props} existingTitles={existingTitles} />,
      h6: (props) => <HeadingRenderer level={6} {...props} existingTitles={existingTitles} />,
      // Silence unrecognized tag warnings from project-internal code pastes
      copybutton: () => null,
      mermaiddiagram: () => null,
      previewerrorboundary: ({ children }) => <>{children}</>,
      prompt: () => null,
      snippeteditor: () => null,
      workbench: () => null,
      commandpalette: () => null,
      statusbar: () => null,
      info: () => null,
      fileedit: () => null,
      trash2: () => null,
      alertcircle: () => null,
      safediv: () => null,
      safespan: () => null,
      customicon: () => null,
      select: (props) => {
        const safeProps = sanitizeProps(props)
        return <select {...safeProps} />
      },
      option: (allProps) => {
        // eslint-disable-next-line no-unused-vars
        const { selected, ...props } = allProps
        const safeProps = sanitizeProps(props)
        return <option {...safeProps} />
      }
    }),
    [existingTitles]
  )
  const normalizedLang = (language || 'markdown').toLowerCase()
  const isMarkdown = normalizedLang === 'markdown' || normalizedLang === 'md'
  const isPlainFormat = !isMarkdown

  // PERFORMANCE SAFETY: rehype-raw is powerful but can hang the entire app if the input has
  // thousands of unclosed tags (common when pasting JSX or large complex code).
  // We disable it for very large snippets to ensure the app stays responsive.
  const RAW_HTML_LIMIT = 500000
  const isOverRawLimit = code.length > RAW_HTML_LIMIT
  const safeRehypePlugins = useMemo(() => {
    return isOverRawLimit ? [] : [rehypeRaw]
  }, [isOverRawLimit])

  useEffect(() => {
    if (isOverRawLimit) {
      console.warn(
        `[LivePreview] Large content detected (${code.length} chars). Disabling raw HTML support for performance safety.`
      )
    }
  }, [isOverRawLimit, code.length])

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
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={safeRehypePlugins}
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
