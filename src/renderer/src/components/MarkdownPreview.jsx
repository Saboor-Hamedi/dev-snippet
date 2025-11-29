import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/light'
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml'
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css'
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco'
import atomOneDark from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark'

// Register only core languages for light build
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('xml', xml)
SyntaxHighlighter.registerLanguage('html', xml) // alias
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('bash', bash)

const normalizeLang = (lang) => {
  const l = (lang || '').toLowerCase()
  const map = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'javascript',
    tsx: 'javascript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    html: 'html',
    xml: 'xml',
    css: 'css',
    sql: 'sql',
    bash: 'bash',
    javascript: 'javascript',
    python: 'python'
  }
  return map[l] || l
}

const MarkdownPreview = ({ content, onSnippetClick, snippets = [], language }) => {
  const isDark = document.documentElement.classList.contains('dark')
  const style = isDark ? atomOneDark : docco

  return (
    <div className="p-4 preview-content" style={{ userSelect: 'text' }}>
      <div
        className="prose prose-slate dark:prose-invert max-w-none preview-content"
        style={{ userSelect: 'text' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, children, ...props }) => (
              <h1 className="font-bold text-2xl mb-3" {...props}>
                {renderWithTagsAndMentions(children, snippets, onSnippetClick, language)}
              </h1>
            ),
            h2: ({ node, children, ...props }) => (
              <h2 className="font-bold text-xl mb-2" {...props}>
                {renderWithTagsAndMentions(children, snippets, onSnippetClick, language)}
              </h2>
            ),
            h3: ({ node, children, ...props }) => (
              <h3 className="font-bold text-lg mb-2" {...props}>
                {renderWithTagsAndMentions(children, snippets, onSnippetClick, language)}
              </h3>
            ),
            a: ({ node, href, children, ...props }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:underline"
                {...props}
              >
                {children}
              </a>
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 pl-4 text-slate-500 dark:text-slate-400"
                {...props}
              />
            ),
            p: ({ children, ...props }) => (
              <p {...props}>
                {renderWithTagsAndMentions(children, snippets, onSnippetClick, language)}
              </p>
            ),
            li: ({ children, ...props }) => (
              <li {...props}>
                {renderWithTagsAndMentions(children, snippets, onSnippetClick, language)}
              </li>
            ),
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const lang = normalizeLang(match?.[1])
              if (!inline && lang) {
                return (
                  <CodeBlock
                    language={lang}
                    code={String(children).replace(/\n$/, '')}
                    style={style}
                  />
                )
              }
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#161b22] text-pink-600 dark:text-pink-400"
                  {...props}
                >
                  {children}
                </code>
              )
            }
          }}
        >
          {content || ''}
        </ReactMarkdown>
      </div>
    </div>
  )
}

const renderWithTagsAndMentions = (children, snippets, onSnippetClick, language) => {
  const getExt = (lang) => {
    const m = {
      javascript: '.js',
      js: '.js',
      jsx: '.js',
      python: '.py',
      py: '.py',
      html: '.html',
      xml: '.xml',
      css: '.css',
      sql: '.sql',
      bash: '.sh',
      sh: '.sh',
      java: '.java',
      cpp: '.cpp',
      markdown: '.md',
      md: '.md'
    }
    return m[(lang || '').toLowerCase()] || ''
  }
  const renderText = (text, keyBase) => {
    const parts = String(text || '').split(/(#[a-zA-Z0-9_.-]+|@[a-zA-Z0-9_.-]+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span
            key={`${keyBase}-t-${i}`}
            className="inline-block px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-[#1e3a8a] dark:text-sky-200 text-xs mr-1 align-middle"
          >
            {part}
          </span>
        )
      }
      if (part.startsWith('@')) {
        const snippetName = part.slice(1).toLowerCase()
        const matchedSnippet = (snippets || []).find((s) => {
          const title = (s.title || '').toLowerCase()
          const hyph = title.replace(/\s+/g, '-')
          const fname = title.includes('.') ? title : `${title}${getExt(s.language)}`
          return snippetName === hyph || snippetName === title || snippetName === fname
        })
        if (matchedSnippet && onSnippetClick) {
          return (
            <button
              key={`${keyBase}-m-${i}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSnippetClick(matchedSnippet)
              }}
              className="mention-pill inline-block px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-xs mr-1 align-middle hover:bg-primary-200 dark:hover:bg-primary-900/50 cursor-pointer transition-colors border border-primary-300 dark:border-primary-700 hover:underline"
              style={{ pointerEvents: 'auto' }}
              title={`Open snippet: ${matchedSnippet.title}`}
            >
              {part}
            </button>
          )
        }
        return (
          <span
            key={`${keyBase}-m-${i}`}
            className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs mr-1 align-middle opacity-50"
            title="Snippet not found"
          >
            {part}
          </span>
        )
      }
      return <span key={`${keyBase}-s-${i}`}>{part}</span>
    })
  }

  if (Array.isArray(children)) {
    return children.flatMap((child, idx) =>
      typeof child === 'string' ? renderText(child, `c-${idx}`) : child
    )
  }
  return renderText(children, 'c-0')
}

const CodeBlock = ({ language, code, style }) => {
  const [copied, setCopied] = React.useState(false)
  const badge = (() => {
    const m = {
      javascript: 'JS',
      python: 'PY',
      html: 'HTML',
      xml: 'XML',
      css: 'CSS',
      sql: 'SQL',
      bash: 'SH',
      java: 'JAVA',
      cpp: 'CPP',
      markdown: 'MD'
    }
    return m[String(language || '').toLowerCase()] || (language || '').toString().toUpperCase()
  })()
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <div className="relative group" style={{ userSelect: 'text' }}>
      <span
        className="absolute top-2 left-2 px-2 py-1 text-[10px] rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
        title={language}
      >
        {badge}
      </span>
      <button
        onClick={onCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 opacity-60 hover:opacity-100"
        title="Copy code"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <SyntaxHighlighter
        PreTag="div"
        language={language}
        style={style}
        customStyle={{ margin: 0, borderRadius: 6, userSelect: 'text' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default React.memo(MarkdownPreview)
