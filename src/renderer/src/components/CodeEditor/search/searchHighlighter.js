import { StateField, StateEffect } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'

// Effect to set search query
export const setSearchQuery = StateEffect.define()

// Effect to set current match index
export const setCurrentMatch = StateEffect.define()

// Effect to clear search
export const clearSearch = StateEffect.define()

// Search highlighter state field
export const searchHighlighter = StateField.define({
  create() {
    return { query: '', currentMatchIndex: 0, decorations: Decoration.none }
  },

  update(value, tr) {
    // Check for search effects
    for (let effect of tr.effects) {
      if (effect.is(setSearchQuery)) {
        const { query, caseSensitive, useRegex } = effect.value

        if (!query) {
          return { query: '', currentMatchIndex: 0, decorations: Decoration.none }
        }

        try {
          // Build regex
          const searchText = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const flags = caseSensitive ? 'g' : 'gi'
          const regex = new RegExp(searchText, flags)

          // Find all matches
          const decorations = []
          const text = tr.state.doc.toString()
          let match

          while ((match = regex.exec(text)) !== null) {
            const from = match.index
            const to = match.index + match[0].length

            decorations.push(
              Decoration.mark({
                class: 'cm-search-match'
              }).range(from, to)
            )
          }

          return {
            query,
            currentMatchIndex: value.currentMatchIndex,
            decorations: Decoration.set(decorations, true)
          }
        } catch (e) {
          console.warn('Search highlighting error:', e)
          return { query: '', currentMatchIndex: 0, decorations: Decoration.none }
        }
      }

      if (effect.is(setCurrentMatch)) {
        const { query, caseSensitive, useRegex, currentMatchIndex } = effect.value

        if (!query || currentMatchIndex === 0) {
          return { ...value, currentMatchIndex: 0 }
        }

        try {
          // Build regex
          const searchText = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const flags = caseSensitive ? 'g' : 'gi'
          const regex = new RegExp(searchText, flags)

          // Find all matches and mark current one differently
          const decorations = []
          const text = tr.state.doc.toString()
          let match
          let count = 0

          while ((match = regex.exec(text)) !== null) {
            count++
            const from = match.index
            const to = match.index + match[0].length

            decorations.push(
              Decoration.mark({
                class: count === currentMatchIndex ? 'cm-search-match-current' : 'cm-search-match'
              }).range(from, to)
            )
          }

          return {
            query,
            currentMatchIndex,
            decorations: Decoration.set(decorations, true)
          }
        } catch (e) {
          console.warn('Current match highlighting error:', e)
          return value
        }
      }

      if (effect.is(clearSearch)) {
        return { query: '', currentMatchIndex: 0, decorations: Decoration.none }
      }
    }

    return value
  },

  provide: (f) => EditorView.decorations.from(f, (value) => value.decorations)
})

// Base theme for search highlighting
export const searchHighlightTheme = EditorView.baseTheme({
  '.cm-search-match': {
    backgroundColor: 'rgba(255, 200, 0, 0.3)',
    borderBottom: '2px solid rgba(255, 200, 0, 0.6)',
    borderRadius: '2px'
  },
  '.cm-search-match-current': {
    backgroundColor: 'rgba(255, 150, 0, 0.5)',
    borderBottom: '2px solid rgba(255, 150, 0, 0.9)',
    borderRadius: '2px',
    boxShadow: '0 0 0 1px rgba(255, 150, 0, 0.9)'
  }
})
