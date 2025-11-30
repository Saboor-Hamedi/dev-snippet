import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Search, FileCode, ArrowRight } from 'lucide-react'

const CommandPalette = ({ isOpen, onClose, snippets = [], onSelect }) => {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return []

    const searchLower = search.toLowerCase()
    const snippetResults = snippets
      .filter((s) => {
        const titleMatch = (s.title || '').toLowerCase().includes(searchLower)
        const langMatch = (s.language || '').toLowerCase().includes(searchLower)
        const codeMatch = (s.code || '').toLowerCase().includes(searchLower)
        return titleMatch || langMatch || codeMatch
      })
      .map((s) => ({ ...s, type: 'snippet' }))

    return snippetResults.slice(0, 10) // Limit to 10 results
  }, [search, snippets])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSearch('')
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex])
          onClose()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredItems, selectedIndex, onSelect, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      listRef.current.children[selectedIndex].scrollIntoView({
        block: 'nearest'
      })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl border overflow-hidden flex flex-col transform transition-all"
        style={{
          backgroundColor: 'var(--color-background-soft)',
          borderColor: 'var(--border-color)',
          color: 'var(--color-text)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets..."
            className="flex-1 bg-transparent border-none outline-none text-lg"
          />
          <div className="flex gap-2">
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto" ref={listRef}>
          {filteredItems.length > 0 ? (
            <div className="py-2">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item)
                    onClose()
                  }}
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-sky-100 dark:bg-sky-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <FileCode size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium truncate">{item.title}</span>
                      {index === selectedIndex && (
                        <ArrowRight size={14} className="text-primary-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{item.type}</span>
                      <span>•</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {item.language}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : search.trim() ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <p>No results found for "{search}"</p>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <p>Type to search...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <div className="flex gap-4">
            <span>
              <kbd className="font-mono">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> to select
            </span>
          </div>
          <span>{filteredItems.length} results</span>
        </div>
      </div>
    </div>
  )
}

CommandPalette.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  snippets: PropTypes.array,
  onSelect: PropTypes.func.isRequired
}

export default CommandPalette
