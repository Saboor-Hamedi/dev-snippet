import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSettings } from '../useSettingsContext'

/**
 * Custom hook for managing snippet pagination with search
 * @param {Array} snippets - All available snippets
 * @param {Function} onSearchResults - Callback when search results change (optional)
 * @returns {Object} - Pagination state and handlers
 */
export const usePagination = (snippets, onSearchResults = null) => {
  const { getSetting } = useSettings()

  // Get pagination settings
  const enablePagination = useMemo(() => {
    return getSetting('pagination.enablePagination') !== false
  }, [getSetting])

  const pageSize = useMemo(() => {
    const setting = getSetting('pagination.pageSize') || 5
    return Math.max(1, Math.min(setting, 50)) // Clamp between 1-50
  }, [getSetting])

  const autoSelectOnSearch = useMemo(() => {
    return getSetting('pagination.autoSelectOnSearch') !== false
  }, [getSetting])
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

    // Apply folder filter (removed - folders don't filter the view)

    // Sort: pinned first, then by timestamp DESC (newest first)
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return b.timestamp - a.timestamp
    })

    // If pagination is disabled, return all filtered snippets
    if (!enablePagination) {
      return {
        snippets: filtered,
        totalItems: filtered.length,
        totalPages: 1,
        currentPage: 1,
        hasSearchResults: searchQuery.trim() !== '' && filtered.length > 0,
        searchQuery,
        isSearching: searchQuery.trim() !== '',
        filteredCount: filtered.length
      }
    }

    // Calculate pagination
    const totalItems = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages))
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
      isSearching: searchQuery.trim() !== '',
      filteredCount: filtered.length
    }
  }, [snippets, searchQuery, currentPage, pageSize, enablePagination])

  // Reset to page 1 when page size changes
  // Note: We don't reset when selectedFolderId changes to preserve pagination state
  // when switching between folder and all-snippets views
  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  // Reset to page 1 when starting a new search
  useEffect(() => {
    if (searchQuery.trim()) {
      setCurrentPage(1)
    }
  }, [searchQuery])

  // Extract values for easier use
  const paginatedSnippets = filteredAndPaginatedSnippets.snippets
  const totalPages = filteredAndPaginatedSnippets.totalPages
  const hasSearchResults = filteredAndPaginatedSnippets.hasSearchResults
  const isSearching = filteredAndPaginatedSnippets.isSearching

  // Page change handler with bounds checking
  const handlePageChange = useCallback((newPage) => {
    const safePage = Math.max(1, Math.min(newPage, filteredAndPaginatedSnippets.totalPages))
    if (safePage !== currentPage && safePage >= 1 && safePage <= filteredAndPaginatedSnippets.totalPages) {
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

    // Settings
    enablePagination,

    // Actions
    handlePageChange,
    handleSearchSnippets,
    clearSearch,
    resetPagination,

    // Computed values
    hasMultiplePages: enablePagination && totalPages > 1,
    isOnFirstPage: enablePagination && currentPage === 1,
    isOnLastPage: enablePagination && currentPage === totalPages,
    canGoNext: enablePagination && currentPage < totalPages,
    canGoPrevious: enablePagination && currentPage > 1
  }
}