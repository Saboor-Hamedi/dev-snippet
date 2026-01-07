import { useCallback } from 'react'

/**
 * useFolderOperations - Handles folder CRUD operations
 * 
 * This hook manages:
 * - Creating new folders
 * - Renaming folders
 * - Deleting folders
 * - Inline rename functionality
 */
export const useFolderOperations = ({
  folders,
  snippets,
  saveFolder,
  deleteFolder,
  deleteFolders,
  toggleFolderCollapse,
  selectedFolderId,
  selectedSnippet,
  openRenameModal,
  openDeleteModal,
  showToast
}) => {
  const handleNewFolder = useCallback(
    (arg1 = {}, arg2 = null) => {
      // Support both direct call and modal-based creation
      if (typeof arg1 === 'string') {
        const name = arg1
        const parentId = arg2
        if (name && name.trim()) {
          saveFolder({ name: name.trim(), parent_id: parentId })
            .then(() => {
              if (parentId) toggleFolderCollapse(parentId, false)
              showToast(`Folder "${name}" created`, 'success')
            })
            .catch((e) => {
              console.error('Failed to create folder:', e)
              showToast('Failed to create folder', 'error')
            })
        }
        return
      }

      const options = arg1 || {}
      const parentId = options.parentId || selectedFolderId || selectedSnippet?.folder_id || null

      openRenameModal(
        null,
        async (name) => {
          if (name && name.trim()) {
            try {
              await saveFolder({ name: name.trim(), parent_id: parentId })
              if (parentId) toggleFolderCollapse(parentId, false)
              showToast(`Folder "${name}" created`, 'success')
            } catch (e) {
              console.error('Failed to create folder:', e)
              showToast('Failed to create folder', 'error')
            }
          }
        },
        'New Folder'
      )
    },
    [
      saveFolder,
      toggleFolderCollapse,
      selectedFolderId,
      selectedSnippet,
      openRenameModal,
      showToast
    ]
  )

  const handleRenameFolder = useCallback(
    (folder) => {
      openRenameModal(
        folder,
        async (newName) => {
          if (newName && newName.trim()) {
            try {
              await saveFolder({ ...folder, name: newName.trim() })
              showToast(`Folder renamed to "${newName}"`, 'success')
            } catch (e) {
              console.error('Failed to rename folder:', e)
              showToast('Failed to rename folder', 'error')
            }
          }
        },
        'Rename Folder'
      )
    },
    [saveFolder, openRenameModal, showToast]
  )

  const handleDeleteFolder = useCallback(
    (folderId) => {
      openDeleteModal(
        folderId,
        async (id) => {
          try {
            await deleteFolder(id)
            showToast('Folder deleted', 'success')
          } catch (e) {
            showToast('Failed to delete folder', 'error')
          }
        },
        'Folder'
      )
    },
    [deleteFolder, openDeleteModal, showToast]
  )

  const handleBulkDeleteFolders = useCallback(
    (folderIds) => {
      openDeleteModal(
        folderIds,
        async (ids) => {
          try {
            await deleteFolders(ids)
            showToast(`${ids.length} folders deleted`, 'success')
          } catch (e) {
            showToast('Failed to delete folders', 'error')
          }
        },
        `${folderIds.length} folders`
      )
    },
    [deleteFolders, openDeleteModal, showToast]
  )

  const handleInlineRenameFolder = useCallback(
    async (id, newName) => {
      try {
        if (!newName || !newName.trim()) return

        const folder = folders.find((f) => f.id === id)
        if (folder) {
          if (folder.name === newName.trim()) return
          const updated = { ...folder, name: newName.trim() }
          await saveFolder(updated)
          showToast('Folder renamed', 'success')
        }
      } catch (e) {
        console.error('Inline rename failed:', e)
        showToast('Rename failed', 'error')
      }
    },
    [folders, saveFolder, showToast]
  )

  return {
    handleNewFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleBulkDeleteFolders,
    handleInlineRenameFolder
  }
}
