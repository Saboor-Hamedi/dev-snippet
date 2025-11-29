import React from 'react'
import PropTypes from 'prop-types'
import {
  Search,
  Trash2,
  Pencil,
  Plus,
  FileCode,
  FileText,
  Briefcase,
  Globe,
  CodeXml
} from 'lucide-react'
import SidebarHeader, { EmptyState } from './SidebarHeader'

const Explorer = ({
  activeView,
  items,
  searchTerm,
  setSearchTerm,
  selectedSnippet,
  onSelect,
  onDeleteRequest,
  onCreateProject,
  onCreateSnippet,
  onRenameRequest
}) => {
  // Helper function to filter items based on search term
  const getFileIcon = (item) => {
    if (item.type === 'project')
      return <Briefcase size={14} className="text-slate-600 dark:text-slate-300" />
    const title = String(item.title || '')
    const ext = title.includes('.') ? title.split('.').pop().toLowerCase() : ''
    const lang = (item.language || '').toLowerCase()
    const pick = ext || lang
    switch (pick) {
      case 'js':
      case 'jsx':
        return <FileCode size={14} className="text-yellow-500" />
      case 'ts':
      case 'tsx':
        return <FileCode size={14} className="text-blue-500" />
      case 'py':
        return <FileCode size={14} className="text-blue-600" />
      case 'php':
        return <FileCode size={14} className="text-violet-600" />
      case 'html':
        return <Globe size={14} className="text-orange-500" />
      case 'css':
        return <CodeXml size={14} className="text-teal-500" />
      case 'md':
      case 'markdown':
      case 'txt':
        return <FileText size={14} className="text-slate-500" />
      default:
        return <FileCode size={14} className="text-slate-600 dark:text-slate-300" />
    }
  }

  // Get file extension from language
  const getExtension = (language) => {
    const extensions = {
      javascript: '.js',
      python: '.py',
      html: '.html',
      css: '.css',
      json: '.json',
      markdown: '.md',
      md: '.md',
      java: '.java',
      cpp: '.cpp',
      typescript: '.ts',
      php: '.php',
      ruby: '.rb',
      go: '.go',
      rust: '.rs',
      bash: '.sh',
      sql: '.sql'
    }
    return extensions[language?.toLowerCase()] || '.txt'
  }
  const getFilename = (item) => {
    if (item.title.includes('.')) return item.title
    const cleanTitle = item.title.replace(/[^a-zA-Z0-9-_]/g, '_')
    return `${cleanTitle}${getExtension(item.language)}`
  }

  // --- Configuration ---

  // determine active mode for the Header

  const isProjects = activeView === 'projects'
  const headerTitle = isProjects ? 'PROJECTS' : 'SNIPPETS' // Uppercase looks more like VS Code
  const handleCreate = isProjects ? onCreateProject : onCreateSnippet
  const itemLabel = isProjects ? 'project' : 'snippet'
  // Safety check,, item is never undefined.
  const safeItems = items || []
  const displayCount = activeView === 'snipets' ? null : safeItems.length
  return (
    <>
      {/* 1. Shared Header Component */}
      <SidebarHeader
        title={headerTitle}
        count={displayCount}
        itemLabel={itemLabel}
        onAction={handleCreate}
      />

      {/* 2. Search Bar */}
      <div className="px-3 pb-2 pt-1">
        <div className="relative group">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
            spellCheck="false"
          />
        </div>
      </div>

      {/* 3. File List */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {items.length === 0 ? (
          <div className="mt-8 opacity-70">
            <EmptyState message={searchTerm ? 'No results' : `No ${activeView}`} />
          </div>
        ) : (
          <div className="space-y-[1px]">
            {items.map((item) => {
              const isSelected = selectedSnippet?.id === item.id

              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={`
                    group relative flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none text-xs rounded-sm transition-colors duration-100
                    ${
                      isSelected
                        ? 'bg-[var(--selected-bg)] text-[var(--selected-text)] font-medium shadow-sm'
                        : 'text-[var(--sidebar-text)] hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)]'
                    }
                `}
                >
                  {/* File Icon */}
                  <span
                    className={`flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-80'} transition-opacity group-hover:opacity-100`}
                  >
                    {getFileIcon(item)}
                  </span>

                  {/* Filename */}
                  <span className="truncate flex-1 font-mono leading-relaxed">
                    {getFilename(item)}
                  </span>

                  {/* Actions Group (Hidden until hover) */}
                  <div
                    className={`
                    flex items-center gap-1
                    ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    transition-opacity
                  `}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRenameRequest && onRenameRequest(item)
                      }}
                      className={`p-1 rounded transition-colors ${
                        isSelected
                          ? 'hover:bg-[var(--hover-bg)] text-[var(--selected-text)]'
                          : 'hover:bg-[var(--selected-bg)] text-slate-400 hover:text-[var(--hover-text)]'
                      }`}
                      title="Rename"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteRequest(item.id)
                      }}
                      className={`p-1 rounded transition-colors ${
                        isSelected
                          ? 'hover:bg-red-600 text-[var(--selected-text)]'
                          : 'hover:bg-[var(--selected-bg)] text-slate-400 hover:text-red-500'
                      }`}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

Explorer.propTypes = {
  activeView: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  selectedSnippet: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
  onCreateProject: PropTypes.func.isRequired,
  onCreateSnippet: PropTypes.func.isRequired,
  onRenameRequest: PropTypes.func.isRequired
}

export default Explorer
