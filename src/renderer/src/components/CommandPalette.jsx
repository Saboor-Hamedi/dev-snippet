import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { Search, FileCode, ArrowRight, Hash, Terminal, Clock, ShieldCheck } from 'lucide-react'

/**
 * CommandPalette Component
 * High-performance, ranking-powered navigation hub.
 * Optimized for speed and premium aesthetics.
 */
const CommandPalette = ({ isOpen, onClose, snippets = [], onSelect }) => {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  // 1. SMART RANKING ENGINE
  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) {
      // Show most recent first when empty
      return [...snippets].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 15)
    }

    return snippets
      .map((item) => {
        const title = (item.title || '').toLowerCase()
        const tags = Array.isArray(item.tags)
          ? item.tags.join(' ').toLowerCase()
          : (item.tags || '').toLowerCase()
        const lang = (item.language || '').toLowerCase()
        const code = (item.code || '').toLowerCase()
        let score = 0

        // Exact match (Highest Priority)
        if (title === query) score += 1000
        // Prefix match
        else if (title.startsWith(query)) score += 500
        // Word boundary match
        else if (title.includes(` ${query}`)) score += 300
        // Substring match
        else if (title.includes(query)) score += 100

        // Secondary matches (Tags & Lang)
        if (tags.includes(query)) score += 50
        if (lang.includes(query)) score += 30

        // Deep Content Search (The "Content King" Upgrade)
        // Check for matches within the actual snippet code/notes
        if (code.includes(query)) score += 20

        return { item, score }
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score || (b.item.timestamp || 0) - (a.item.timestamp || 0))
      .map((res) => res.item)
      .slice(0, 25)
  }, [search, snippets])

  // Reset index on search
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Focus and handle navigation
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      // Give a slight delay for the modal animation to settle before focusing
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredItems[selectedIndex]
      if (selected) {
        onSelect(selected)
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Helper to highlight matching text
  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span
              key={`match-${i}`}
              className="text-emerald-500 dark:text-emerald-400 font-bold underline decoration-emerald-500/30"
            >
              {part}
            </span>
          ) : (
            <span key={`text-${i}`}>{part}</span>
          )
        )}
      </span>
    )
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4 overflow-hidden"
      onMouseDown={onClose}
    >
      {/* Background with blur (User loves this) */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[12px] animate-in fade-in duration-500" />

      {/* Main UI Container (Lean & Compact) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white/95 dark:bg-[#0d1117]/95 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-slate-800/60 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-6 duration-300 backdrop-blur-md"
      >
        {/* Ultra-Clean Input Header (Strictly Zero-Gravity) */}
        <div className="flex items-center px-5 py-3.5 bg-transparent border-none shadow-none">
          <Search size={18} className="text-slate-400 mr-4 stroke-[2.5] opacity-50" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search keywords..."
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none shadow-none appearance-none text-[14px] font-normal tracking-tight placeholder:text-white/40  "
            autoComplete="off"
            spellCheck={false}
          />
          <div className="hidden sm:flex items-center gap-1.5 ml-3">
            <kbd className="px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-transparent rounded border border-slate-200/50 dark:border-slate-800/50">
              ESC
            </kbd>
          </div>
        </div>

        {/* Dynamic List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto max-h-[60vh] p-2 custom-scrollbar transition-all"
        >
          {filteredItems.length > 0 ? (
            <div className="space-y-0.5">
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex
                const lang = (item.language || 'txt').toUpperCase()

                // Check if this was a content-only match for visual feedback
                const query = search.toLowerCase().trim()
                const titleMatch = (item.title || '').toLowerCase().includes(query)
                const isContentMatch =
                  query && !titleMatch && (item.code || '').toLowerCase().includes(query)

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                      onSelect(item)
                      onClose()
                    }}
                    className={`group relative px-4 py-2.5 rounded-sm flex items-center gap-4 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800/80 border-l-[3px] border-emerald-500 pl-[13px]' /* Compensate padding for border */
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 border-l-[3px] border-transparent'
                    }`}
                  >
                    {/* Visual Icon Stack */}
                    <div
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? 'bg-white/20 text-white scale-105 shadow-inner'
                          : 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:text-emerald-500'
                      }`}
                    >
                      {item.title?.toLowerCase().endsWith('.md') ? (
                        <FileCode size={18} />
                      ) : (
                        <Terminal size={18} />
                      )}
                    </div>

                    {/* Metadata Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[14px] font-semibold truncate tracking-tight ${
                          isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <HighlightText text={item.title || 'Untitled'} highlight={search} />
                      </div>
                      <div
                        className={`flex items-center gap-4 mt-0.5 text-[11px] font-medium ${
                          isSelected ? 'text-emerald-50/90' : 'text-slate-500 dark:text-slate-500'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="opacity-60" />
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Draft'}
                        </span>
                        {item.tags && (
                          <div className="flex items-center gap-3 truncate">
                            {(Array.isArray(item.tags)
                              ? item.tags
                              : (item.tags || '').split(/[\s,]+/)
                            )
                              .filter(Boolean)
                              .slice(0, 3)
                              .map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="flex items-center text-inherit opacity-85"
                                >
                                  <Hash size={10} className="opacity-40 -mr-0.5" />
                                  {tag}
                                </span>
                              ))}
                          </div>
                        )}
                        {isContentMatch && (
                          <span
                            className={`flex items-center gap-1 opacity-70 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-500/80'}`}
                          >
                            <Search size={10} className="stroke-[3]" />
                            <span>match in content</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right-side Badge & Arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-1 py-0.5 rounded text-[8px] font-bold border transition-colors tracking-widest ${
                          isSelected
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {lang}
                      </span>
                      {isSelected && (
                        <ArrowRight
                          size={16}
                          className="text-white animate-in slide-in-from-left-2 duration-300"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="inline-flex p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 mb-3 border border-slate-200/50 dark:border-slate-800/50">
                <ShieldCheck size={24} className="text-slate-300 dark:text-slate-700" />
              </div>
              <h3 className="text-slate-800 dark:text-slate-200 font-bold text-[14px] tracking-tight">
                No snippets found
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-600 mt-1 max-w-[200px] mx-auto font-medium leading-relaxed">
                {search
                  ? `We couldn't find anything matching "${search}"`
                  : 'Start by creating your first code snippet'}
              </p>
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 font-mono">
                ↑↓
              </kbd>
              Move
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 font-mono">
                ↵
              </kbd>
              Open
            </span>
          </div>
          <div className="flex items-center gap-2 tabular-nums">
            {filteredItems.length} {filteredItems.length === 1 ? 'Match' : 'Matches'}
          </div>
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

export default React.memo(CommandPalette)
