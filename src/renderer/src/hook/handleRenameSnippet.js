import { getLanguageByExtension } from '../components/language/languageRegistry.js'
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
  // Auto detect language based on new name's extension
  let baseName = (renameModal.newName || renameModal.item.title || '').trim() || 'Untitled'
  // Preserve extension logic for language update
  const hasExt = /\.[^\.\s]+$/.test(baseName)
  const extMap = {
    md: 'md'
    //  Add more extensions and their corresponding languages as needed
  }
  // This is a helper to auto-detect language from extension
  const getExtensionName = (name) => {
    const m = name.match(/\.([^.\/\\\s]+)$/)
    return m ? m[1].toLowerCase() : null
  }
  // This perserve the original language if no extension change
  let lang = renameModal.item.language

  const ext = getExtensionName(baseName)
  if (ext) {
    const langFromExt = getLanguageByExtension(baseName)
    if (langFromExt) {
      lang = langFromExt
    }
  }

  // Set is_draft based on the original snippet
  const updatedItem = {
    ...renameModal.item,
    title: baseName,
    language: lang,
    is_draft: false // Always set to false when renaming/finalizing
  }
  // Update the selected item immediately (optimistic update)
  if (setSelectedSnippet) {
    setSelectedSnippet(updatedItem)
  }
  // If nothing changed, skip saving and close modal
  if (renameModal.item.title === baseName) {
    if (showToast) showToast(`Not renamed: '${baseName}'`, 'info')
    setRenameModal({ isOpen: false, item: null })
    setIsCreatingSnippet(false)
    return
  }

  try {
    // Always set is_draft to false and update in place
    if (typeof renameSnippet === 'function') {
      renameSnippet(updatedItem.id, updatedItem);
    } else {
      await saveSnippet(updatedItem);
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
