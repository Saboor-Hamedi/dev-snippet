export const handleRenameSnippet = async ({
  renameModal,
  saveSnippet,
  setSelectedSnippet,
  setRenameModal,
  setIsCreatingSnippet,
  showToast
}) => {
  if (!renameModal.item) {
    if (showToast) showToast('❌ Cannot rename: No snippet selected.', 'error')
    setRenameModal({ isOpen: false, item: null })
    return
  } // Prevent multiple renames at once
  let baseName = (renameModal.newName || renameModal.item.title || '').trim() || 'Untitled'
  // Preserve extension logic for language update
  const hasExt = /\.[^\.\s]+$/.test(baseName)
  const extMap = {
    md: 'md'
    //  Add more extensions and their corresponding languages as needed
  }
  let lang = renameModal.item.language
  if (hasExt) {
    const ext = baseName.split('.').pop().toLowerCase()
    lang = extMap[ext] || lang
  } else {
    lang = 'md'
  }

  const updatedItem = {
    ...renameModal.item,
    title: baseName,
    language: lang
  }
  // Update the selected item immediately (optimistic update)
  if (setSelectedSnippet) {
    setSelectedSnippet(updatedItem)
  }
  // If nothing changed, skip saving and close modal
  if (renameModal.item.title === baseName) {
    if (showToast) showToast('No changes', 'info')
    setRenameModal({ isOpen: false, item: null })
    setIsCreatingSnippet(false)
    return
  }

  try {
    // Handle draft snippets that need proper IDs
    const isNewDraft = String(updatedItem.id).startsWith('draft-')
    if (isNewDraft) {
      // For new drafts, create a proper ID
      updatedItem.id = Date.now().toString()
      updatedItem.is_draft = false
    }
    
    await saveSnippet(updatedItem)
    
    // Update selectedSnippet with the final saved item (important for drafts)
    if (setSelectedSnippet && isNewDraft) {
      setSelectedSnippet(updatedItem)
    }
    
    if (showToast) showToast('✓ Snippet renamed successfully', 'success')
  
  } catch (error) {
    if (showToast) showToast('❌ Failed to rename snippet.', 'error')
    // Revert the optimistic update if save failed
    if (setSelectedSnippet) {
      setSelectedSnippet(renameModal.item)
    }
  } finally {
    setRenameModal({ isOpen: false, item: null })
    setIsCreatingSnippet(false)
  }
}
