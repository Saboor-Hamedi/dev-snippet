import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Search, X, ChevronUp, ChevronDown, CaseSensitive, Regex, WholeWord } from 'lucide-react'
import { EditorView } from '@codemirror/view'

/**
 * VS Code-style Search Panel
 * Compact search box positioned at top-right of editor
 */
const SearchPanel = ({ editorView, onClose, initialQuery = '', onQueryChange }) => {
  const [query, setQuery] = useState(initialQuery)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [currentMatch, setCurrentMatch] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const inputRef = useRef(null)

  // Update parent when query changes
  useEffect(() => {
    if (onQueryChange) {
      onQueryChange(query)
    }
  }, [query, onQueryChange])

  // Focus input on mount and auto-fill with selected text
  useEffect(() => {
    if (editorView) {
      // Get selected text
      const selection = editorView.state.selection.main
      const selectedText = editorView.state.doc.sliceString(selection.from, selection.to)

      // If there's selected text, use it as the search query (overrides initialQuery)
      if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
        setQuery(selectedText)
      }
    }

    // Focus the input
    inputRef.current?.focus()
    // Select all text in input for easy replacement
    inputRef.current?.select()
  }, [])

  // Define handleClose before it's used
  const handleClose = () => {
    onClose()
    if (editorView && editorView.focus) {
      editorView.focus()
    }
  }

  // Helper: Build search pattern (DRY - used in multiple places)
  const buildSearchPattern = (searchQuery) => {
    let searchText = searchQuery

    // Escape special regex characters if not using regex mode
    if (!useRegex) {
      searchText = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    // Add word boundary if whole word is enabled
    if (wholeWord) {
      searchText = `\\b${searchText}\\b`
    }

    return searchText
  }

  // Handle search and highlighting
  useEffect(() => {
    if (!editorView || !editorView.state) return

    const runSearch = async () => {
      if (!query) {
        setCurrentMatch(0)
        setTotalMatches(0)
        // Clear highlighting
        try {
          const { clearSearch } = await import('./searchHighlighter.js')
          editorView.dispatch({
            effects: clearSearch.of()
          })
        } catch (e) {
          console.warn('Clear search error:', e)
        }
        return
      }

      try {
        // Build search pattern
        const searchText = buildSearchPattern(query)
        const flags = caseSensitive ? 'g' : 'gi'
        const regex = new RegExp(searchText, flags)

        // Count matches
        const text = editorView.state.doc.toString()
        const matches = text.match(regex)
        const matchCount = matches ? matches.length : 0

        setTotalMatches(matchCount)

        // Reset currentMatch if it's out of bounds or this is a new search
        if (matchCount === 0) {
          setCurrentMatch(0)
        } else if (currentMatch === 0 || currentMatch > matchCount) {
          setCurrentMatch(1)
        }

        // Trigger highlighting
        const { setSearchQuery } = await import('./searchHighlighter.js')
        editorView.dispatch({
          effects: setSearchQuery.of({ query: searchText, caseSensitive, useRegex: true })
        })
      } catch (e) {
        // Invalid regex or other error
        console.warn('Search error:', e)
        setTotalMatches(0)
        setCurrentMatch(0)
      }
    }

    runSearch()
  }, [query, caseSensitive, wholeWord, useRegex, editorView])

  // Handle keyboard shortcuts (global, not just on input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }

    // Listen globally
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Clear highlighting when component unmounts (search closes)
  useEffect(() => {
    return async () => {
      if (editorView && editorView.state) {
        try {
          const { clearSearch } = await import('./searchHighlighter.js')
          editorView.dispatch({
            effects: clearSearch.of()
          })
        } catch (e) {
          console.warn('Clear search on unmount error:', e)
        }
      }
    }
  }, [editorView])

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        handlePrevious()
      } else {
        handleNext()
      }
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
    if (!editorView || !editorView.state || !query || matchIndex === 0) return

    try {
      const searchText = buildSearchPattern(query)
      const flags = caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(searchText, flags)
      const text = editorView.state.doc.toString()

      // Find the position of the nth match for scrolling
      let match
      let count = 0
      let matchPosition = null

      while ((match = regex.exec(text)) !== null) {
        count++
        if (count === matchIndex) {
          matchPosition = {
            from: match.index,
            to: match.index + match[0].length
          }
          break
        }
      }

      // Update highlighting to show current match differently
      const { setCurrentMatch: setCurrentMatchEffect } = await import('./searchHighlighter.js')
      editorView.dispatch({
        effects: setCurrentMatchEffect.of({
          query: searchText,
          caseSensitive,
          useRegex: true,
          currentMatchIndex: matchIndex
        })
      })

      // Scroll to the match position
      if (matchPosition) {
        editorView.dispatch({
          effects: EditorView.scrollIntoView(matchPosition.from, {
            y: 'center',
            yMargin: 50
          })
        })
      }
    } catch (e) {
      console.warn('Highlight and scroll error:', e)
    }
  }

  return (
    <div
      className="absolute top-1 right-3 z-50 flex items-center gap-0.5 rounded shadow-lg px-1.5 py-1 border transition-all duration-300"
      style={{
        minWidth: '280px',
        maxWidth: '320px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-primary)'
      }}
    >
      {/* Search Icon */}
      <Search size={12} className="opacity-60 flex-shrink-0" />

      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Find"
        className="flex-1 bg-transparent outline-none px-1 py-0.5"
        style={{
          fontSize: '12px',
          minWidth: '80px',
          color: 'var(--color-text-primary)',
          '::placeholder': { color: 'var(--color-text-tertiary)' }
        }}
      />

      {/* Match Counter - always reserve space */}
      <span
        className="opacity-60 px-1 whitespace-nowrap"
        style={{ fontSize: '10px', minWidth: '60px', textAlign: 'right' }}
      >
        {query
          ? totalMatches > 0
            ? `${currentMatch} of ${totalMatches}`
            : 'No results'
          : 'No results'}
      </span>

      {/* Navigation Buttons */}
      <div
        className="flex items-center gap-0.5 border-l pl-0.5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={handlePrevious}
          disabled={totalMatches === 0}
          className="p-0.5 hover:bg-[var(--hover-bg)] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={handleNext}
          disabled={totalMatches === 0}
          className="p-0.5 hover:bg-[var(--hover-bg)] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next match (Enter)"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Toggle Options */}
      <div
        className="flex items-center gap-0.5 border-l pl-0.5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={`p-0.5 rounded transition-colors ${
            caseSensitive
              ? 'bg-[var(--color-accent-primary)] text-white'
              : 'hover:bg-[var(--hover-bg)] opacity-60'
          }`}
          title="Match Case (Alt+C)"
        >
          <CaseSensitive size={12} />
        </button>
        <button
          onClick={() => setWholeWord(!wholeWord)}
          className={`p-0.5 rounded transition-colors ${
            wholeWord
              ? 'bg-[var(--color-accent-primary)] text-white'
              : 'hover:bg-[var(--hover-bg)] opacity-60'
          }`}
          title="Match Whole Word (Alt+W)"
        >
          <WholeWord size={12} />
        </button>
        <button
          onClick={() => setUseRegex(!useRegex)}
          className={`p-0.5 rounded transition-colors ${
            useRegex
              ? 'bg-[var(--color-accent-primary)] text-white'
              : 'hover:bg-[var(--hover-bg)] opacity-60'
          }`}
          title="Use Regular Expression (Alt+R)"
        >
          <Regex size={12} />
        </button>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="p-0.5 hover:bg-[var(--hover-bg)] rounded transition-colors ml-auto opacity-60 hover:opacity-100"
        title="Close (Escape)"
      >
        <X size={12} />
      </button>
    </div>
  )
}

SearchPanel.propTypes = {
  editorView: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  initialQuery: PropTypes.string,
  onQueryChange: PropTypes.func
}

export default SearchPanel
