import { File, FileCode, FileText, Calendar } from 'lucide-react'
import { isDateTitle } from './snippetUtils'

/**
 * Maps a language or filename to a Lucide icon and brand color.
 * Designed for sidebar rows to provide instant visual context.
 *
 * @param {string} lang - The identifier for the language (e.g., 'javascript')
 * @param {string} title - The filename or title of the snippet
 * @returns {{icon: React.ComponentType, color: string}}
 */
export const getFileIcon = (lang, title = '') => {
  const safeTitle = typeof title === 'string' ? title : ''
  let cleanTitle = safeTitle.toLowerCase()
  let isMd = false

  if (cleanTitle.endsWith('.md')) {
    const temp = cleanTitle.slice(0, -3)
    if (temp.includes('.')) {
      cleanTitle = temp
    } else {
      isMd = true
    }
  }

  const extension = cleanTitle.split('.').pop() || ''

  // Daily Note Detection (ISO or String dates)
  if (isDateTitle(cleanTitle)) {
    return { icon: Calendar, color: '#818cf8' } // Indigo for journal
  }

  // Language mapping
  const mapping = {
    javascript: { icon: FileCode, color: '#f7df1e' },
    js: { icon: FileCode, color: '#f7df1e' },
    typescript: { icon: FileCode, color: '#007acc' },
    ts: { icon: FileCode, color: '#007acc' },
    react: { icon: FileCode, color: '#61dafb' },
    jsx: { icon: FileCode, color: '#61dafb' },
    tsx: { icon: FileCode, color: '#61dafb' },
    css: { icon: FileCode, color: '#264de4' },
    html: { icon: FileCode, color: '#e34c26' },
    python: { icon: FileCode, color: '#3776ab' },
    py: { icon: FileCode, color: '#3776ab' },
    markdown: { icon: FileText, color: '#519aba' },
    md: { icon: FileText, color: '#519aba' }
  }

  // Check by extension first
  if (mapping[extension]) return mapping[extension]

  // check by lang
  if (mapping[lang]) return mapping[lang]

  // Fallback for markdown
  if (isMd) return mapping['md']

  return { icon: File, color: 'var(--sidebar-icon-color, #8b949e)' }
}
