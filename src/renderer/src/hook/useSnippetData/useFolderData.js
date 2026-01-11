import { useCallback } from 'react'

export const useFolderData = (showToast, folders, setFolders, setSnippets, setTrash) => {
  const loadFolders = useCallback(async () => {
    try {
      if (window.api?.getFolders) {
        const loadedFolders = await window.api.getFolders()
        
        // --- 🛡️ RESCUE ENGINE: Circular Reference Repair ---
        // If a user previously moved a parent into a child, they create an "Island".
        // This logic detects loops and breaks them by moving the loop-head to Root.
        if (loadedFolders && loadedFolders.length > 0) {
          const brokenFolders = []
          loadedFolders.forEach(folder => {
            const path = new Set()
            let curr = folder
            while (curr && curr.parent_id) {
              if (path.has(curr.id)) {
                brokenFolders.push(curr.id)
                break
              }
              path.add(curr.id)
              curr = loadedFolders.find(f => f.id === curr.parent_id)
            }
          })

          if (brokenFolders.length > 0) {
            console.warn('[Rescue] Detected circular references in folders:', brokenFolders)
            for (const id of brokenFolders) {
              await moveFolder(id, null)
            }
            // Re-fetch after repair to ensure consistent state
            const repairedFolders = await window.api.getFolders()
            setFolders(repairedFolders || [])
            showToast('📂 Recovered folders from a circular loop', 'success')
            return
          }
        }

        setFolders(loadedFolders || [])
      }
    } catch (error) {
      console.error('Folder loading error:', error)
    }
  }, [setFolders, showToast])

  const saveFolder = async (folder) => {
    try {
      const payload = {
        id: folder.id || `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: folder.name?.trim() || 'New Folder',
        parent_id: folder.parent_id || null,
        collapsed: !!folder.collapsed,
        sort_index: folder.sort_index ?? 0,
        created_at: folder.created_at || Date.now(),
        updated_at: Date.now()
      }

      const api = window.api
      if (api?.saveFolder) {
        await api.saveFolder(payload)
      } else if (api?.invoke) {
        await api.invoke('db:saveFolder', payload)
      }

      setFolders((prev) => {
        const exists = prev.some((f) => f.id === payload.id)
        return exists ? prev.map((f) => (f.id === payload.id ? payload : f)) : [...prev, payload]
      })

      return payload
    } catch (error) {
      showToast('❌ Failed to save folder')
      throw error
    }
  }

  const deleteFolder = async (id) => {
    try {
      const folder = folders.find((f) => f.id === id)
      if (!folder) return

      const api = window.api
      if (api?.deleteFolder) {
        await api.deleteFolder(id)
      } else {
        await api.invoke('db:deleteFolder', id)
      }

      setFolders((prev) => prev.filter((f) => f.id !== id))
      if (setTrash) {
        setTrash((prev) => [{ ...folder, type: 'folder', deleted_at: Date.now() }, ...prev])
      }
      // Note: setSnippets update is handled by the global re-fetch triggered by notifyDataChanged in main process
      showToast('✓ Folder moved to trash')
    } catch (error) {
      showToast('❌ Failed to delete folder')
    }
  }

  const deleteFolders = async (ids) => {
    try {
      const foldersToDelete = folders.filter((f) => ids.includes(f.id))
      if (foldersToDelete.length === 0) return

      const api = window.api
      for (const id of ids) {
        if (api?.deleteFolder) {
          await api.deleteFolder(id)
        } else {
          await api.invoke('db:deleteFolder', id)
        }
      }

      setFolders((prev) => prev.filter((f) => !ids.includes(f.id)))
      if (setTrash) {
        setTrash((prev) => [
          ...foldersToDelete.map((f) => ({ ...f, type: 'folder', deleted_at: Date.now() })),
          ...prev
        ])
      }
      // Snippets update handled by global re-fetch
      showToast(`✓ ${ids.length} folders moved to trash`)
    } catch (error) {
      showToast('❌ Failed to delete folders')
    }
  }

  const toggleFolderCollapse = async (id, collapsed) => {
    try {
      const api = window.api
      if (api?.toggleFolderCollapse) {
        await api.toggleFolderCollapse(id, collapsed)
      } else {
        await api.invoke('db:toggleFolderCollapse', id, collapsed)
      }
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, collapsed: collapsed ? 1 : 0 } : f))
      )
    } catch (error) {
      console.error('Failed to toggle folder:', error)
    }
  }

  const moveFolder = async (folderId, parentId) => {
    try {
      const ids = Array.isArray(folderId) ? folderId : [folderId]
      const api = window.api

      for (const id of ids) {
        if (api?.moveFolder) {
          await api.moveFolder(id, parentId)
        } else {
          await api.invoke('db:moveFolder', id, parentId)
        }
      }

      setFolders((prev) =>
        prev.map((f) => (ids.includes(f.id) ? { ...f, parent_id: parentId || null } : f))
      )
    } catch (error) {
      showToast('❌ Failed to move folder(s)')
    }
  }

  return {
    saveFolder,
    deleteFolder,
    deleteFolders,
    toggleFolderCollapse,
    moveFolder,
    loadFolders
  }
}
