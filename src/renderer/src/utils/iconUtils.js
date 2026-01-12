import {
  File,
  FileCode,
  FileText,
  Calendar,
  Database,
  Code,
  Image as ImageIcon,
  Package,
  Book,
  FlaskConical,
  Layout,
  Terminal,
  Settings,
  Globe,
  Folder,
  FolderOpen,
  FileJson,
  FileCog,
  Lock,
  GitBranch,
  Server,
  Wrench,
  Palette,
  Braces,
  Zap,
  Shield,
  Cloud,
  CheckSquare,
  Scale,
  Clock,
  AlertCircle
} from 'lucide-react'
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

  // Handle .md extension stripping to find "inner" extensions (e.g. script.js.md)
  if (cleanTitle.endsWith('.md')) {
    const temp = cleanTitle.slice(0, -3)
    // If it has another dot (script.js), we treat it as that extension.
    // If not (notes.md), we flag it as a Markdown file but keep checking semantics.
    if (temp.includes('.')) {
      cleanTitle = temp
    } else {
      isMd = true
    }
  }

  const extension = cleanTitle.split('.').pop() || ''
  const baseName =
    cleanTitle
      .split('/')
      .pop()
      ?.replace(/\.[^/.]+$/, '') || cleanTitle

  // 1. Daily Note (Highest Priority)
  if (isDateTitle(cleanTitle)) {
    return { icon: Calendar, color: '#818cf8' }
  }

  // 2. Exact Filename / Extension Matches (System Files)
  if (cleanTitle === '.env' || cleanTitle.startsWith('.env.')) {
    return { icon: Lock, color: '#eab308' }
  }
  if (cleanTitle === '.gitignore') {
    return { icon: GitBranch, color: '#f05032' }
  }
  if (cleanTitle === 'dockerfile') {
    return { icon: FileCog, color: '#2496ed' }
  }
  if (cleanTitle === 'package.json') {
    return { icon: FileJson, color: '#cb3837' }
  }
  if (cleanTitle === 'settings.json') {
    return { icon: Settings, color: '#90a4ae' }
  }

  // Define Language/Extension Mapping
  const mapping = {
    // Web
    javascript: { icon: FileCode, color: '#f7df1e' },
    js: { icon: FileCode, color: '#f7df1e' },
    typescript: { icon: FileCode, color: '#007acc' },
    ts: { icon: FileCode, color: '#007acc' },
    react: { icon: FileCode, color: '#61dafb' },
    jsx: { icon: FileCode, color: '#61dafb' },
    tsx: { icon: FileCode, color: '#61dafb' },
    css: { icon: FileCode, color: '#264de4' },
    scss: { icon: FileCode, color: '#c6538c' },
    less: { icon: FileCode, color: '#1d365d' },
    html: { icon: FileCode, color: '#e34c26' },

    // Backend / Data
    python: { icon: FileCode, color: '#3776ab' },
    py: { icon: FileCode, color: '#3776ab' },
    sql: { icon: Database, color: '#00bc70' },
    json: { icon: FileJson, color: '#fbc02d' },
    xml: { icon: FileCode, color: '#e37c00' },
    yaml: { icon: FileCog, color: '#cb171e' },
    yml: { icon: FileCog, color: '#cb171e' },
    csv: { icon: Database, color: '#81c784' },

    // Scripts / Config
    bash: { icon: Terminal, color: '#4caf50' },
    sh: { icon: Terminal, color: '#4caf50' },
    zsh: { icon: Terminal, color: '#4caf50' },
    conf: { icon: Settings, color: '#90a4ae' },
    config: { icon: Settings, color: '#90a4ae' },

    // Docs (Note: 'markdown' is handled with lower priority if semantics match)
    markdown: { icon: FileText, color: '#519aba' },
    md: { icon: FileText, color: '#519aba' },
    txt: { icon: FileText, color: '#90a4ae' }
  }

  // 3. Language Priority (Crucial for snippets!)
  // If the user explicitly set a language (other than basic markdown), obey it.
  // if (lang && mapping[lang] && lang !== 'markdown') {
  //   return mapping[lang]
  // }

  if (lang && mapping[lang]) {
    return mapping[lang]
  }
  // 4. Semantic Title Matching (Heuristics for .md files)
  const lowerBase = baseName.toLowerCase()

  if (lowerBase.includes('readme')) return { icon: Book, color: '#4fc3f7' }
  if (lowerBase.includes('changelog')) return { icon: Clock, color: '#ffecb3' }
  if (lowerBase.includes('license')) return { icon: Scale, color: '#f48fb1' }
  if (lowerBase.includes('todo')) return { icon: CheckSquare, color: '#a5d6a7' }
  if (lowerBase.includes('bug')) return { icon: AlertCircle, color: '#ef5350' }

  if (lowerBase.includes('test') || lowerBase.includes('spec')) {
    return { icon: FlaskConical, color: '#ffa726' }
  }
  if (lowerBase.includes('schema') || lowerBase.includes('query')) {
    return { icon: Database, color: '#ffca28' }
  }
  if (lowerBase.includes('config') || lowerBase.includes('setting')) {
    return { icon: Settings, color: '#90a4ae' }
  }
  if (lowerBase.includes('api') || lowerBase.includes('endpoint')) {
    return { icon: Cloud, color: '#03a9f4' }
  }

  // 5. Extension Fallback
  if (mapping[extension]) return mapping[extension]
  if (mapping[lang]) return mapping[lang]

  // Generic Code file
  if (['c', 'cpp', 'java', 'go', 'rs', 'php', 'rb'].includes(extension)) {
    return { icon: FileCode, color: '#90a4ae' }
  }

  // Default
  return { icon: File, color: 'var(--sidebar-icon-color, #8b949e)' }
}

/**
 * Maps a folder name to a specialized Lucide icon and color.
 *
 * @param {string} name - The name of the folder
 * @param {boolean} isOpen - Whether the folder is expanded
 * @returns {{icon: React.ComponentType, color: string}}
 */
export const getFolderIcon = (name, isOpen) => {
  const lowerName = (name || '').toLowerCase().trim()

  const mapping = {
    // Database / SQL
    db: { icon: Database, color: '#ffca28' },
    database: { icon: Database, color: '#ffca28' },
    sql: { icon: Database, color: '#ffca28' },
    data: { icon: Database, color: '#ffca28' },
    queries: { icon: Database, color: '#ffca28' },
    query: { icon: Database, color: '#ffca28' },
    schema: { icon: Database, color: '#ffca28' },
    schemas: { icon: Database, color: '#ffca28' },

    // Backend / API
    api: { icon: Cloud, color: '#03a9f4' },
    server: { icon: Server, color: '#3f51b5' },
    backend: { icon: Server, color: '#3f51b5' },
    functions: { icon: Braces, color: '#ab47bc' },

    // Auth / Security
    auth: { icon: Shield, color: '#4caf50' },
    security: { icon: Shield, color: '#4caf50' },

    // Code / Src
    src: { icon: Code, color: '#42a5f5' },
    source: { icon: Code, color: '#42a5f5' },
    code: { icon: Code, color: '#42a5f5' },
    lib: { icon: Code, color: '#ab47bc' },

    // Logic / Utils
    utils: { icon: Wrench, color: '#7e57c2' },
    helpers: { icon: Wrench, color: '#7e57c2' },
    hooks: { icon: Zap, color: '#ff7043' },
    services: { icon: Zap, color: '#ff7043' },

    // Assets / Styles
    assets: { icon: ImageIcon, color: '#66bb6a' },
    images: { icon: ImageIcon, color: '#66bb6a' },
    img: { icon: ImageIcon, color: '#66bb6a' },
    icons: { icon: ImageIcon, color: '#66bb6a' },
    styles: { icon: Palette, color: '#ec407a' },
    theme: { icon: Palette, color: '#ec407a' },

    // Types
    types: { icon: Braces, color: '#0288d1' },
    interfaces: { icon: Braces, color: '#0288d1' },

    // Build / Dist
    dist: { icon: Package, color: '#ef5350' },
    build: { icon: Package, color: '#ef5350' },
    packages: { icon: Package, color: '#ef5350' },
    node_modules: { icon: Package, color: '#7cb342' },

    // Docs
    docs: { icon: Book, color: '#26c6da' },
    documentation: { icon: Book, color: '#26c6da' },
    notes: { icon: Book, color: '#ff7043' },

    // Tests
    test: { icon: FlaskConical, color: '#ffa726' },
    tests: { icon: FlaskConical, color: '#ffa726' },
    spec: { icon: FlaskConical, color: '#ffa726' },

    // Config / Layout / System
    config: { icon: Settings, color: '#90a4ae' },
    settings: { icon: Settings, color: '#90a4ae' },
    layouts: { icon: Layout, color: '#ec407a' },
    components: { icon: Layout, color: '#ec407a' },
    public: { icon: Globe, color: '#8d6e63' },
    scripts: { icon: Terminal, color: '#78909c' }
  }

  if (mapping[lowerName]) {
    return mapping[lowerName]
  }

  // Default Folder
  return {
    icon: isOpen ? FolderOpen : Folder,
    color: isOpen
      ? 'var(--color-text-primary)'
      : 'var(--sidebar-icon-color, var(--color-text-secondary))'
  }
}
