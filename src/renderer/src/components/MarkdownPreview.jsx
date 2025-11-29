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

const MarkdownPreview = ({ content }) => {
  const isDark = document.documentElement.classList.contains('dark')
  const style = isDark ? atomOneDark : docco

  return (
    <div className="p-4">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => <h1 className="font-bold text-2xl mb-3" {...props} />,
            h2: ({ node, ...props }) => <h2 className="font-bold text-xl mb-2" {...props} />,
            h3: ({ node, ...props }) => <h3 className="font-bold text-lg mb-2" {...props} />,
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
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const lang = normalizeLang(match?.[1])
              if (!inline && lang) {
                return (
                  <SyntaxHighlighter
                    PreTag="div"
                    language={lang}
                    style={style}
                    customStyle={{ margin: 0, borderRadius: 6 }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
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

export default MarkdownPreview
