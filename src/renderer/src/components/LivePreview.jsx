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
import { atomOneDark, docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'

SyntaxHighlighter.registerLanguage('javascript', js)
SyntaxHighlighter.registerLanguage('python', py)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('xml', xml)
SyntaxHighlighter.registerLanguage('html', xml)
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
  txt: 'plaintext',
  php: 'php',
  html: 'html',
  css: 'css',
  json: 'json',
  sql: 'sql',
  cpp: 'cpp',
  java: 'java'
}

const LivePreview = ({ code = '', language = 'txt' }) => {
  const isDark = document.documentElement.classList.contains('dark')
  const style = isDark ? atomOneDark : docco
  const mapped = languageMap[language] || language

  if (language === 'md' || mapped === 'plaintext') {
    return (
      <pre
        className="m-0"
        style={{
          fontSize: 16,
          lineHeight: '1.5',
          color: 'var(--text-main)'
        }}
      >
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <SyntaxHighlighter
      language={mapped}
      style={style}
      customStyle={{
        fontSize: 16,
        background: 'transparent',
        margin: 0,
        color: 'var(--text-main)'
      }}
      showLineNumbers={false}
      wrapLongLines
    >
      {code}
    </SyntaxHighlighter>
  )
}

export default LivePreview
