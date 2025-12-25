import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import {
  Search,
  FileCode,
  ArrowRight,
  Hash,
  Terminal,
  Clock,
  ShieldCheck,
  Command,
  Settings,
  Moon,
  Sun,
  Sidebar,
  FilePlus,
  Monitor,
  X,
  Image as ImageIcon,
  Layers,
  FileDown
} from 'lucide-react'

/**
 * CommandPalette Component
 * High-performance, ranking-powered navigation hub.
 * Optimized for speed and premium aesthetics.
 */
const CommandPalette = ({ isOpen, onClose, snippets = [], onSelect, initialMode = null }) => {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchResults, setSearchResults] = useState(null)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  // 1. HYBRID SEARCH ENGINE
  // - Empty query: Show local Recent files (Immediate)
  // - Typing: Use Backend FTS (Scalable & Full Content Search)
  useEffect(() => {
    const query = search.trim()
    if (!query || query.startsWith('>')) {
      setSearchResults(null)
      return
    }

    const timer = setTimeout(async () => {
      // Use Backend Search if available (supports Content Search + FTS)
      if (window.api?.searchSnippets) {
        try {
          const results = await window.api.searchSnippets(query)
          setSearchResults(results)
        } catch (e) {
          console.error('Search failed', e)
        }
      }
    }, 150) // 150ms debounce

    return () => clearTimeout(timer)
  }, [search])

  const commands = useMemo(
    () => [
      {
        id: 'cmd-new',
        title: 'Create New Snippet',
        icon: FilePlus,
        description: 'Start a new draft',
        action: () => window.dispatchEvent(new CustomEvent('app:command-new-snippet'))
      },
      {
        id: 'cmd-theme',
        title: 'Toggle Theme',
        icon: Moon, // Dynamic icons handled in render if needed
        description: 'Switch between Light and Dark mode',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-theme'))
      },
      {
        id: 'cmd-sidebar',
        title: 'Toggle Sidebar',
        icon: Sidebar,
        description: 'Show or hide the side panel',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-sidebar'))
      },
      {
        id: 'cmd-preview',
        title: 'Toggle Preview',
        icon: Monitor,
        description: 'Open or close the live preview pane',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-preview'))
      },
      {
        id: 'cmd-settings',
        title: 'Open Settings',
        icon: Settings,
        description: 'Configure preferences and shortcuts',
        action: () => window.dispatchEvent(new CustomEvent('app:open-settings'))
      },
      {
        id: 'cmd-copy-image',
        title: 'Copy as Image',
        icon: ImageIcon,
        description: 'Export snippet code as an image',
        action: () => window.dispatchEvent(new CustomEvent('app:command-copy-image'))
      },
      {
        id: 'cmd-overlay',
        title: 'Toggle Preview Overlay',
        icon: Layers,
        description: 'Switch between Side-by-Side and Overlay preview',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-overlay'))
      },
      {
        id: 'cmd-export-pdf',
        title: 'Export to PDF',
        icon: FileDown,
        description: 'Generate a professional PDF of the snippet',
        action: () => window.dispatchEvent(new CustomEvent('app:export-pdf'))
      },
      {
        id: 'cmd-close-window',
        title: 'Close Application',
        icon: X,
        description: 'Exit the application',
        action: () => window.api.closeWindow()
      }
    ],
    []
  )

  const isCommandMode = search.startsWith('>')

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim()

    // CASE 0: Command Mode
    if (isCommandMode) {
      const cmdQuery = query.slice(1).trim()
      if (!cmdQuery) return commands
      return commands.filter((cmd) => cmd.title.toLowerCase().includes(cmdQuery))
    }

    // CASE 1: Recents (No Query)
    if (!query) {
      return [...snippets].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 15)
    }

    // CASE 2: Hybrid Search (Merge Client Title Matches + Backend Content Matches)

    // A. Client-Side Title Search (Instant Type-ahead)
    // This ensures "docu" matches "documentation" immediately without waiting for FTS
    const clientMatches = snippets
      .map((item) => {
        const title = (item.title || '').toLowerCase()
        const tags = Array.isArray(item.tags)
          ? item.tags.join(' ').toLowerCase()
          : (item.tags || '').toLowerCase()
        let score = 0

        if (title === query) score += 1000
        else if (title.startsWith(query)) score += 500
        else if (title.includes(query)) score += 100
        if (tags.includes(query)) score += 50

        return { item, score }
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((res) => res.item)

    // B. Backend Matches (Content & FTS)
    const backendMatches = searchResults || []

    // C. Merge Strategy
    // 1. Start with Client Matches (Top correctness for Titles)
    // 2. Enhance them with Backend Data (Context) if available
    // 3. Append remaining Backend Matches (Content-only matches)

    // Create map for fast lookup of backend results (to get 'match_context')
    const backendMap = new Map(backendMatches.map((i) => [i.id, i]))

    const merged = clientMatches.map((c) => backendMap.get(c.id) || c)

    const backendOnly = backendMatches.filter((b) => !merged.find((m) => m.id === b.id))

    return [...merged, ...backendOnly].slice(0, 25)
  }, [search, snippets, searchResults, commands, isCommandMode])

  // Reset index on search change
  useEffect(() => {
    setSelectedIndex(0)
  }, [search, searchResults])

  // Focus and handle navigation
  useEffect(() => {
    if (isOpen) {
      // If opened in command mode, pre-fill '>'
      const initialText = initialMode === 'command' ? '>' : ''
      setSearch(initialText)

      // Give a slight delay for the modal animation to settle before focusing
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          // Move cursor to end if text exists
          if (initialText) {
            inputRef.current.selectionStart = inputRef.current.selectionEnd = initialText.length
          }
        }
      }, 50) // Slightly faster focus
      return () => clearTimeout(timer)
    }
  }, [isOpen, initialMode])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredItems[selectedIndex]
      if (selected) {
        if (isCommandMode) {
          selected.action()
        } else {
          onSelect(selected)
        }
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Helper to highlight matching text
  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>
    // Support multi-term highlighting (e.g. "react hook" highlights both)
    const terms = highlight
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

    if (terms.length === 0) return <span>{text}</span>

    const regex = new RegExp(`(${terms.join('|')})`, 'gi')
    const parts = text.split(regex)
    return (
      <span className="opacity-100">
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span
              key={`match-${i}`}
              className="text-[var(--color-accent-primary)] font-bold decoration-[var(--color-accent-primary)]/30"
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

      {/* Main UI Container (Refined & Professional) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--color-border)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-4 duration-200 backdrop-blur-xl outline-none ring-0"
      >
        {/* Search Header Area */}
        <div className="flex items-center px-4 py-4 bg-[var(--bg-tertiary)]/30 border-b border-[var(--color-border)]">
          {isCommandMode ? (
            <Command size={18} className="text-[var(--color-accent-primary)] mr-3.5 stroke-[2]" />
          ) : (
            <Search
              size={18}
              className="text-[var(--color-text-tertiary)] mr-3.5 stroke-[2] opacity-40"
            />
          )}

          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isCommandMode ? 'Type a command...' : 'Search files or type > for commands'
            }
            className="flex-1 theme-exempt bg-transparent border-none border-0 outline-none outline-0 focus:outline-none focus:ring-0 focus:border-none focus:bg-transparent shadow-none p-0 text-[14px] font-normal tracking-tight placeholder:text-[var(--color-text-tertiary)]/50 text-[var(--color-text-primary)]"
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
          className="flex-1 overflow-y-auto max-h-[60vh] p-2 custom-scrollbar transition-all outline-none"
        >
          {filteredItems.length > 0 ? (
            <div className="space-y-0.5">
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex

                // --- COMMAND RENDER ---
                if (isCommandMode) {
                  const Icon = item.icon || Terminal
                  return (
                    <div
                      key={item.id}
                      onMouseMove={() => {
                        if (selectedIndex !== index) setSelectedIndex(index)
                      }}
                      onClick={() => {
                        item.action()
                        onClose()
                      }}
                      className={`group relative px-4 py-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-100 outline-none ${
                        isSelected
                          ? 'bg-blue-500/10 dark:bg-blue-400/10'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? 'text-[var(--selected-text)]'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[14px] font-semibold ${isSelected ? 'text-[var(--selected-text)]' : 'text-[var(--color-text-primary)]'}`}
                        >
                          {item.title}
                        </div>
                        <div
                          className={`text-[11px] ${isSelected ? 'text-[var(--selected-text)] opacity-80' : 'text-[var(--color-text-secondary)]'}`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>
                  )
                }

                // --- SNIPPET RENDER ---
                const lang = (item.language || 'txt').toUpperCase()

                // Check if this was a content-only match for visual feedback
                const query = search.toLowerCase().trim()
                const titleMatch = (item.title || '').toLowerCase().includes(query)
                const isContentMatch =
                  query && !titleMatch && (item.code || '').toLowerCase().includes(query)

                return (
                  <div
                    key={item.id}
                    onMouseMove={() => {
                      if (selectedIndex !== index) setSelectedIndex(index)
                    }}
                    onClick={() => {
                      onSelect(item)
                      onClose()
                    }}
                    className={`group relative px-4 py-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-100 outline-none ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-400/10'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {/* Visual Icon Stack */}
                    <div
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? 'text-[var(--selected-text)] scale-105'
                          : 'text-[var(--color-text-secondary)] group-hover:text-[var(--hover-text)]'
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
                          isSelected
                            ? 'text-[var(--selected-text)]'
                            : 'text-[var(--color-text-primary)]'
                        }`}
                      >
                        <HighlightText text={item.title || 'Untitled'} highlight={search} />
                      </div>
                      <div
                        className={`flex items-center gap-4 mt-0.5 text-[11px] font-medium ${
                          isSelected
                            ? 'text-[var(--selected-text)] opacity-80'
                            : 'text-[var(--color-text-secondary)]'
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
                        {item.match_context ? (
                          <div className="mt-1.5 text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--bg-tertiary)]/50 px-1.5 py-0.5 rounded w-full truncate">
                            <span className="opacity-60">...</span>
                            {item.match_context
                              .split(/(__MARK__|__\/MARK__)/)
                              .map((part, i, arr) => {
                                if (part === '__MARK__' || part === '__/MARK__') return null
                                const isHighlight = i > 0 && arr[i - 1] === '__MARK__'
                                return isHighlight ? (
                                  <span
                                    key={i}
                                    className="text-[var(--color-accent-primary)] font-bold bg-[var(--bg-secondary)] px-0.5 rounded-[1px]"
                                  >
                                    {part}
                                  </span>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              })}
                            <span className="opacity-60">...</span>
                          </div>
                        ) : (
                          isContentMatch && (
                            <span
                              className={`flex items-center gap-1 opacity-70 ${isSelected ? 'text-[var(--selected-text)]' : 'text-[var(--color-accent-primary)]'}`}
                            >
                              <Search size={10} className="stroke-[3]" />
                              <span>match in content</span>
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Right-side Badge & Arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold transition-colors tracking-widest ${
                          isSelected
                            ? 'bg-[var(--color-accent-primary)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--color-text-secondary)]'
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
              <div className="inline-flex p-3 rounded-2xl bg-[var(--bg-tertiary)] mb-3">
                <ShieldCheck size={24} className="text-[var(--color-text-tertiary)]" />
              </div>
              <h3 className="text-[var(--color-text-primary)] font-bold text-[14px] tracking-tight">
                No results found
              </h3>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 max-w-[200px] mx-auto font-medium leading-relaxed">
                {search
                  ? `We couldn't find anything matching "${search}"`
                  : 'Start by creating your first code snippet'}
              </p>
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <div className="px-6 py-4 bg-[var(--bg-tertiary)] border-t border-[var(--color-border)] flex justify-between items-center text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-primary)] rounded-md border border-[var(--color-border)] shadow-sm text-[var(--color-text-secondary)] font-mono">
                ↑↓
              </kbd>
              Move
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-primary)] rounded-md border border-[var(--color-border)] shadow-sm text-[var(--color-text-secondary)] font-mono">
                ↵
              </kbd>
              {isCommandMode ? 'Execute' : 'Open'}
            </span>
          </div>
          <div className="flex items-center gap-2 tabular-nums">
            {filteredItems.length} {filteredItems.length === 1 ? 'Result' : 'Results'}
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
