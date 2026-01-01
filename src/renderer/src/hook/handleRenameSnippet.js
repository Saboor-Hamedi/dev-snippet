import { normalizeSnippet } from '../utils/snippetUtils'

export const handleRenameSnippet = async ({
  renameModal,
  saveSnippet,
  renameSnippet,
  setSelectedSnippet,
  setRenameModal,
  setIsCreatingSnippet,
  showToast,
  snippets
}) => {
  if (!renameModal.item) {
    if (showToast) showToast('❌ Cannot rename: No snippet selected.', 'error')
    setRenameModal({ isOpen: false, item: null })
    return
  }

  // Clean up name
  const baseName = (renameModal.newName || renameModal.item.title || '').trim() || 'Untitled'

  // Client-Side Duplicate Check - commented out to rely on database check
  /*
  const normalize = (t) => (t || '').toLowerCase().trim().replace(/\.md$/, '')

  if (snippets) {
    const targetBase = normalize(baseName)

    const duplicate = snippets.find(
      (s) =>
        normalize(s.title) === targetBase &&
        s.id !== renameModal.item.id &&
        (s.folder_id || null) === (renameModal.item.folder_id || null)
    )
    if (duplicate) {
      if (showToast) showToast(`${baseName}: already taken`, 'error')
      // Retrieve original name to clear invalid draft state if needed?
      // Just return, keeping modal open to let user try again.
      return
    }
  }
  */

  const updatedItem = normalizeSnippet({
    ...renameModal.item,
    title: baseName,
    is_draft: false
  })

  // Update the selected item immediately (optimistic update)
  if (setSelectedSnippet) {
    setSelectedSnippet(updatedItem)
  }

  // If nothing changed, skip
  if (renameModal.item.title.trim() === baseName) {
    showToast('Snippet title unchanged', 'info')
    // Silent close
    setRenameModal({ isOpen: false, item: null })
    setIsCreatingSnippet(false)
    return
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

    if (error.message && error.message.includes('DUPLICATE_TITLE')) {
      if (showToast) showToast(`${baseName}: already taken`, 'error')
    } else {
      if (showToast) showToast('❌ Failed to rename snippet.', 'error')
    }

    // Rollback optimistic update
    if (setSelectedSnippet) {
      setSelectedSnippet(renameModal.item)
    }
  } finally {
    setRenameModal({ isOpen: false, item: null })
    setIsCreatingSnippet(false)
  }
}
