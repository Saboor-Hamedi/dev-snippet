import { create } from 'zustand'

/**
 * Sidebar Store
 * Manages UI state for the navigation sidebar, including selections and search.
 */
export const useSidebarStore = create((set) => ({
  // --- State ---
  selectedFolderId: null,
  selectedIds: [],
  searchQuery: '',
  isSidebarSelected: false, // For root level selection (no folder/snippet selected)
  editingId: null, // Virtual ID of the row currently being renamed

  // --- Actions ---
  setEditingId: (id) => set({ editingId: id }),
  setSelectedFolderId: (id) =>
    set({
      selectedFolderId: id,
      isSidebarSelected: false
    }),

  setSelectedIds: (ids) =>
    set({
      selectedIds: ids,
      isSidebarSelected: false
    }),

  setSearchQuery: (query) =>
    set({
      searchQuery: query,
      // If we search, we usually want to clear specific folder selections to show all results
      ...(query.trim() ? { selectedFolderId: null } : {})
    }),

  setSidebarSelected: (selected) =>
    set({
      isSidebarSelected: selected,
      ...(selected ? { selectedFolderId: null, selectedIds: [] } : {})
    }),

  // Add Snippet Index for WikiLinks
  snippetIndex: {}, // Map<normalizedTitle, { title, id, language }>

  updateSnippetIndex: (snippets) => {
    const newIndex = {}
    snippets.forEach((s) => {
      if (s.title) {
        // Normalize: lowercase, trim.
        // We map both "title" and "title.md" (if not present) to this snippet for easy lookup
        const normTokens = [s.title.trim().toLowerCase()]

        // If title does not end in .md, add a .md alias to the index too
        // so [[MyFile.md]] finds [[MyFile]]
        if (!normTokens[0].endsWith('.md')) {
          normTokens.push(normTokens[0] + '.md')
        }

        normTokens.forEach((key) => {
          // Priority: if an exact file exists with .md name, don't overwrite it with an alias
          if (!newIndex[key] || newIndex[key].isAlias) {
            newIndex[key] = {
              title: s.title,
              id: s.id,
              language: s.language,
              isAlias: key !== s.title.trim().toLowerCase()
            }
          }
        })
      }
    })
    set({ snippetIndex: newIndex })
  },

  // Clear all selections
  clearSelection: () =>
    set({
      selectedFolderId: null,
      selectedIds: [],
      isSidebarSelected: false
    })
}))
