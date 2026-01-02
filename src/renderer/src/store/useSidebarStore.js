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

  // --- Actions ---
  setSelectedFolderId: (id) =>
    set({
      selectedFolderId: id,
      selectedIds: [],
      isSidebarSelected: false
    }),

  setSelectedIds: (ids) =>
    set({
      selectedIds: ids,
      selectedFolderId: null,
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

  // Clear all selections
  clearSelection: () =>
    set({
      selectedFolderId: null,
      selectedIds: [],
      isSidebarSelected: false
    })
}))
