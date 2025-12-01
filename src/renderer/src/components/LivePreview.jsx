import React from 'react'
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import py from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown'
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml'
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp'
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java'
import php from 'react-syntax-highlighter/dist/esm/languages/hljs/php'
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomOneDark, docco, github} from 'react-syntax-highlighter/dist/esm/styles/hljs'

SyntaxHighlighter.registerLanguage('javascript', js)
SyntaxHighlighter.registerLanguage('python', py)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('xml', xml)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('cpp', cpp)
SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('php', php)

const languageMap = {
  js: 'javascript',
  py: 'python',
  sh: 'bash',
  md: 'markdown',
  txt: 'text',
  text: 'text',
  php: 'php',
  html: 'html',
  css: 'css',
  json: 'json',
  sql: 'sql',
  cpp: 'cpp',
  java: 'java'
}

const LivePreview = ({ code = '', language = 'text' }) => {
  const isDark = document.documentElement.classList.contains('dark')
  const style = github
  const mapped = languageMap[language] || language

  if (language === 'md' || mapped === 'markdown') {
    // Minimal Markdown -> React elements parser (supports headings, paragraphs,
    // fenced code blocks, inline code, bold, and italic). This avoids adding
    // an external dependency and covers the common cases you described.
    const parseInline = (text) => {
      // escape HTML
      const esc = (s) =>
        String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

      // Replace inline code, bold, italic in order and return an array of nodes
      const parts = []
      let rest = text

      const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
      let lastIndex = 0
      let m
      while ((m = pattern.exec(rest))) {
        const idx = m.index
        if (idx > lastIndex) parts.push(esc(rest.slice(lastIndex, idx)))
        const token = m[0]
        if (token.startsWith('`')) {
          parts.push(React.createElement('code', { key: parts.length }, token.slice(1, -1)))
        } else if (token.startsWith('**')) {
          parts.push(React.createElement('strong', { key: parts.length }, token.slice(2, -2)))
        } else if (token.startsWith('*')) {
          parts.push(React.createElement('em', { key: parts.length }, token.slice(1, -1)))
        }
        lastIndex = idx + token.length
      }
      if (lastIndex < rest.length) parts.push(esc(rest.slice(lastIndex)))
      return parts.map((p, i) =>
        typeof p === 'string' ? React.createElement(React.Fragment, { key: i }, p) : p
      )
    }

    const parseMarkdownToElements = (md) => {
      const out = []
      const lines = md.replace(/\r\n/g, '\n').split('\n')
      let i = 0
      while (i < lines.length) {
        const line = lines[i]

        // Fenced code block
        // Fenced code block: render with SyntaxHighlighter for syntax highlighting
        if (line.startsWith('```')) {
          // Extract language from fence, default to 'text' if unknown
          const lang = line.slice(3).trim() || 'text'
          i++
          const codeLines = []
          while (i < lines.length && !lines[i].startsWith('```')) {
            codeLines.push(lines[i])
            i++
          }
          // skip closing fence
          i++
          // Map language to highlight.js supported value
          const mappedLang = languageMap[lang] || 'text'
          // Render code block with syntax highlighting
          out.push(
            React.createElement(
              SyntaxHighlighter,
              {
                key: out.length,
                language: mappedLang,
                style: github,
                customStyle: {
                  fontSize: 16,
                  background: 'transparent',
                  margin: 0
                },
                showLineNumbers: false,
                wrapLongLines: true
              },
              codeLines.join('\n')
            )
          )
          continue
        }

        // Heading
        const hMatch = line.match(/^(#{1,6})\s+(.*)$/)
        if (hMatch) {
          const level = hMatch[1].length
          out.push(React.createElement(`h${level}`, { key: out.length }, parseInline(hMatch[2])))
          i++
          continue
        }

        // Blank line -> skip
        if (!line.trim()) {
          i++
          continue
        }

        // Paragraph (collect until blank line)
        const paraLines = [line]
        i++
        while (i < lines.length && lines[i].trim()) {
          paraLines.push(lines[i])
          i++
        }
        const paraText = paraLines.join(' ')
        out.push(React.createElement('p', { key: out.length }, parseInline(paraText)))
      }
      return out
    }

    const elements = parseMarkdownToElements(code || '')
    return (
      <div
        className="markdown-preview p-3"
        style={{ fontSize: 16, lineHeight: '1.6', color: 'var(--text-main)' }}
      >
        {elements}
      </div>
    )
  }
  // Ensure 'txt' maps to a neutral 'text' language for the highlighter

  return (
    <SyntaxHighlighter
      language={mapped}
      style={style}
      useInlineStyles={false}
      customStyle={{
        fontSize: 16,
        background: 'transparent',
        margin: 0
        // color: 'var(--text-main)'
      }}
      showLineNumbers={true}
      wrapLongLines
    >
      {code}
    </SyntaxHighlighter>
  )
}

export default LivePreview
