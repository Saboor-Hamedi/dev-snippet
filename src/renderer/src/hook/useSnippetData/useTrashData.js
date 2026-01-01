import { useCallback } from 'react'

export const useTrashData = (showToast, trash, setTrash, setSnippets, setFolders) => {
  const loadTrash = useCallback(async () => {
    try {
      if (window.api?.getTrash) {
        const items = await window.api.getTrash()
        setTrash(items || [])
      } else {
        const items = await window.api.invoke('db:getTrash')
        setTrash(items || [])
      }
    } catch (error) {
      console.error('Trash loading error:', error)
    }
  }, [setTrash])

  const restoreItem = async (id) => {
    try {
      const item = trash.find((t) => t.id === id)
      if (!item) return

      if (item.type === 'folder') {
        if (window.api?.restoreFolder) {
          await window.api.restoreFolder(id)
        } else {
          await window.api.invoke('db:restoreFolder', id)
        }
        if (setFolders) setFolders((prev) => [item, ...prev])
      } else {
        if (window.api?.restoreSnippet) {
          await window.api.restoreSnippet(id)
        } else {
          await window.api.invoke('db:restoreSnippet', id)
        }
        if (setSnippets) setSnippets((prev) => [item, ...prev])
      }

      setTrash((prev) => prev.filter((t) => t.id !== id))
      showToast(`✓ ${item.type === 'folder' ? 'Folder' : 'Snippet'} restored`)
    } catch (error) {
      showToast('❌ Failed to restore item')
    }
  }

  const permanentDeleteItem = async (id) => {
    try {
      const item = trash.find((t) => t.id === id)
      if (!item) return

      if (item.type === 'folder') {
        if (window.api?.permanentDeleteFolder) {
          await window.api.permanentDeleteFolder(id)
        } else {
          await window.api.invoke('db:permanentDeleteFolder', id)
        }
      } else {
        if (window.api?.permanentDeleteSnippet) {
          await window.api.permanentDeleteSnippet(id)
        } else {
          await window.api.invoke('db:permanentDeleteSnippet', id)
        }
      }

      setTrash((prev) => prev.filter((t) => t.id !== id))
      showToast(`✓ ${item.type === 'folder' ? 'Folder' : 'Snippet'} permanently deleted`)
    } catch (error) {
      showToast('❌ Failed to delete permanently')
    }
  }

  return {
    loadTrash,
    restoreItem,
    permanentDeleteItem
  }
}
