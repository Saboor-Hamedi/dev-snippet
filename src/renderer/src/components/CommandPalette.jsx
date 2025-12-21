import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { Search, FileCode, ArrowRight } from 'lucide-react'

const CommandPalette = ({ isOpen, onClose, snippets = [], onSelect }) => {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  // Use backend search for "Blazing Fast" performance on large datasets
  useEffect(() => {
    const performSearch = async () => {
      if (!search.trim()) {
        setResults(snippets)
        return
      }

      setIsLoading(true)
      try {
        if (window.api?.searchSnippets) {
          const searchResults = await window.api.searchSnippets(search)
          setResults(searchResults || [])
        } else {
          // Fallback to local filtering if search API is missing
          const searchLower = search.toLowerCase().trim()
          setResults(
            snippets.filter(
              (s) =>
                (s.title || '').toLowerCase().includes(searchLower) ||
                (s.language || '').toLowerCase().includes(searchLower)
            )
          )
        }
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsLoading(false)
        setSelectedIndex(0)
      }
    }

    const timer = setTimeout(performSearch, 150)
    return () => clearTimeout(timer)
  }, [search, snippets])

  const filteredItems = results

  // Reset selection when search changes (already handled in performSearch but for safety)
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Scroll selected item into view using standard DOM API
  useEffect(() => {
    if (scrollRef.current) {
      const selectedElement = scrollRef.current.children[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      const focusInput = () => {
        if (inputRef.current) {
          try {
            inputRef.current.disabled = false
            inputRef.current.readOnly = false
            inputRef.current.blur()
            inputRef.current.focus()
            inputRef.current.select()
          } catch (err) {}
        }
      }
      setTimeout(focusInput, 200)
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

  if (!isOpen) return null

  // Standard Row Component
  const ResultItem = ({ item, index, isSelected, onClick, onClose }) => {
    return (
      <div
        onClick={() => {
          onClick(item)
          onClose()
        }}
        className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
          isSelected
            ? 'bg-slate-50 dark:bg-slate-800'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
          <FileCode size={12} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-medium truncate">{item.title || 'Untitled'}</span>
            {isSelected && <ArrowRight size={12} className="text-primary-500" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <small className="font-mono rounded">
              {item.language}{' '}
              {item.timestamp ? `• ${new Date(item.timestamp).toLocaleDateString()}` : ''}
            </small>
          </div>
        </div>
      </div>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm animate-fade-in"
      style={{
        fontSize: '14px',
        '--zoom-level': 1
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl border overflow-hidden flex flex-col transform transition-all"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--border-color)',
          color: 'var(--color-text)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Search size={12} className="text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={() => inputRef.current?.focus()}
            placeholder="Search snippets..."
            className="flex-1 bg-transparent border-none outline-none text-medium theme-exempt"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            Esc
          </kbd>
        </div>

        {/* Results List - Standard (Stable) */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-[100px] max-h-[60vh] scrollbar-hide p-2"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <ResultItem
                key={item.id || index}
                item={item}
                index={index}
                isSelected={index === selectedIndex}
                onClick={onSelect}
                onClose={onClose}
              />
            ))
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
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <div className="flex gap-4">
            <span>
              <kbd className="font-mono">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> select
            </span>
          </div>
          <span>{filteredItems.length} units</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

CommandPalette.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  snippets: PropTypes.array,
  onSelect: PropTypes.func.isRequired
}

export default CommandPalette
