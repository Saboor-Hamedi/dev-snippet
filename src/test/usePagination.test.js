import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../usePagination'

// Mock the settings context
vi.mock('../useSettingsContext', () => ({
  useSettings: () => ({
    getSetting: vi.fn((key) => {
      if (key === 'pagination.enablePagination') return true
      if (key === 'pagination.pageSize') return 5
      if (key === 'pagination.autoSelectOnSearch') return true
      return undefined
    })
  })
}))

describe('usePagination', () => {
  const mockSnippets = [
    { id: '1', title: 'Snippet 1', code: 'code1', timestamp: 1000, is_pinned: 0, folder_id: null },
    { id: '2', title: 'Snippet 2', code: 'code2', timestamp: 2000, is_pinned: 0, folder_id: null },
    { id: '3', title: 'Snippet 3', code: 'code3', timestamp: 3000, is_pinned: 0, folder_id: null },
    { id: '4', title: 'Snippet 4', code: 'code4', timestamp: 4000, is_pinned: 0, folder_id: null },
    { id: '5', title: 'Snippet 5', code: 'code5', timestamp: 5000, is_pinned: 0, folder_id: null },
    { id: '6', title: 'Snippet 6', code: 'code6', timestamp: 6000, is_pinned: 0, folder_id: null },
  ]

  it('should paginate snippets correctly', () => {
    const { result } = renderHook(() => usePagination(mockSnippets, null, vi.fn()))

    expect(result.current.paginatedSnippets).toHaveLength(5)
    expect(result.current.totalPages).toBe(2)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.hasMultiplePages).toBe(true)
  })

  it('should handle page changes correctly', () => {
    const { result } = renderHook(() => usePagination(mockSnippets, null, vi.fn()))

    act(() => {
      result.current.handlePageChange(2)
    })

    expect(result.current.currentPage).toBe(2)
    expect(result.current.paginatedSnippets).toHaveLength(1) // Only 1 item on page 2
  })

  it('should filter snippets by search query', () => {
    const { result } = renderHook(() => usePagination(mockSnippets, null, vi.fn()))

    act(() => {
      result.current.handleSearchSnippets('Snippet 1')
    })

    expect(result.current.paginatedSnippets).toHaveLength(1)
    expect(result.current.paginatedSnippets[0].title).toBe('Snippet 1')
    expect(result.current.hasSearchResults).toBe(true)
  })

  it('should reset to page 1 when searching', () => {
    const { result } = renderHook(() => usePagination(mockSnippets, null, vi.fn()))

    // Go to page 2 first
    act(() => {
      result.current.handlePageChange(2)
    })
    expect(result.current.currentPage).toBe(2)

    // Search should reset to page 1
    act(() => {
      result.current.handleSearchSnippets('test')
    })
    expect(result.current.currentPage).toBe(1)
  })

  it('should handle empty search results', () => {
    const { result } = renderHook(() => usePagination(mockSnippets, null, vi.fn()))

    act(() => {
      result.current.handleSearchSnippets('nonexistent')
    })

    expect(result.current.paginatedSnippets).toHaveLength(0)
    expect(result.current.hasSearchResults).toBe(false)
  })

  it('should disable pagination when setting is false', () => {
    // Mock settings to disable pagination
    vi.mocked(vi.importMock('../useSettingsContext')).useSettings.mockReturnValue({
      getSetting: vi.fn((key) => {
        if (key === 'pagination.enablePagination') return false
        if (key === 'pagination.pageSize') return 5
        return undefined
      })
    })

    const { result } = renderHook(() => usePagination(mockSnippets, null, vi.fn()))

    expect(result.current.paginatedSnippets).toHaveLength(6) // All snippets
    expect(result.current.totalPages).toBe(1)
    expect(result.current.hasMultiplePages).toBe(false)
  })
})