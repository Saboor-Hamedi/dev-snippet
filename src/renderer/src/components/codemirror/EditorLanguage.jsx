import React from 'react'

// Simple language definitions using only available packages
export const EditorLanguages = {
  // Markup (available)
  markdown: {
    name: 'Markdown',
    extensions: ['md', 'markdown'],
    import: () => import('@codemirror/lang-markdown').then(m => m.markdown()).catch(() => null)
  },
  
  // Web Technologies (basic support)
  javascript: {
    name: 'JavaScript',
    extensions: ['js', 'jsx', 'mjs'],
    import: () => null // Will use basic highlighting from theme
  },
  typescript: {
    name: 'TypeScript', 
    extensions: ['ts', 'tsx'],
    import: () => null
  },
  html: {
    name: 'HTML',
    extensions: ['html', 'htm'],
    import: () => null
  },
  css: {
    name: 'CSS',
    extensions: ['css'],
    import: () => null
  },
  json: {
    name: 'JSON',
    extensions: ['json'],
    import: () => null
  },
  xml: {
    name: 'XML',
    extensions: ['xml', 'svg'],
    import: () => null
  },

  // Programming Languages
  python: {
    name: 'Python',
    extensions: ['py', 'pyw'],
    import: () => null
  },
  java: {
    name: 'Java',
    extensions: ['java'],
    import: () => null
  },
  cpp: {
    name: 'C++',
    extensions: ['cpp', 'cxx', 'cc', 'c'],
    import: () => null
  },
  csharp: {
    name: 'C#',
    extensions: ['cs'],
    import: () => null
  },
  php: {
    name: 'PHP',
    extensions: ['php'],
    import: () => null
  },
  rust: {
    name: 'Rust',
    extensions: ['rs'],
    import: () => null
  },
  go: {
    name: 'Go',
    extensions: ['go'],
    import: () => null
  },

  // Shell & Config
  bash: {
    name: 'Bash',
    extensions: ['sh', 'bash'],
    import: () => null
  },
  powershell: {
    name: 'PowerShell',
    extensions: ['ps1', 'psm1'],
    import: () => null
  },
  yaml: {
    name: 'YAML',
    extensions: ['yml', 'yaml'],
    import: () => null
  },

  // Data & Query
  sql: {
    name: 'SQL',
    extensions: ['sql'],
    import: () => null
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