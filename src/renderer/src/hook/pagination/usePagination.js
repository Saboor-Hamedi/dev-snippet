import { useState, useEffect, useMemo, useCallback } from 'react'

/**
 * Custom hook for managing snippet pagination with search and folder filtering
 * @param {Array} snippets - All available snippets
 * @param {string|null} selectedFolderId - Currently selected folder ID
 * @param {number} pageSize - Number of items per page (default: 5)
 * @param {Function} onSearchResults - Callback when search results change (optional)
 * @returns {Object} - Pagination state and handlers
 */
export const usePagination = (snippets, selectedFolderId, pageSize = 5, onSearchResults = null) => {
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and paginate snippets based on search and folder context
  const filteredAndPaginatedSnippets = useMemo(() => {
    let filtered = [...snippets]

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(snippet =>
        (snippet.title || '').toLowerCase().includes(query) ||
        (snippet.code || '').toLowerCase().includes(query) ||
        (snippet.language || '').toLowerCase().includes(query) ||
        (Array.isArray(snippet.tags) ? snippet.tags.join(' ') : (snippet.tags || '')).toLowerCase().includes(query)
      )
    }

    // Apply folder filter
    if (selectedFolderId) {
      filtered = filtered.filter(snippet => snippet.folder_id === selectedFolderId)
    }

    // Sort: pinned first, then by timestamp DESC (newest first)
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return b.timestamp - a.timestamp
    })

    // Calculate pagination
    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages))
    const startIndex = (safeCurrentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedItems = filtered.slice(startIndex, endIndex)

    return {
      snippets: paginatedItems,
      totalItems,
      totalPages,
      currentPage: safeCurrentPage,
      hasSearchResults: searchQuery.trim() !== '' && filtered.length > 0,
      searchQuery,
      isSearching: searchQuery.trim() !== ''
    }
  }, [snippets, searchQuery, selectedFolderId, currentPage, pageSize])

  // Call onSearchResults callback when search results change
  useEffect(() => {
    if (onSearchResults && searchQuery.trim()) {
      const filtered = snippets.filter(snippet =>
        (snippet.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (snippet.code || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (snippet.language || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (Array.isArray(snippet.tags) ? snippet.tags.join(' ') : (snippet.tags || '')).toLowerCase().includes(searchQuery.toLowerCase().trim())
      ).filter(snippet => !selectedFolderId || snippet.folder_id === selectedFolderId)

      onSearchResults(filtered)
    }
  }, [searchQuery, snippets, selectedFolderId, onSearchResults])

  // Update current page when filters change
  useEffect(() => {
    if (currentPage !== filteredAndPaginatedSnippets.currentPage) {
      setCurrentPage(filteredAndPaginatedSnippets.currentPage)
    }
  }, [filteredAndPaginatedSnippets.currentPage, currentPage])

  // Extract values for easier use
  const paginatedSnippets = filteredAndPaginatedSnippets.snippets
  const totalPages = filteredAndPaginatedSnippets.totalPages
  const hasSearchResults = filteredAndPaginatedSnippets.hasSearchResults
  const isSearching = filteredAndPaginatedSnippets.isSearching

  // Page change handler with bounds checking
  const handlePageChange = useCallback((newPage) => {
    const safePage = Math.max(1, Math.min(newPage, filteredAndPaginatedSnippets.totalPages))
    if (safePage !== currentPage) {
      setCurrentPage(safePage)
    }
  }, [filteredAndPaginatedSnippets.totalPages, currentPage])

  // Search handler that resets to first page
  const handleSearchSnippets = useCallback((query) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }, [])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
  }, [])

  // Reset pagination state
  const resetPagination = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
  }, [])

  return {
    // Data
    paginatedSnippets,
    totalPages,
    currentPage,
    hasSearchResults,
    isSearching,
    searchQuery,

    // Actions
    handlePageChange,
    handleSearchSnippets,
    clearSearch,
    resetPagination,

    // Computed values
    hasMultiplePages: totalPages > 1,
    isOnFirstPage: currentPage === 1,
    isOnLastPage: currentPage === totalPages,
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1
  }
}