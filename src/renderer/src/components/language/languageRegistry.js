import React from 'react'

// Language definitions with proper syntax highlighting
export const EditorLanguages = {
  // Markup
  markdown: {
    name: 'Markdown',
    extensions: ['md', 'markdown'],
    import: () => import('@codemirror/lang-markdown').then(m => m.markdown()).catch(() => null)
  },
  
  // Web Technologies
  javascript: {
    name: 'JavaScript',
    extensions: ['js', 'jsx', 'mjs'],
    import: () => import('@codemirror/lang-javascript').then(m => m.javascript()).catch(() => null)
  },
  typescript: {
    name: 'TypeScript', 
    extensions: ['ts', 'tsx'],
    import: () => import('@codemirror/lang-javascript').then(m => m.javascript({ typescript: true })).catch(() => null)
  },
  html: {
    name: 'HTML',
    extensions: ['html', 'htm'],
    import: () => import('@codemirror/lang-html').then(m => m.html()).catch(() => null)
  },
  css: {
    name: 'CSS',
    extensions: ['css'],
    import: () => import('@codemirror/lang-css').then(m => m.css()).catch(() => null)
  },
  json: {
    name: 'JSON',
    extensions: ['json'],
    import: () => import('@codemirror/lang-json').then(m => m.json()).catch(() => null)
  },
  xml: {
    name: 'XML',
    extensions: ['xml', 'svg'],
    import: () => import('@codemirror/lang-xml').then(m => m.xml()).catch(() => null)
  },

  // Programming Languages
  python: {
    name: 'Python',
    extensions: ['py', 'pyw'],
    import: () => import('@codemirror/lang-python').then(m => m.python()).catch(() => null)
  },
  java: {
    name: 'Java',
    extensions: ['java'],
    import: () => null // No official package, will use basic highlighting
  },
  cpp: {
    name: 'C++',
    extensions: ['cpp', 'cxx', 'cc', 'c'],
    import: () => null // No official package, will use basic highlighting
  },
  csharp: {
    name: 'C#',
    extensions: ['cs'],
    import: () => null // No official package, will use basic highlighting
  },
  php: {
    name: 'PHP',
    extensions: ['php'],
    import: () => null // No official package, will use basic highlighting
  },
  rust: {
    name: 'Rust',
    extensions: ['rs'],
    import: () => null // No official package, will use basic highlighting
  },
  go: {
    name: 'Go',
    extensions: ['go'],
    import: () => null // No official package, will use basic highlighting
  },

  // Shell & Config
  bash: {
    name: 'Bash',
    extensions: ['sh', 'bash'],
    import: () => null // No official package, will use basic highlighting
  },
  powershell: {
    name: 'PowerShell',
    extensions: ['ps1', 'psm1'],
    import: () => null // No official package, will use basic highlighting
  },
  yaml: {
    name: 'YAML',
    extensions: ['yml', 'yaml'],
    import: () => null // No official package, will use basic highlighting
  },

  // Data & Query
  sql: {
    name: 'SQL',
    extensions: ['sql'],
    import: () => import('@codemirror/lang-sql').then(m => m.sql()).catch(() => null)
  },
  
  // Default
  text: {
    name: 'Plain Text',
    extensions: ['txt'],
    import: () => null
  }
}

// Get language by file extension
export const getLanguageByExtension = (filename) => {
  if (!filename) return 'text'
  
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return 'text'
  
  for (const [langKey, langDef] of Object.entries(EditorLanguages)) {
    if (langDef.extensions.includes(ext)) {
      return langKey
    }
  }
  
  return 'text'
}

// Get language by key with fallback
export const getLanguage = (key) => {
  return EditorLanguages[key] || EditorLanguages.text
}

// Get all available languages for dropdowns
export const getAllLanguages = () => {
  return Object.entries(EditorLanguages).map(([key, lang]) => ({
    key,
    name: lang.name,
    extensions: lang.extensions
  }))
}