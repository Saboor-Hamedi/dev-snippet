import React from 'react'
import PropTypes from 'prop-types'
import { Copy, Check, Eye, Trash2, Pencil, Plus } from 'lucide-react'
const Sidebar = ({
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
  // Get file extension icon based on language
  const getFileIcon = (language) => {
    const icons = {
      javascript: '📄',
      python: '🐍',
      html: '🌐',
      css: '🎨',
      json: '📋',
      markdown: '📝',
      java: '☕',
      cpp: '⚙️',
      typescript: '📘',
      php: '🐘',
      ruby: '💎',
      go: '🔵',
      rust: '🦀'
    }
    return icons[language?.toLowerCase()] || '📄'
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

  // Generate filename from title
  const getFilename = (item) => {
    // If title already has extension, use it
    if (item.title.includes('.')) {
      return item.title
    }
    // Otherwise, add extension based on language
    const cleanTitle = item.title.replace(/[^a-zA-Z0-9-_]/g, '_')
    return `${cleanTitle}${getExtension(item.language)}`
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Header & Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-3 h-6">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {activeView}
          </h2>
          <div className="flex gap-1">
            {activeView === 'projects' && (
              <button
                onClick={onCreateProject}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                title="New Project"
              >
                <Plus size={16} />
              </button>
            )}
            {activeView === 'snippets' && (
              <button
                onClick={onCreateSnippet}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                title="New Snippet"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded text-xs text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {items.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg
              className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {searchTerm ? 'No results' : `No ${activeView}`}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`group relative px-2 py-1.5 rounded cursor-pointer transition-all flex items-center gap-2 ${
                  selectedSnippet?.id === item.id
                    ? 'bg-primary-50 dark:bg-primary-600/20 text-primary-700 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {/* File Icon */}
                <span className="text-sm flex-shrink-0">{getFileIcon(item.language)}</span>

                {/* Filename */}
                <span className="truncate flex-1 text-xs font-mono">{getFilename(item)}</span>

                {/* Actions Group */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Rename Button - For both Projects and Snippets */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRenameRequest && onRenameRequest(item)
                    }}
                    className="p-1 text-slate-400 hover:text-primary-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title={`Rename ${item.type === 'project' ? 'Project' : 'Snippet'}`}
                  >
                    <Pencil size={14} />
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteRequest(item.id)
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

Sidebar.propTypes = {
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

export default Sidebar
