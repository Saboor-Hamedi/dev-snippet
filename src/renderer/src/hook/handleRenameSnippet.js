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
    await saveSnippet(updatedItem)
    if (showToast) showToast('✓ Snippet renamed successfully', 'success')
  
  } catch (error) {
    console.error('Failed to save item after rename:', error)
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
