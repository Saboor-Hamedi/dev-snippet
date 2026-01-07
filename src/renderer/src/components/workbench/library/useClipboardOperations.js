import { useCallback } from 'react'

/**
 * useClipboardOperations - Handles copy/cut/paste operations
 * 
 * This hook manages:
 * - Copy snippets and folders
 * - Cut snippets and folders
 * - Paste with duplicate handling
 * - Select all functionality
 */
export const useClipboardOperations = ({
  selectedIds,
  selectedFolderId,
  snippets,
  folders,
  clipboard,
  setClipboard,
  setSelectedIds,
  moveSnippet,
  moveFolder,
  saveSnippet,
  saveFolder,
  showToast
}) => {
  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return

    const items = selectedIds
      .map((id) => {
        const snippet = snippets.find((s) => s.id === id)
        if (snippet) return { id, type: 'snippet', data: snippet }

        const folder = folders.find((f) => f.id === id)
        if (folder) return { id, type: 'folder', data: folder }

        return null
      })
      .filter(Boolean)

    if (items.length > 0) {
      setClipboard({ type: 'copy', items })
      showToast(`Copied ${items.length} item${items.length > 1 ? 's' : ''}`, 'success')
    }
  }, [selectedIds, snippets, folders, setClipboard, showToast])

  const handleCut = useCallback(() => {
    if (selectedIds.length === 0) return

    const items = selectedIds
      .map((id) => {
        const snippet = snippets.find((s) => s.id === id)
        if (snippet) return { id, type: 'snippet', data: snippet }

        const folder = folders.find((f) => f.id === id)
        if (folder) return { id, type: 'folder', data: folder }

        return null
      })
      .filter(Boolean)

    if (items.length > 0) {
      setClipboard({ type: 'cut', items })
      showToast(`Cut ${items.length} item${items.length > 1 ? 's' : ''}`, 'success')
    }
  }, [selectedIds, snippets, folders, setClipboard, showToast])

  const handlePaste = useCallback(async () => {
    if (!clipboard || clipboard.items.length === 0) return

    const targetFolderId = selectedFolderId || null

    try {
      if (clipboard.type === 'cut') {
        // Move existing items
        for (const item of clipboard.items) {
          if (item.type === 'snippet') {
            await moveSnippet(item.id, targetFolderId)
          } else if (item.type === 'folder') {
            await moveFolder(item.id, targetFolderId)
          }
        }
        setClipboard(null)
        setSelectedIds([])
        const destinationName = targetFolderId
          ? folders.find((f) => f.id === targetFolderId)?.name || 'Unknown Folder'
          : 'Root'
        showToast(
          `Moved ${clipboard.items.length} item${clipboard.items.length > 1 ? 's' : ''} to ${destinationName}`,
          'success'
        )
      } else {
        // Copy: create new items
        let successCount = 0
        for (const item of clipboard.items) {
          if (item.type === 'snippet') {
            const baseName = item.data.title || 'Untitled'
            let finalName = baseName
            let counter = 1

            while (
              snippets.some(
                (s) =>
                  (s.title || '').toLowerCase() === finalName.toLowerCase() &&
                  (s.folder_id || null) === targetFolderId
              )
            ) {
              finalName = `${baseName} (${counter})`
              counter++
            }

            const newSnippet = {
              ...item.data,
              id:
                window.crypto?.randomUUID?.() ||
                `snippet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              title: finalName,
              folder_id: targetFolderId,
              timestamp: Date.now()
            }

            await saveSnippet(newSnippet)
            successCount++
          } else if (item.type === 'folder') {
            const baseName = item.data.name || 'Untitled Folder'
            let finalName = baseName
            let counter = 1

            while (
              folders.some(
                (f) =>
                  f.name.toLowerCase() === finalName.toLowerCase() &&
                  (f.parent_id || null) === targetFolderId
              )
            ) {
              finalName = `${baseName} (${counter})`
              counter++
            }

            const newFolder = {
              ...item.data,
              id:
                window.crypto?.randomUUID?.() ||
                `folder-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: finalName,
              parent_id: targetFolderId,
              created_at: Date.now(),
              updated_at: Date.now()
            }

            await saveFolder(newFolder)
            successCount++
          }
        }
        showToast(`Pasted ${successCount} item${successCount > 1 ? 's' : ''}`, 'success')
      }
    } catch (error) {
      console.error('Paste operation failed:', error)
      showToast('Failed to paste items', 'error')
    }
  }, [
    clipboard,
    selectedFolderId,
    snippets,
    folders,
    moveSnippet,
    moveFolder,
    saveSnippet,
    saveFolder,
    setClipboard,
    setSelectedIds,
    showToast
  ])

  const handleSelectAll = useCallback(() => {
    const allItemIds = [...snippets.map((s) => s.id), ...folders.map((f) => f.id)]
    setSelectedIds(allItemIds)
    showToast(`Selected ${allItemIds.length} items`, 'info')
  }, [snippets, folders, setSelectedIds, showToast])

  return {
    handleCopy,
    handleCut,
    handlePaste,
    handleSelectAll
  }
}
