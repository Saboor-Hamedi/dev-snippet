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
  Layout,
  FileDown,
  Cloud,
  CloudDownload,
  FileText,
  Star,
  Zap,
  CloudCog,
  RefreshCw
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
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  // Toast notification helper
  const showToast = (message, type = 'info') => {
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: { message, type }
      })
    )
  }

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
        setIsLoading(true)
        try {
          const results = await window.api.searchSnippets(query)
          setSearchResults(results)
        } catch (e) {
          console.error('Search failed', e)
        } finally {
          setIsLoading(false)
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
        id: 'cmd-backup',
        title: 'Backup to Cloud',
        icon: Cloud,
        description: 'Backup all snippets to GitHub Gist',
        action: async () => {
          try {
            await window.api.syncBackup()
            showToast('✅ Backup completed successfully', 'success')
          } catch (err) {
            console.error('Backup failed:', err)
            const errorMsg = err.message || 'Unknown error'
            if (errorMsg.includes('401') || errorMsg.includes('Invalid Token')) {
              showToast('❌ Backup failed: Invalid or expired token', 'error')
            } else if (errorMsg.includes('403')) {
              showToast('❌ Backup failed: Token lacks gist permissions', 'error')
            } else if (errorMsg.includes('No GitHub Token')) {
              showToast('❌ Backup failed: No token configured', 'error')
            } else {
              showToast(`❌ Backup failed: ${errorMsg}`, 'error')
            }
          } finally {
            // Close palette first, then focus editor
            onClose()
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('app:focus-editor'))
            }, 200)
          }
        }
      },
      {
        id: 'cmd-restore',
        title: 'Restore from Cloud',
        icon: CloudDownload,
        description: 'Restore all snippets from GitHub Gist (overwrites local data)',
        action: async () => {
          if (
            !confirm('⚠️ This will OVERWRITE your local data with the GitHub backup. Are you sure?')
          ) {
            onClose()
            return
          }
          try {
            await window.api.syncRestore()
            showToast('✅ Restore completed successfully', 'success')
          } catch (err) {
            console.error('Restore failed:', err)
            const errorMsg = err.message || 'Unknown error'
            if (errorMsg.includes('401') || errorMsg.includes('Invalid Token')) {
              showToast('❌ Restore failed: Invalid or expired token', 'error')
            } else if (errorMsg.includes('403')) {
              showToast('❌ Restore failed: Token lacks gist permissions', 'error')
            } else if (errorMsg.includes('No GitHub Token')) {
              showToast('❌ Restore failed: No token configured', 'error')
            } else if (errorMsg.includes('No backup found')) {
              showToast('❌ Restore failed: No backup found on GitHub', 'error')
            } else {
              showToast(`❌ Restore failed: ${errorMsg}`, 'error')
            }
          } finally {
            // Close palette and focus editor
            onClose()
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('app:focus-editor'))
            }, 200)
          }
        }
      },
      {
        id: 'cmd-sync-center',
        title: 'Open Sync Control Center',
        icon: CloudCog,
        description: 'Inspect status, backups, and restores in one place',
        action: () => window.dispatchEvent(new CustomEvent('app:open-sync-center'))
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
        id: 'cmd-favorite',
        title: 'Toggle Favorite',
        icon: Star,
        description: 'Mark/Unmark current snippet as favorite',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-favorite'))
      },
      {
        id: 'cmd-ping',
        title: 'Toggle Ping',
        icon: Zap,
        description: 'Highlight the current snippet in the sidebar',
        action: () => window.dispatchEvent(new CustomEvent('app:ping-snippet'))
      },
      {
        id: 'cmd-export-pdf',
        title: 'Export to PDF',
        icon: FileDown,
        description: 'Generate a professional PDF of the snippet',
        action: () => window.dispatchEvent(new CustomEvent('app:export-pdf'))
      },
      {
        id: 'cmd-export-word',
        title: 'Export to Word',
        icon: FileText,
        description: 'Generate a professional Word document of the current snippet',
        action: () => window.dispatchEvent(new CustomEvent('app:trigger-export-word'))
      },
      {
        id: 'cmd-toggle-activity-bar',
        title: 'Toggle Activity Bar',
        icon: Layout,
        description: 'Show or hide the leftmost navigation rail',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-activity-bar'))
      },
      {
        id: 'cmd-reload-window',
        title: 'Reload Window',
        icon: RefreshCw,
        description: 'Hard refresh the UI (same as VS Code Reload Window)',
        action: async () => {
          try {
            showToast('♻️ Reloading window...', 'info')
            await window.api.reloadWindow()
          } catch (err) {
            console.error('Reload failed:', err)
            showToast('❌ Reload failed. See console for details.', 'error')
          } finally {
            onClose()
          }
        }
      },
      {
        id: 'cmd-close-window',
        title: 'Close Application',
        icon: X,
        description: 'Exit the application',
        action: () => window.api.closeWindow()
      },
      {
        id: 'cmd-reset-window',
        title: 'Reset Window Layout',
        icon: Layout,
        description: 'Restore default sidebar, activity bar, and exit modes',
        action: () => window.dispatchEvent(new CustomEvent('app:reset-layout'))
      },
      {
        id: 'cmd-toggle-zen',
        title: 'Toggle All Sidebars (Zen Mode)',
        icon: Monitor,
        description: 'Hide/Show both Activity Bar and Sidebar at once',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-zen'))
      },
      {
        id: 'cmd-toggle-zen-focus',
        title: 'Toggle Zen Focus (Immersive)',
        icon: Zap,
        description: 'Deep focus: hide all UI and dim non-active editor lines',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-zen-focus'))
      },
      {
        id: 'cmd-toggle-flow',
        title: 'Toggle Flow Mode',
        icon: Command,
        description: 'Concentrate on a single snippet with the Canvas (Alt+Shift+F)',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-flow'))
      },
      {
        id: 'cmd-toggle-header',
        title: 'Toggle Header',
        icon: Layout,
        description: 'Show or hide the top title and navigation bar',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-header'))
      },
      {
        id: 'cmd-toggle-status-bar',
        title: 'Toggle Status Bar',
        icon: ShieldCheck,
        description: 'Show or hide the bottom information bar',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-status-bar'))
      },
      {
        id: 'cmd-toggle-gutter',
        title: 'Toggle Gutter',
        icon: Layers,
        description: 'Show or hide line numbers and folding arrows',
        action: () => window.dispatchEvent(new CustomEvent('app:toggle-gutter'))
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
      return [...snippets].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5)
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

    // USER FEEDBACK: "When it finds a specific thing (Title/Tag), it shouldn't show the others (Content)."
    // If we have strong matches (Title/Tags), show ONLY them.
    if (merged.length > 0) {
      return merged.slice(0, 5)
    }

    // Otherwise show content matches (Fallback)
    return backendOnly.slice(0, 5)
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

      const focusInput = () => {
        if (inputRef.current) {
          inputRef.current.focus()
          // Move cursor to end if text exists
          if (initialText) {
            inputRef.current.selectionStart = inputRef.current.selectionEnd = initialText.length
          }
        }
      }

      // Use multiple strategies to ensure focus sticks across different browsers/states
      const raf1 = requestAnimationFrame(focusInput)
      const raf2 = requestAnimationFrame(() => requestAnimationFrame(focusInput))
      const timer = setTimeout(focusInput, 50)
      const timer2 = setTimeout(focusInput, 150)

      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
        clearTimeout(timer)
        clearTimeout(timer2)
      }
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
      className="fixed inset-0 z-[200000] flex items-start justify-center pt-[15vh] px-4 overflow-hidden"
      onMouseDown={onClose}
    >
      {/* Background with solid overlay (Scientist Mode) */}
      <div className="absolute inset-0 bg-slate-900/95 animate-in fade-in duration-500" />

      {/* Main UI Container (Refined & Professional) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-[5px] shadow-2xl border border-[var(--color-border)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-4 duration-200 outline-none ring-0"
        style={{ backgroundColor: 'rgb(var(--color-bg-primary-rgb))' }}
      >
        {/* Search Header Area */}
        <div className="flex items-center px-4 py-4 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
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
            autoFocus
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
            <kbd className="px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-transparent rounded-[3px] border border-slate-200/50 dark:border-slate-800/50">
              ESC
            </kbd>
          </div>
        </div>

        {/* Dynamic List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto max-h-[60vh] p-2 custom-scrollbar transition-all outline-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-primary)]"></div>
            </div>
          ) : filteredItems.length > 0 ? (
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
                      onClick={async () => {
                        await item.action()
                        onClose()
                      }}
                      className={`group relative px-4 py-3 rounded-[4px] flex items-center gap-3 cursor-pointer transition-all duration-200 ease-in-out outline-none border border-transparent ${
                        isSelected
                          ? 'bg-blue-500/10 dark:bg-blue-400/10 ring-1 ring-blue-500/10'
                          : 'hover:bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-none transition-all duration-200 ${
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
                    className={`group relative px-4 py-3 rounded-[4px] flex items-center gap-3 cursor-pointer transition-all duration-200 ease-in-out outline-none border border-transparent ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-400/10 ring-1 ring-blue-500/10'
                        : 'hover:bg-[var(--color-bg-secondary)]'
                    }`}
                  >
                    {/* Visual Icon Stack */}
                    <div
                      className={`p-2 rounded-none transition-all duration-200 ${
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
                          <div className="mt-1.5 text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded-none w-full truncate">
                            <span className="opacity-60">...</span>
                            {item.match_context
                              .split(/(__MARK__|__\/MARK__)/)
                              .map((part, i, arr) => {
                                if (part === '__MARK__' || part === '__/MARK__') return null
                                const isHighlight = i > 0 && arr[i - 1] === '__MARK__'
                                return isHighlight ? (
                                  <span
                                    key={i}
                                    className="text-[var(--color-accent-primary)] font-bold bg-[var(--color-bg-secondary)] px-0.5 rounded-none"
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
                        className={`px-1.5 py-0.5 rounded-none text-[8px] font-extrabold transition-colors tracking-widest ${
                          isSelected
                            ? 'bg-[var(--color-accent-primary)] text-white'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
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
              <div className="inline-flex p-3 rounded-none bg-[var(--color-bg-tertiary)] mb-3">
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
        <div className="px-6 py-4 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)] flex justify-between items-center text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-primary)] rounded-[3px] border border-[var(--color-border)] shadow-sm text-[var(--color-text-secondary)] font-mono">
                ↑↓
              </kbd>
              Move
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-primary)] rounded-[3px] border border-[var(--color-border)] shadow-sm text-[var(--color-text-secondary)] font-mono">
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
