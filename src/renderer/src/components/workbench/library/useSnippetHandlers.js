import { useCallback } from 'react'
import { handleRenameSnippet } from '../../../hook/handleRenameSnippet'
import { getBaseTitle, getUniqueTitle } from '../../../utils/snippetUtils'

/**
 * useSnippetHandlers - Handles snippet-specific UI interactions
 * 
 * This hook manages:
 * - Snippet selection and navigation
 * - Rename operations
 * - Delete operations
 * - Inline rename functionality
 * - WikiLink navigation
 */
export const useSnippetHandlers = ({
  snippets,
  selectedSnippet,
  selectedIds,
  dirtySnippetIds,
  setSelectedSnippet,
  setSelectedFolderId,
  setSelectedIds,
  setIsCreatingSnippet,
  saveSnippet,
  deleteItem,
  deleteItems,
  deleteFolder,
  deleteFolders,
  folders,
  navigateTo,
  openRenameModal,
  openDeleteModal,
  showToast,
  createDraftSnippet
}) => {
  const handleSelectSnippet = useCallback(
    (s) => {
      if (!s) {
        setSelectedSnippet(null)
        setSelectedFolderId(null)
        setSelectedIds([])
        return
      }

      // UNSAVED CHANGES CHECK: Before switching to a different snippet
      if (
        selectedSnippet &&
        selectedSnippet.id !== s.id &&
        dirtySnippetIds.has(selectedSnippet.id)
      ) {
        window.__pendingSnippetSwitch = s
        window.dispatchEvent(new CustomEvent('app:trigger-close-check'))
        return
      }

      setSelectedSnippet(s)
      setSelectedFolderId(null)

      const isAlreadyInSelection = selectedIds.some(
        (id) => id === s.id || id === `pinned-${s.id}`
      )

      if (!isAlreadyInSelection) {
        setSelectedIds([s.id])
      }

      navigateTo('editor')
    },
    [
      setSelectedSnippet,
      setSelectedFolderId,
      setSelectedIds,
      navigateTo,
      selectedSnippet,
      dirtySnippetIds,
      selectedIds
    ]
  )

  const handleRenameRequest = useCallback(() => {
    if (selectedSnippet?.id === 'system:settings') {
      showToast('The settings.json file cannot be renamed', 'info')
      return
    }
    if (selectedSnippet?.id === 'system:default-settings') {
      return
    }

    openRenameModal(selectedSnippet, (newName) => {
      handleRenameSnippet({
        renameModal: { newName, item: selectedSnippet },
        saveSnippet,
        setSelectedSnippet,
        setRenameModal: () => {},
        setIsCreatingSnippet,
        renameSnippet: (oldId, updated) => {
          // This will be handled by the parent component
        },
        showToast,
        snippets
      })
    })
  }, [
    selectedSnippet,
    openRenameModal,
    saveSnippet,
    setSelectedSnippet,
    setIsCreatingSnippet,
    showToast,
    snippets
  ])

  const handleRenameSnippetRequest = useCallback(
    (snippet) => {
      openRenameModal(
        snippet,
        async (newName) => {
          handleRenameSnippet({
            renameModal: { item: snippet, newName },
            saveSnippet,
            setSelectedSnippet,
            setRenameModal: () => {},
            setIsCreatingSnippet: () => {},
            showToast,
            snippets
          })
        },
        'Rename Snippet'
      )
    },
    [openRenameModal, saveSnippet, setSelectedSnippet, showToast, snippets]
  )

  const handleDeleteRequest = useCallback(
    (id) => {
      if (id === 'system:settings' || id === 'system:default-settings') {
        return
      }
      openDeleteModal(id, async (targetId) => {
        // Check if it's a folder or a snippet
        const isFolder = folders.some((f) => f.id === targetId)
        if (isFolder) {
          await deleteFolder(targetId)
        } else {
          await deleteItem(id)
        }
      })
    },
    [deleteItem, deleteFolder, openDeleteModal, folders]
  )

  const handleBulkDelete = useCallback(
    (ids) => {
      openDeleteModal(
        ids,
        async () => {
          // Identify snippets vs Folders
          const snippetIds = ids.filter((id) => snippets.some((s) => s.id === id))
          const folderIds = ids.filter((id) => folders.some((f) => f.id === id))

          if (snippetIds.length > 0) await deleteItems(snippetIds)
          if (folderIds.length > 0) await deleteFolders(folderIds)
        },
        ids.length > 1 ? `${ids.length} items` : 'item'
      )
    },
    [deleteItems, deleteFolders, openDeleteModal, snippets, folders]
  )

  const handleInlineRenameSnippet = useCallback(
    async (id, newName) => {
      try {
        if (!newName || !newName.trim()) return

        const snippet = snippets.find((s) => s.id === id)
        if (snippet) {
          if (snippet.title === newName.trim()) return

          const uniqueTitle = getUniqueTitle(newName.trim(), snippet.folder_id, snippets, id)
          const updated = { ...snippet, title: uniqueTitle }

          if (uniqueTitle !== newName.trim()) {
            showToast(`Renamed to "${uniqueTitle}" to avoid duplicate`, 'info')
          }

          await saveSnippet(updated)
          setSelectedSnippet((current) => (current?.id === id ? updated : current))
          showToast('Snippet renamed', 'success')
        }
      } catch (e) {
        console.error('Inline rename failed:', e)
        showToast('Rename failed', 'error')
      }
    },
    [snippets, saveSnippet, setSelectedSnippet, showToast]
  )

  const handleOpenSnippet = useCallback(
    async (title) => {
      if (!title) return

      const textTitle = title.replace(/\.md$/i, '').trim()
      const searchTitle = textTitle.toLowerCase()

      // Debounce: Prevent double-creation
      if (window.__wikiLock === searchTitle) return

      const target = snippets.find((s) => {
        const t = (s.title || '').trim().toLowerCase()
        return t === searchTitle || t === `${searchTitle}.md`
      })

      if (target) {
        handleSelectSnippet(target)
      } else {
        window.__wikiLock = searchTitle
        setTimeout(() => {
          window.__wikiLock = null
        }, 1000)

        // Sanitize title
        let safeTitle = textTitle.replace(/[?*"><]/g, '')
        safeTitle = safeTitle.replace(/[:/\\|]/g, '-')
        safeTitle = safeTitle.trim()

        if (!safeTitle) safeTitle = 'Untitled Wiki Note'

        const newSnippet = createDraftSnippet(safeTitle, null, {
          initialCode: `# ${safeTitle}\n\n`,
          skipNavigation: true,
          isDraft: false
        })

        if (newSnippet) {
          try {
            await saveSnippet(newSnippet)
            handleSelectSnippet(newSnippet)
            setTimeout(() => {
              setSelectedSnippet(newSnippet)
              navigateTo('editor')
            }, 50)
            showToast(`New Snippet "${safeTitle}"`, 'success')
          } catch (error) {
            console.error('[WikiLink] Creation failed:', error)
            showToast('Failed to save new snippet', 'error')
          }
        }
      }
    },
    [
      snippets,
      handleSelectSnippet,
      createDraftSnippet,
      saveSnippet,
      setSelectedSnippet,
      navigateTo,
      showToast
    ]
  )

  return {
    handleSelectSnippet,
    handleRenameRequest,
    handleRenameSnippetRequest,
    handleDeleteRequest,
    handleBulkDelete,
    handleInlineRenameSnippet,
    handleOpenSnippet
  }
}
