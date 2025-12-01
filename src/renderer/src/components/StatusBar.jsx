import React from 'react'

const getExtension = (language) => {
  const map = {
    javascript: '.js',
    js: '.js',
    jsx: '.jsx',
    typescript: '.ts',
    ts: '.ts',
    tsx: '.tsx',
    python: '.py',
    py: '.py',
    html: '.html',
    xml: '.xml',
    xhtml: '.xhtml',
    css: '.css',
    json: '.json',
    markdown: '.md',
    md: '.md',
    bash: '.sh',
    sh: '.sh',
    sql: '.sql',
    java: '.java',
    cpp: '.cpp',
    php: '.php',
    text: '.txt',
    txt: '.txt'
  }
  const l = String(language || '').toLowerCase()
  return map[l] || '.txt'
}

const getLanguageName = (language) => {
  const l = String(language || '').toLowerCase()
  const names = {
    javascript: 'JavaScript',
    js: 'JavaScript',
    jsx: 'JSX',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    tsx: 'TSX',
    python: 'Python',
    py: 'Python',
    html: 'HTML',
    xml: 'XML',
    xhtml: 'XHTML',
    css: 'CSS',
    json: 'JSON',
    markdown: 'Markdown',
    md: 'Markdown',
    bash: 'Bash',
    sh: 'Bash',
    sql: 'SQL',
    java: 'Java',
    cpp: 'C++',
    php: 'PHP',
    text: 'Text',
    txt: 'Text'
  }
  return names[l] || (language || '').toString()
}

const StatusBar = ({ language, title }) => {
  // Prefer extension from title if present
  let ext = getExtension(language)
  if (title && /\.[^\.\s]+$/.test(title)) {
    const fileExt = title.split('.').pop().toLowerCase()
    // Map known extensions to canonical
    const extMap = {
      js: '.js', jsx: '.jsx', ts: '.ts', tsx: '.tsx', py: '.py', html: '.html',
      xml: '.xml', xhtml: '.xhtml', css: '.css', json: '.json', md: '.md', markdown: '.md',
      bash: '.sh', sh: '.sh', sql: '.sql', java: '.java', cpp: '.cpp', php: '.php',
      text: '.txt', txt: '.txt'
    }
    ext = extMap[fileExt] || `.${fileExt}`
  }
  const canonical = getLanguageName(language)
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-8 px-3 flex items-center justify-between bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
      style={{ zIndex: 50 }}
    >
      <div className="flex items-center gap-3">
        <span>Ext: {ext}</span>
        <span>Language: {canonical}</span>
      </div>
    </div>
  )
}

export default React.memo(StatusBar)
