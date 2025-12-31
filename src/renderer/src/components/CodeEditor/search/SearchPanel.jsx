import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  CaseSensitive,
  Regex,
  WholeWord,
  ChevronRight,
  ArrowRight,
  CopyCheck
} from 'lucide-react'
import { EditorView } from '@codemirror/view'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * VS Code-style Search Panel with Replace
 * Compact search box positioned at top-right of editor
 */
const SearchPanel = ({
  editorView,
  onClose,
  initialQuery = '',
  onQueryChange,
  focusTrigger = 0
}) => {
  const [query, setQuery] = useState(initialQuery)
  const [replaceQuery, setReplaceQuery] = useState('')
  const [isReplaceOpen, setIsReplaceOpen] = useState(() => {
    return typeof focusTrigger === 'object' && focusTrigger?.mode === 'replace'
  })

  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)

  const [currentMatch, setCurrentMatch] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)

  const inputRef = useRef(null)
  const replaceInputRef = useRef(null)

  const handleClose = () => {
    onClose()
    if (editorView && editorView.focus) {
      editorView.focus()
    }
  }

  // Force focus, update selection, and toggle Replace mode when trigger changes
  useEffect(() => {
    if (!focusTrigger) return

    // 1. Update Query from Selection (Only if editor is focused to prevent overwriting user input)
    if (editorView && editorView.hasFocus) {
      const selection = editorView.state.selection.main
      const selectedText = editorView.state.doc.sliceString(selection.from, selection.to)
      if (selectedText.length > 0 && selectedText.length < 200) {
        setQuery(selectedText)
      }
    }

    // 2. Handle Focus & Mode
    if (typeof focusTrigger === 'object') {
      if (focusTrigger.mode === 'replace') {
        setIsReplaceOpen(true)
        setTimeout(() => {
          replaceInputRef.current?.focus()
          replaceInputRef.current?.select()
        }, 0)
      } else {
        // 'find' mode
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    } else if (focusTrigger > 0) {
      // Legacy or simple trigger - prioritize Search focus unless Replace is explicitly desired
      if (isReplaceOpen) {
        // If replace is already open, keep it open but focus based on last interaction?
        // Default to searching again usually means focusing search input.
        inputRef.current?.focus()
        inputRef.current?.select()
      } else {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
  }, [focusTrigger, editorView])

  // Global Key Listener for Esc (Ctrl+H handled by CodeEditor via bubbling)
  useEffect(() => {
    const handleGlobalKey = (e) => {
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleClose()
      }
    }

    // Use capture phase to ensure we catch it before editor/inputs if needed
    window.addEventListener('keydown', handleGlobalKey, true)
    return () => window.removeEventListener('keydown', handleGlobalKey, true)
  }, [handleClose])

  // Update parent when query changes
  useEffect(() => {
    if (onQueryChange) {
      onQueryChange(query)
    }
  }, [query, onQueryChange])

  // Clear highlights on unmount
  useEffect(() => {
    return () => {
      if (editorView) {
        import('./searchHighlighter.js').then(({ clearSearch }) => {
          try {
            editorView.dispatch({ effects: clearSearch.of() })
          } catch (e) {
            // Ignore errors if view is already destroyed
          }
        })
      }
    }
  }, [editorView])

  // Focus input on mount and auto-fill
  useEffect(() => {
    if (editorView) {
      const selection = editorView.state.selection.main
      const selectedText = editorView.state.doc.sliceString(selection.from, selection.to)
      if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
        setQuery(selectedText)
      }
    }
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  const buildSearchPattern = (searchQuery) => {
    let searchText = searchQuery
    if (!useRegex) {
      searchText = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    if (wholeWord) {
      searchText = `\\b${searchText}\\b`
    }
    return searchText
  }

  // --- Search Logic ---
  useEffect(() => {
    if (!editorView || !editorView.state) return

    const runSearch = async () => {
      if (!query) {
        setCurrentMatch(0)
        setTotalMatches(0)
        try {
          const { clearSearch } = await import('./searchHighlighter.js')
          editorView.dispatch({ effects: clearSearch.of() })
        } catch (e) {
          console.warn(e)
        }
        return
      }

      try {
        const searchText = buildSearchPattern(query)
        const flags = caseSensitive ? 'g' : 'gi'
        const regex = new RegExp(searchText, flags)

        const text = editorView.state.doc.toString()
        const matches = text.match(regex)
        const matchCount = matches ? matches.length : 0

        setTotalMatches(matchCount)

        if (matchCount === 0) {
          setCurrentMatch(0)
        } else if (currentMatch === 0 || currentMatch > matchCount) {
          setCurrentMatch(1)
        }

        const { setSearchQuery } = await import('./searchHighlighter.js')
        editorView.dispatch({
          effects: setSearchQuery.of({ query: searchText, caseSensitive, useRegex: true })
        })
      } catch (e) {
        console.warn('Search error:', e)
        setTotalMatches(0)
        setCurrentMatch(0)
      }
    }

    runSearch()
  }, [query, caseSensitive, wholeWord, useRegex, editorView])

  // --- Replace Logic ---
  const replaceCurrent = () => {
    if (totalMatches === 0 || !editorView) return

    try {
      const searchText = buildSearchPattern(query)
      const flags = caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(searchText, flags)
      const text = editorView.state.doc.toString()

      let match
      let count = 0
      while ((match = regex.exec(text)) !== null) {
        count++
        if (count === currentMatch) {
          const from = match.index
          const to = match.index + match[0].length

          editorView.dispatch({
            changes: { from, to, insert: replaceQuery }
          })
          break
        }
      }
    } catch (e) {
      console.error('Replace failed', e)
    }
  }

  const replaceAll = () => {
    if (totalMatches === 0 || !editorView) return
    try {
      const searchText = buildSearchPattern(query)
      const flags = caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(searchText, flags)
      const text = editorView.state.doc.toString()

      const changes = []
      let match
      while ((match = regex.exec(text)) !== null) {
        changes.push({
          from: match.index,
          to: match.index + match[0].length,
          insert: replaceQuery
        })
      }

      if (changes.length > 0) {
        editorView.dispatch({ changes })
      }
    } catch (e) {
      console.error('Replace All failed', e)
    }
  }

  // --- Handlers ---
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) handlePrevious()
      else handleNext()
    }
  }

  const handleReplaceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) replaceAll()
      else replaceCurrent()
    }
  }

  const handleNext = () => {
    if (totalMatches > 0) {
      const newMatch = currentMatch >= totalMatches ? 1 : currentMatch + 1
      setCurrentMatch(newMatch)
      highlightAndScrollToMatch(newMatch)
    }
  }

  const handlePrevious = () => {
    if (totalMatches > 0) {
      const newMatch = currentMatch <= 1 ? totalMatches : currentMatch - 1
      setCurrentMatch(newMatch)
      highlightAndScrollToMatch(newMatch)
    }
  }

  const highlightAndScrollToMatch = async (matchIndex) => {
    if (!editorView || !editorView.state || !query) return
    try {
      const searchText = buildSearchPattern(query)
      const flags = caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(searchText, flags)
      const text = editorView.state.doc.toString()

      let match
      let count = 0
      let matchPosition = null

      while ((match = regex.exec(text)) !== null) {
        count++
        if (count === matchIndex) {
          matchPosition = { from: match.index, to: match.index + match[0].length }
          break
        }
      }

      const { setCurrentMatch: setCurrentMatchEffect } = await import('./searchHighlighter.js')
      editorView.dispatch({
        effects: setCurrentMatchEffect.of({
          query: searchText,
          caseSensitive,
          useRegex: true,
          currentMatchIndex: matchIndex
        })
      })

      if (matchPosition) {
        editorView.dispatch({
          effects: EditorView.scrollIntoView(matchPosition.from, { y: 'center', yMargin: 50 })
        })
      }
    } catch (e) {
      console.warn('Highlight scroll error:', e)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className="search-panel-widget absolute top-1 right-8 z-[1001] flex flex-col p-2 gap-1.5"
      style={{ width: '400px' }}
    >
      {/* FIND ROW */}
      <div className="flex items-center gap-1.5 h-8">
        {/* Toggle Replace Arrow */}
        <button
          onClick={() => setIsReplaceOpen(!isReplaceOpen)}
          className={`shrink-0 flex items-center justify-center w-6 h-8 rounded transition-colors ml-0.5 ${
            isReplaceOpen ? 'rotate-90' : ''
          } hover:bg-[var(--color-bg-tertiary)]`}
          title="Toggle Replace"
        >
          <ChevronRight size={14} className="opacity-60" />
        </button>

        {/* Input Area Group */}
        <div className="flex-1 flex items-center h-full px-2 rounded search-panel-input focus-within:ring-1 focus-within:ring-[var(--color-accent-primary)] transition-all overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] py-1 placeholder:opacity-50"
            placeholder="Find"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            style={{ color: 'inherit' }}
          />

          {/* Inline Metrics (Fixed width to prevent jump) */}
          <div
            className="shrink-0 flex items-center h-full text-[11px] opacity-60 select-none font-mono justify-end mr-1"
            style={{ width: '50px' }}
          >
            {query && totalMatches > 0 ? `${currentMatch}/${totalMatches}` : query ? '0/0' : ''}
          </div>

          {/* Options Group */}
          <div className="flex items-center gap-0.5 border-l border-[var(--color-border)] pl-1 h-6">
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={`p-1 rounded flex items-center justify-center transition-colors ${
                caseSensitive
                  ? 'text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/15'
                  : 'opacity-40 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)]'
              }`}
              title="Match Case"
            >
              <CaseSensitive size={14} />
            </button>
            <button
              onClick={() => setWholeWord(!wholeWord)}
              className={`p-1 rounded flex items-center justify-center transition-colors ${
                wholeWord
                  ? 'text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/15'
                  : 'opacity-40 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)]'
              }`}
              title="Match Whole Word"
            >
              <WholeWord size={14} />
            </button>
            <button
              onClick={() => setUseRegex(!useRegex)}
              className={`p-1 rounded flex items-center justify-center transition-colors ${
                useRegex
                  ? 'text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/15'
                  : 'opacity-40 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)]'
              }`}
              title="Use Regular Expression"
            >
              <Regex size={14} />
            </button>
          </div>
        </div>

        {/* Navigation Group - Fixed Width */}
        <div className="flex items-center gap-0.5 shrink-0 w-[84px] justify-end h-full">
          <button
            onClick={handlePrevious}
            disabled={!totalMatches}
            className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] disabled:opacity-20"
            title="Previous Match (Shift+Enter)"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={handleNext}
            disabled={!totalMatches}
            className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] disabled:opacity-20"
            title="Next Match (Enter)"
          >
            <ChevronDown size={16} />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] opacity-60 hover:opacity-100 ml-0.5"
            title="Close (Escape)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* REPLACE ROW */}
      <AnimatePresence>
        {isReplaceOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1.5 h-8">
              <div className="w-6 shrink-0 ml-0.5" /> {/* Arrow Spacer */}
              <div className="flex-1 flex items-center h-full px-2 rounded search-panel-input focus-within:ring-1 focus-within:ring-[var(--color-accent-primary)] transition-all overflow-hidden">
                <input
                  ref={replaceInputRef}
                  type="text"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] py-1 placeholder:opacity-50"
                  placeholder="Replace"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  onKeyDown={handleReplaceKeyDown}
                  style={{ color: 'inherit' }}
                />

                {/* Visual parity spacer to match Find metrics */}
                <div style={{ width: '50px' }} className="shrink-0 mr-1" />

                {/* Actions Group - Mirrored Style */}
                <div className="flex items-center gap-0.5 border-l border-[var(--color-border)] pl-1 h-6">
                  <button
                    onClick={replaceCurrent}
                    disabled={!totalMatches}
                    className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] disabled:opacity-20"
                    title="Replace"
                  >
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={replaceAll}
                    disabled={!totalMatches}
                    className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] disabled:opacity-20"
                    title="Replace All"
                  >
                    <CopyCheck size={14} />
                  </button>
                  {/* Empty spacer to match find button count (3 icons vs 2) */}
                  <div className="w-[22px]" />
                </div>
              </div>
              <div className="w-[84px] shrink-0" /> {/* Nav Group Spacer */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

SearchPanel.propTypes = {
  editorView: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  initialQuery: PropTypes.string,
  onQueryChange: PropTypes.func,
  focusTrigger: PropTypes.oneOfType([PropTypes.number, PropTypes.object])
}

export default SearchPanel
