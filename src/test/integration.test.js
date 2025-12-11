import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { useSnippetData } from '../renderer/src/hook/useSnippetData.js'
import { handleRenameSnippet } from '../renderer/src/hook/handleRenameSnippet.js'
import { extractTags } from '../renderer/src/hook/extractTags.js'

// Mock dependencies
vi.mock('../renderer/src/hook/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() })
}))

const mockApi = {
  getSnippets: vi.fn(),
  saveSnippet: vi.fn(),
  deleteSnippet: vi.fn()
}

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.window.api = mockApi
  })

  describe('Complete Snippet Lifecycle', () => {
    it('creates, edits, renames, and deletes a snippet', async () => {
      mockApi.getSnippets.mockResolvedValue([])
      mockApi.saveSnippet.mockResolvedValue()
      mockApi.deleteSnippet.mockResolvedValue()

      const { result } = renderHook(() => useSnippetData())

      // Wait for initial load
      await waitFor(() => expect(result.current.snippets).toEqual([]))

      // 1. CREATE: Add new snippet (Direct save allows .js if bypassed)
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
          title: 'test.js',
          is_draft: false
        })
      )
      expect(result.current.snippets).toHaveLength(1)

      // 2. EDIT: Update snippet content
      const updatedSnippet = {
        ...newSnippet,
        code: 'console.log("updated")'
      }

      await act(async () => {
        await result.current.saveSnippet(updatedSnippet)
      })

      expect(result.current.snippets[0].code).toBe('console.log("updated")')

      // 3. RENAME: Change filename and language (Uses handleRenameSnippet which enforces .md)
      const mockSetters = {
        setSelectedSnippet: vi.fn(),
        setRenameModal: vi.fn(),
        setIsCreatingSnippet: vi.fn()
      }

      await handleRenameSnippet({
        renameModal: {
          item: result.current.snippets[0],
          newName: 'script.py' // Input
        },
        saveSnippet: result.current.saveSnippet,
        ...mockSetters,
        showToast: vi.fn()
      })

      // EXPECT ENFORCED MARKDOWN
      expect(mockApi.saveSnippet).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'script.md', // Forced .md
          language: 'markdown' // Forced markdown
        })
      )

      // 4. DELETE: Remove snippet
      await act(async () => {
        await result.current.deleteItem('1')
      })

      expect(mockApi.deleteSnippet).toHaveBeenCalledWith('1')
      expect(result.current.snippets).toHaveLength(0)
    })
  })

  describe('Search and Filter Workflow', () => {
    it('searches snippets by tags and filters results', async () => {
      const snippetsWithTags = [
        { id: '1', title: 'api.js', code: '#javascript #api code', language: 'javascript' },
        { id: '2', title: 'utils.py', code: '#python #utils code', language: 'python' },
        { id: '3', title: 'styles.css', code: '#css #design code', language: 'css' }
      ]

      mockApi.getSnippets.mockResolvedValue(snippetsWithTags)

      const { result } = renderHook(() => useSnippetData())

      await waitFor(() => {
        expect(result.current.snippets).toHaveLength(3)
      })

      // Extract tags from each snippet
      const snippet1Tags = extractTags(snippetsWithTags[0].code)
      const snippet2Tags = extractTags(snippetsWithTags[1].code)

      expect(snippet1Tags).toContain('javascript')
      expect(snippet1Tags).toContain('api')
      expect(snippet2Tags).toContain('python')
      expect(snippet2Tags).toContain('utils')

      // Filter by language
      const jsSnippets = result.current.snippets.filter((s) => s.language === 'javascript')
      expect(jsSnippets).toHaveLength(1)
      expect(jsSnippets[0].title).toBe('api.js')
    })
  })

  describe('Multi-Snippet Operations', () => {
    it('handles batch operations correctly', async () => {
      mockApi.getSnippets.mockResolvedValue([])
      mockApi.saveSnippet.mockResolvedValue()

      const { result } = renderHook(() => useSnippetData())

      await waitFor(() => expect(result.current.snippets).toEqual([]))

      // Create multiple snippets
      const snippets = [
        { id: '1', title: 'file1.js', code: 'code1', language: 'javascript' },
        { id: '2', title: 'file2.py', code: 'code2', language: 'python' },
        { id: '3', title: 'file3.md', code: 'code3', language: 'markdown' }
      ]

      for (const snippet of snippets) {
        await act(async () => {
          await result.current.saveSnippet(snippet)
        })
      }

      expect(result.current.snippets).toHaveLength(3)

      // Delete middle snippet
      await act(async () => {
        await result.current.deleteItem('2')
      })

      expect(result.current.snippets).toHaveLength(2)
      expect(result.current.snippets.find((s) => s.id === '2')).toBeUndefined()
    })
  })

  describe('Error Recovery', () => {
    it('handles save failures gracefully', async () => {
      mockApi.getSnippets.mockResolvedValue([])
      mockApi.saveSnippet.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useSnippetData())

      const snippet = { id: '1', title: 'test.js', code: 'code', language: 'javascript' }

      await act(async () => {
        await result.current.saveSnippet(snippet)
      })

      // Should not crash, snippets should remain empty
      expect(result.current.snippets).toEqual([])
    })

    it('handles delete failures gracefully', async () => {
      const existingSnippet = { id: '1', title: 'test.js', code: 'code', language: 'javascript' }
      mockApi.getSnippets.mockResolvedValue([existingSnippet])
      mockApi.deleteSnippet.mockRejectedValue(new Error('Delete failed'))

      const { result } = renderHook(() => useSnippetData())

      await waitFor(() => expect(result.current.snippets).toHaveLength(1))

      await act(async () => {
        await result.current.deleteItem('1')
      })

      // Snippet should still exist after failed delete
      expect(result.current.snippets).toHaveLength(1)
    })
  })

  describe('State Consistency', () => {
    it('maintains consistent state across operations', async () => {
      mockApi.getSnippets.mockResolvedValue([])
      mockApi.saveSnippet.mockResolvedValue()

      const { result } = renderHook(() => useSnippetData())

      // Create snippet
      await act(async () => {
        await result.current.saveSnippet({
          id: '1',
          title: 'test.js',
          code: 'original',
          language: 'javascript'
        })
      })

      // Select it
      act(() => {
        result.current.setSelectedSnippet(result.current.snippets[0])
      })

      expect(result.current.selectedSnippet.id).toBe('1')

      // Update it
      await act(async () => {
        await result.current.saveSnippet({
          id: '1',
          title: 'test.js',
          code: 'updated',
          language: 'javascript'
        })
      })

      // Selected snippet should be updated
      expect(result.current.selectedSnippet.code).toBe('updated')
    })
  })
})
