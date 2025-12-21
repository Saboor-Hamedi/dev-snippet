import { normalizeSnippet } from '../utils/snippetUtils'

export const handleRenameSnippet = async ({
  renameModal,
  saveSnippet,
  renameSnippet,
  setSelectedSnippet,
  setRenameModal,
  setIsCreatingSnippet,
  showToast
}) => {
  if (!renameModal.item) {
    if (showToast) showToast('❌ Cannot rename: No snippet selected.', 'error')
    setRenameModal({ isOpen: false, item: null })
    return
  }

  // Clean up name
  const baseName = (renameModal.newName || renameModal.item.title || '').trim() || 'Untitled'

  const updatedItem = normalizeSnippet({
    ...renameModal.item,
    title: baseName,
    is_draft: false
  })

  // Update the selected item immediately (optimistic update)
  if (setSelectedSnippet) {
    setSelectedSnippet(updatedItem)
  }

  // If nothing changed (logic might have normalized it back to original), skip
  if (renameModal.item.title === baseName) {
    // Check if we need to force save due to language change even if title is same?
    // Unlikely if we enforce MD everywhere.
    // But if title is identical, we might just close.
    // However, if the user typed "foo" and we made it "foo.md", and it was already "foo.md", then we skip.

    // Actually, let's just proceed to ensure consistency.
    // But if truly identical including language...
    if (renameModal.item.language === 'markdown') {
      if (showToast) showToast(`No changes made`, 'info')
      setRenameModal({ isOpen: false, item: null })
      setIsCreatingSnippet(false)
      return
    }
  }

  try {
    // 1. Persist to Database (This is the heavy part that triggers the spinner)
    await saveSnippet(updatedItem)

    // 2. Sync local list state (Handle ID/title swap in SnippetLibrary)
    if (typeof renameSnippet === 'function') {
      renameSnippet(updatedItem.id, updatedItem)
    }

    if (showToast) showToast('✓ Snippet renamed successfully', 'success')
  } catch (error) {
    console.error('Rename error:', error)

    if (showToast) showToast('❌ Failed to rename snippet.', 'error')

    // Rollback optimistic update
    if (setSelectedSnippet) {
      setSelectedSnippet(renameModal.item)
    }
  } finally {
    setRenameModal({ isOpen: false, item: null })
    setIsCreatingSnippet(false)
  }
}
