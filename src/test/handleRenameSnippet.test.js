import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleRenameSnippet } from '../renderer/src/hook/handleRenameSnippet.js'

// Mock the language registry
vi.mock('../renderer/src/components/language/languageRegistry.js', () => ({
  getLanguageByExtension: vi.fn((filename) => {
    const ext = filename.match(/\.([^.]+)$/)?.[1]
    const langMap = {
      js: 'javascript',
      py: 'python',
      md: 'markdown',
      css: 'css',
      html: 'html',
      json: 'json'
    }
    return langMap[ext] || null
  })
}))

describe('handleRenameSnippet', () => {
  let mockSaveSnippet
  let mockSetSelectedSnippet
  let mockSetRenameModal
  let mockSetIsCreatingSnippet
  let mockShowToast

  beforeEach(() => {
    mockSaveSnippet = vi.fn()
    mockSetSelectedSnippet = vi.fn()
    mockSetRenameModal = vi.fn()
    mockSetIsCreatingSnippet = vi.fn()
    mockShowToast = vi.fn()
  })

  it('renames snippet with new extension', async () => {
    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'old.js', language: 'javascript', code: 'test' },
      newName: 'new.py'
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    expect(mockSaveSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'new.py',
        language: 'python',
        is_draft: false
      })
    )
    expect(mockShowToast).toHaveBeenCalledWith('✓ Snippet renamed successfully', 'success')
  })

  it('preserves language when renaming without extension', async () => {
    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'old.js', language: 'javascript', code: 'test' },
      newName: 'newname'
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    expect(mockSaveSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'newname',
        language: 'javascript' // Should preserve original language
      })
    )
  })

  it('updates language when extension changes', async () => {
    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'script.js', language: 'javascript', code: 'test' },
      newName: 'script.md'
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    expect(mockSaveSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'markdown'
      })
    )
  })

  it('uses original title when newName is empty', async () => {
    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'old.js', language: 'javascript', code: 'test' },
      newName: ''
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    // Should skip saving since name didn't change
    expect(mockSaveSnippet).not.toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith("Not renamed: 'old.js'", 'info')
  })

  it('trims whitespace from new name', async () => {
    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'old.js', language: 'javascript', code: 'test' },
      newName: '  newfile.js  '
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    expect(mockSaveSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'newfile.js'
      })
    )
  })

  it('skips saving when name unchanged', async () => {
    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'same.js', language: 'javascript', code: 'test' },
      newName: 'same.js'
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    expect(mockSaveSnippet).not.toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith("Not renamed: 'same.js'", 'info')
  })

  it('handles missing item gracefully', async () => {
    const renameModal = {
      isOpen: true,
      item: null,
      newName: 'test.js'
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    expect(mockSaveSnippet).not.toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith('❌ Cannot rename: No snippet selected.', 'error')
  })

  it('handles save error and rolls back', async () => {
    mockSaveSnippet.mockRejectedValue(new Error('Save failed'))

    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'old.js', language: 'javascript', code: 'test' },
      newName: 'new.js'
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    // Should rollback to original item
    expect(mockSetSelectedSnippet).toHaveBeenCalledWith(renameModal.item)
    expect(mockShowToast).toHaveBeenCalledWith('❌ Failed to rename snippet.', 'error')
  })

  it('sets is_draft to false when renaming', async () => {
    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'draft.js', language: 'javascript', code: 'test', is_draft: true },
      newName: 'final.js'
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    expect(mockSaveSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        is_draft: false
      })
    )
  })

  it('closes modal after successful rename', async () => {
    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'old.js', language: 'javascript', code: 'test' },
      newName: 'new.js'
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    expect(mockSetRenameModal).toHaveBeenCalledWith({ isOpen: false, item: null })
    expect(mockSetIsCreatingSnippet).toHaveBeenCalledWith(false)
  })

  it('handles unknown file extensions', async () => {
    const renameModal = {
      isOpen: true,
      item: { id: '1', title: 'old.js', language: 'javascript', code: 'test' },
      newName: 'file.xyz'
    }

    await handleRenameSnippet({
      renameModal,
      saveSnippet: mockSaveSnippet,
      setSelectedSnippet: mockSetSelectedSnippet,
      setRenameModal: mockSetRenameModal,
      setIsCreatingSnippet: mockSetIsCreatingSnippet,
      showToast: mockShowToast
    })

    // Should preserve original language for unknown extensions
    expect(mockSaveSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'file.xyz',
        language: 'javascript' // Preserves original
      })
    )
  })
})
