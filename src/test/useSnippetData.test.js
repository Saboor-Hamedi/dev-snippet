import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSnippetData } from '../renderer/src/hook/useSnippetData.js'

// Mock useToast hook
vi.mock('../renderer/src/hook/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

// Mock window.api
const mockApi = {
  getSnippets: vi.fn(),
  saveSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
  deleteProject: vi.fn()
}

describe('useSnippetData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.window.api = mockApi
  })

  afterEach(() => {
    delete global.window.api
  })

  it('initializes with empty arrays', () => {
    mockApi.getSnippets.mockResolvedValue([])

    const { result } = renderHook(() => useSnippetData())

    expect(result.current.snippets).toEqual([])
    expect(result.current.projects).toEqual([])
    expect(result.current.selectedSnippet).toBeNull()
  })

  it('loads snippets on mount', async () => {
    const mockSnippets = [
      { id: '1', title: 'test.js', code: 'console.log()' },
      { id: '2', title: 'hello.py', code: 'print()' }
    ]
    mockApi.getSnippets.mockResolvedValue(mockSnippets)

    const { result } = renderHook(() => useSnippetData())

    await waitFor(() => {
      expect(result.current.snippets).toEqual(mockSnippets)
    })

    expect(mockApi.getSnippets).toHaveBeenCalledTimes(1)
  })

  it('handles load error gracefully', async () => {
    mockApi.getSnippets.mockRejectedValue(new Error('DB error'))

    const { result } = renderHook(() => useSnippetData())

    await waitFor(() => {
      expect(result.current.snippets).toEqual([])
    })
  })

  it('saves a new snippet', async () => {
    mockApi.getSnippets.mockResolvedValue([])
    mockApi.saveSnippet.mockResolvedValue()

    const { result } = renderHook(() => useSnippetData())

    const newSnippet = {
      id: '1',
      title: 'test.js',
      code: 'console.log("hello")',
      language: 'javascript'
    }

    await act(async () => {
      await result.current.saveSnippet(newSnippet)
    })

    expect(mockApi.saveSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'test.js.md', // Extension is added
        code: 'console.log("hello")',
        is_draft: false
      })
    )

    expect(result.current.snippets).toHaveLength(1)
    expect(result.current.snippets[0].title).toBe('test.js.md') // Extension is added
  })

  it('updates an existing snippet', async () => {
    const existingSnippet = { id: '1', title: 'old.js', code: 'old code' }
    mockApi.getSnippets.mockResolvedValue([existingSnippet])
    mockApi.saveSnippet.mockResolvedValue()

    const { result } = renderHook(() => useSnippetData())

    await waitFor(() => {
      expect(result.current.snippets).toHaveLength(1)
    })

    const updatedSnippet = {
      id: '1',
      title: 'new.js',
      code: 'new code'
    }

    await act(async () => {
      await result.current.saveSnippet(updatedSnippet)
    })

    expect(result.current.snippets).toHaveLength(1)
    expect(result.current.snippets[0].title).toBe('new.js.md') // Extension is added
    // Note: code is not stored in local state for performance reasons
  })

  it('deletes a snippet', async () => {
    const mockSnippets = [
      { id: '1', title: 'test1.js', code: 'code1' },
      { id: '2', title: 'test2.js', code: 'code2' }
    ]
    mockApi.getSnippets.mockResolvedValue(mockSnippets)
    mockApi.deleteSnippet.mockResolvedValue()

    const { result } = renderHook(() => useSnippetData())

    await waitFor(() => {
      expect(result.current.snippets).toHaveLength(2)
    })

    await act(async () => {
      await result.current.deleteItem('1')
    })

    expect(mockApi.deleteSnippet).toHaveBeenCalledWith('1')
    expect(result.current.snippets).toHaveLength(1)
    expect(result.current.snippets[0].id).toBe('2')
  })

  it('selects next snippet after deleting selected one', async () => {
    const mockSnippets = [
      { id: '1', title: 'test1.js', code: 'code1' },
      { id: '2', title: 'test2.js', code: 'code2' }
    ]
    mockApi.getSnippets.mockResolvedValue(mockSnippets)
    mockApi.deleteSnippet.mockResolvedValue()

    const { result } = renderHook(() => useSnippetData())

    await waitFor(() => {
      expect(result.current.snippets).toHaveLength(2)
    })

    // Select first snippet
    act(() => {
      result.current.setSelectedSnippet(mockSnippets[0])
    })

    expect(result.current.selectedSnippet.id).toBe('1')

    // Delete selected snippet
    await act(async () => {
      await result.current.deleteItem('1')
    })

    // Should auto-select next snippet
    expect(result.current.selectedSnippet.id).toBe('2')
  })

  it('sets selected snippet to null when deleting last snippet', async () => {
    const mockSnippets = [{ id: '1', title: 'test.js', code: 'code' }]
    mockApi.getSnippets.mockResolvedValue(mockSnippets)
    mockApi.deleteSnippet.mockResolvedValue()

    const { result } = renderHook(() => useSnippetData())

    await waitFor(() => {
      expect(result.current.snippets).toHaveLength(1)
    })

    act(() => {
      result.current.setSelectedSnippet(mockSnippets[0])
    })

    await act(async () => {
      await result.current.deleteItem('1')
    })

    expect(result.current.selectedSnippet).toBeNull()
  })

  it('handles save error gracefully', async () => {
    mockApi.getSnippets.mockResolvedValue([])
    mockApi.saveSnippet.mockRejectedValue(new Error('Save failed'))

    const { result } = renderHook(() => useSnippetData())

    const snippet = { id: '1', title: 'test.js', code: 'code' }

    await expect(act(async () => {
      await result.current.saveSnippet(snippet)
    })).rejects.toThrow('Save failed')

    // Should not crash, snippets should remain empty
    expect(result.current.snippets).toEqual([])
  })

  it('handles delete error gracefully', async () => {
    const mockSnippets = [{ id: '1', title: 'test.js', code: 'code' }]
    mockApi.getSnippets.mockResolvedValue(mockSnippets)
    mockApi.deleteSnippet.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useSnippetData())

    await waitFor(() => {
      expect(result.current.snippets).toHaveLength(1)
    })

    await act(async () => {
      await result.current.deleteItem('1')
    })

    // Snippet should still exist after failed delete
    expect(result.current.snippets).toHaveLength(1)
  })

  it('marks snippets as not draft when saving', async () => {
    mockApi.getSnippets.mockResolvedValue([])
    mockApi.saveSnippet.mockResolvedValue()

    const { result } = renderHook(() => useSnippetData())

    const snippet = { id: '1', title: 'test.js', code: 'code', is_draft: true }

    await act(async () => {
      await result.current.saveSnippet(snippet)
    })

    expect(mockApi.saveSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        is_draft: false
      })
    )
  })
})
