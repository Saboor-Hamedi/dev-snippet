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

  // 1. HYBRID SEARCH ENGINE - Optimized for "Freaking Fast" performance
  // - Empty query: Show local Recent files (Immediate)
  // - Typing: Use Backend FTS (Scalable & Full Content Search)
  useEffect(() => {
    const query = search.trim()
    if (!query || query.startsWith('>')) {
      setSearchResults(null)
      setIsLoading(false)
      return
    }

    // High-performance debounce (50ms) for near-instant results
    const timer = setTimeout(async () => {
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
    }, 50)

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
        title: 'Preferences: Open User Settings (UI)',
        icon: Settings,
        description: 'Configure preferences via Form',
        action: () => window.dispatchEvent(new CustomEvent('app:open-settings'))
      },
      {
        id: 'cmd-settings-json',
        title: 'Preferences: Open User Settings (JSON)',
        icon: FileCode,
        description: 'Edit settings.json directly in the main editor',
        action: () => window.dispatchEvent(new CustomEvent('app:open-json-editor'))
      },
      {
        id: 'cmd-settings-default',
        title: 'Preferences: Open Default Settings (Read Only)',
        icon: Settings,
        description: 'View nominal settings options in the editor',
        action: () => window.dispatchEvent(new CustomEvent('app:open-default-settings-editor'))
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

  // Pre-calculate searchable terms to avoid expensive work in the main search hook
  const searchableSnippets = useMemo(() => {
    return snippets.map((s) => ({
      item: s,
      lowerTitle: (s.title || '').toLowerCase(),
      lowerCode: (s.code || '').toLowerCase(),
      lowerLang: (s.language || '').toLowerCase(),
      lowerTags: Array.isArray(s.tags)
        ? s.tags.join(' ').toLowerCase()
        : (s.tags || '').toLowerCase()
    }))
  }, [snippets])

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim()

    // ─── COMMAND MODE (Shift + Ctrl + P or starting with '>') ───
    if (isCommandMode) {
      const cmdQuery = query.startsWith('>') ? query.slice(1).trim() : query
      if (!cmdQuery) return commands
      return commands.filter((cmd) => cmd.title.toLowerCase().includes(cmdQuery))
    }

    // ─── SEARCH MODE (Ctrl + P) ───
    if (!query) {
      return [...snippets].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5)
    }

    // Local Title/Tag Scoring (Instant Feedback)
    const queryTerms = query.split(/\s+/).filter(Boolean)
    const clientMatches = searchableSnippets
      .map(({ item, lowerTitle, lowerCode, lowerLang, lowerTags }) => {
        let score = 0
        if (lowerTitle === query) score += 2000
        else if (lowerTitle.startsWith(query)) score += 1000

        // Multi-term contribution
        const matchesAll = queryTerms.every((term) => {
          if (lowerTitle.includes(term)) {
            score += 100
            return true
          }
          if (lowerCode.includes(term)) {
            score += 80
            return true
          }
          if (lowerTags.includes(term)) {
            score += 50
            return true
          }
          if (lowerLang.includes(term)) {
            score += 50
            return true
          }
          return false
        })

        // Bonus if all terms match locally
        if (matchesAll) score += 500

        return { item, score }
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((res) => res.item)

    // Merge with Backend (Full Content Search)
    const backendMatches = searchResults || []
    const backendMap = new Map(backendMatches.map((i) => [i.id, i]))

    // Priority: Local Title Matches -> Backend content matches
    const results = clientMatches.map((c) => backendMap.get(c.id) || c)
    const backendOnly = backendMatches.filter((b) => !results.some((r) => r.id === b.id))

    const finalResults = [...results, ...backendOnly]
    return finalResults.slice(0, 15) // Show more results for a "pro" feel
  }, [search, searchableSnippets, searchResults, commands, isCommandMode])

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

  HighlightText.propTypes = {
    text: PropTypes.string,
    highlight: PropTypes.string
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200000] flex items-start justify-center pt-[15vh] px-4 overflow-hidden"
      onMouseDown={onClose}
    >
      {/* Background with deep, near-solid overlay */}
      <div className="absolute inset-0 bg-slate-950/98 animate-in fade-in duration-700" />

      {/* Main UI Container (Refined & Professional) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-[640px] rounded-[12px] shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-8 duration-300 outline-none ring-0 u-borderless"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          maxHeight: '85vh',
          minHeight: '520px',
          display: 'flex',
          flexDirection: 'column',
          border: 'none'
        }}
      >
        {/* Search Header Area - Distinguished with Tertiary Background */}
        <div className="flex items-center h-[64px] px-6 bg-[var(--color-bg-tertiary)] select-none">
          {isCommandMode ? (
            <Command size={20} className="text-[var(--color-accent-primary)] mr-4 stroke-[2.5]" />
          ) : isLoading ? (
            <RefreshCw
              size={20}
              className="text-[var(--color-accent-primary)] mr-4 stroke-[2.5] animate-spin"
            />
          ) : (
            <Search
              size={20}
              className="text-[var(--color-text-tertiary)] mr-4 stroke-[2.5] opacity-40"
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
            className="flex-1 theme-exempt bg-transparent border-none border-0 outline-none outline-0 focus:outline-none focus:ring-0 focus:border-none focus:bg-transparent shadow-none p-0 text-[18px] font-medium tracking-tight placeholder:text-[var(--color-text-tertiary)]/30 text-[var(--color-text-primary)]"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <kbd className="px-2 py-1 text-[10px] font-bold text-[var(--color-text-tertiary)] bg-[var(--color-bg-primary)] rounded-[4px] border border-[var(--color-border)] shadow-sm">
              ESC
            </kbd>
          </div>
        </div>

        {/* Dynamic List - Stabilized against shaking */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-scroll p-0 custom-scrollbar outline-none relative"
          style={{
            minHeight: '400px',
            maxHeight: '60vh',
            backgroundColor: 'var(--color-bg-primary)'
          }}
        >
          <div
            className={`py-1 transition-opacity duration-200 ${
              isLoading && filteredItems.length > 0 ? 'opacity-70' : 'opacity-100'
            }`}
          >
            {filteredItems.length > 0 ? (
              <div className="space-y-0.5">
                {filteredItems.map((item, index) => {
                  const isSelected = index === selectedIndex

                  if (isCommandMode || item.isCommand) {
                    const Icon = item.icon || Terminal
                    return (
                      <div
                        key={item.id}
                        onMouseMove={() => index !== selectedIndex && setSelectedIndex(index)}
                        onClick={async () => {
                          await item.action()
                          onClose()
                        }}
                        className={`group relative px-6 py-4 flex items-center gap-4 cursor-pointer transition-[background-color,opacity] duration-300 ease-out outline-none ${
                          isSelected
                            ? 'bg-[var(--color-accent-primary)]/15'
                            : 'hover:bg-[var(--color-bg-secondary)]'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-none transition-all duration-300 ${
                            isSelected
                              ? 'text-[var(--color-accent-primary)]'
                              : 'text-[var(--color-text-tertiary)] opacity-60'
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

                  const lang = (item.language || 'txt').toUpperCase()
                  const query = search.toLowerCase().trim()
                  const titleMatch = (item.title || '').toLowerCase().includes(query)
                  const isContentMatch =
                    query && !titleMatch && (item.code || '').toLowerCase().includes(query)

                  return (
                    <div
                      key={item.id}
                      onMouseMove={() => index !== selectedIndex && setSelectedIndex(index)}
                      onClick={() => {
                        onSelect(item)
                        onClose()
                      }}
                      className={`group relative px-6 py-4 flex items-center gap-4 cursor-pointer transition-[background-color,opacity] duration-300 ease-out outline-none ${
                        isSelected
                          ? 'bg-[var(--color-accent-primary)]/15'
                          : 'hover:bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-none transition-all duration-300 ${
                          isSelected
                            ? 'text-[var(--color-accent-primary)]'
                            : 'text-[var(--color-text-tertiary)] opacity-50'
                        }`}
                      >
                        {item.title?.toLowerCase().endsWith('.md') ? (
                          <FileCode size={20} />
                        ) : (
                          <Terminal size={20} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[14px] font-semibold truncate tracking-tight ${isSelected ? 'text-[var(--selected-text)]' : 'text-[var(--color-text-primary)]'}`}
                        >
                          <HighlightText text={item.title || 'Untitled'} highlight={search} />
                        </div>
                        <div
                          className={`flex items-center gap-4 mt-0.5 text-[11px] font-medium ${isSelected ? 'text-[var(--selected-text)] opacity-80' : 'text-[var(--color-text-secondary)]'}`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} className="opacity-60" />
                            {item.timestamp
                              ? new Date(item.timestamp).toLocaleDateString()
                              : 'Draft'}
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
                            <div className="mt-1.5 text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 w-full truncate border-l border-[var(--color-accent-primary)]/30">
                              <span className="opacity-60">...</span>
                              {item.match_context
                                .split(/(__MARK__|__\/MARK__)/)
                                .map((part, i, arr) => {
                                  if (part === '__MARK__' || part === '__/MARK__') return null
                                  const isHighlight = i > 0 && arr[i - 1] === '__MARK__'
                                  return (
                                    <span
                                      key={i}
                                      className={
                                        isHighlight
                                          ? 'text-[var(--color-accent-primary)] font-bold'
                                          : ''
                                      }
                                    >
                                      {part}
                                    </span>
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

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-extrabold tracking-widest ${
                            isSelected
                              ? 'bg-[var(--color-accent-primary)] text-white'
                              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                          }`}
                        >
                          {lang}
                        </span>
                        {isSelected && (
                          <ArrowRight size={14} className="text-[var(--color-accent-primary)]" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="inline-flex p-3 rounded-none bg-[var(--color-bg-tertiary)] mb-4">
                  <ShieldCheck size={28} className="text-[var(--color-text-tertiary)] opacity-30" />
                </div>
                <h3 className="text-[14px] font-bold text-[var(--color-text-primary)] opacity-80 mb-2">
                  {search ? `No matches for "${search}"` : 'Type to search...'}
                </h3>
                <p className="text-[12px] text-[var(--color-text-secondary)] opacity-40 max-w-[240px] mx-auto">
                  Try a different keyword or use broad terms to find your snippets.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Substantial Pro Footer - Secondary Background */}
        <div className="px-6 py-5 bg-[var(--color-bg-secondary)] flex justify-between items-center text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.1em]">
          <div className="flex gap-6">
            <span className="flex items-center gap-2 opacity-80">
              <kbd className="px-2 py-1 bg-[var(--color-bg-primary)] rounded-[4px] border border-[var(--color-border)] shadow-md text-[var(--color-text-secondary)] font-mono text-[9px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-2 opacity-80">
              <kbd className="px-2 py-1 bg-[var(--color-bg-primary)] rounded-[4px] border border-[var(--color-border)] shadow-md text-[var(--color-text-secondary)] font-mono text-[9px]">
                ↵
              </kbd>
              Select
            </span>
          </div>
          <div className="flex items-center gap-3 tabular-nums font-extrabold text-[var(--color-accent-primary)]">
            {filteredItems.length} {filteredItems.length === 1 ? 'MATCH' : 'MATCHES'}
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
  onSelect: PropTypes.func.isRequired,
  initialMode: PropTypes.string
}

export default React.memo(CommandPalette)
