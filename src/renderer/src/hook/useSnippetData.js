import { useState, useEffect, useCallback } from 'react'
import { useToast } from './useToast'
import { normalizeSnippet } from '../utils/snippetUtils'
import { useFolderData } from './useSnippetData/useFolderData'
import { useTrashData } from './useSnippetData/useTrashData'
import { useSearchLogic } from './useSnippetData/useSearchLogic'

export const useSnippetData = () => {
  // 1. Centralized State
  const [snippets, setSnippets] = useState([])
  const [hasLoadedSnippets, setHasLoadedSnippets] = useState(false)
  const [folders, setFolders] = useState([])
  const [trash, setTrash] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedSnippet, setSelectedSnippetState] = useState(null)
  const { showToast } = useToast()

  // 2. Logic Injection from Sub-hooks
  const folderOps = useFolderData(showToast, folders, setFolders, setSnippets, setTrash)
  const trashOps = useTrashData(showToast, trash, setTrash, setSnippets, setFolders)
  const { searchSnippetList } = useSearchLogic()

  // 3. Snippet-Specific Logic (Kept in main hook for now as it's the core focus)
  const setSelectedSnippet = (itemOrUpdater) => {
    if (!itemOrUpdater) {
      setSelectedSnippetState(null)
      return
    }

    // Support functional updates for fine-grained title/dirty state synchronization
    if (typeof itemOrUpdater === 'function') {
      setSelectedSnippetState(itemOrUpdater)
      return
    }

    const item = itemOrUpdater
    // Immediate state update for UI responsiveness
    setSelectedSnippetState(item)

    // Background fetch for full code if it's not already complete
    if (item.code === undefined || item.is_draft) {
      if (window.api?.getSnippetById) {
        window.api.getSnippetById(item.id).then((fullSnippet) => {
          setSelectedSnippetState((current) => {
            if (current && current.id === item.id) {
              return fullSnippet || item
            }
            return current
          })
        }).catch(err => {
          console.error('[useSnippetData] Failed to fetch full snippet:', err)
        })
      }
    }
  }

  const loadSnippets = useCallback(async () => {
    try {
      if (window.api?.getSnippets) {
        const loadedSnippets = await window.api.getSnippets({
          metadataOnly: true,
          limit: 500,
          offset: 0
        })
        setSnippets(loadedSnippets || [])
        setHasLoadedSnippets(true)
      } else {
        setHasLoadedSnippets(true)
      }
    } catch (error) {
      console.error('Data loading error:', error)
      setHasLoadedSnippets(true)
    }
  }, [])

  const loadData = useCallback(() => {
    loadSnippets()
    folderOps.loadFolders()
    trashOps.loadTrash()
  }, [loadSnippets, folderOps.loadFolders, trashOps.loadTrash])

  // Initial Load & Refresh Logic
  useEffect(() => {
    loadData()

    let unsubscribe = null
    if (window.api?.onDataChanged) {
      unsubscribe = window.api.onDataChanged(() => {
        loadData()
      })
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [loadData])

  const saveSnippet = useCallback(
    async (snippet, options = {}) => {
      try {
        let snippetToNormalize = { ...snippet }
        if (
          snippetToNormalize &&
          snippetToNormalize.id &&
          typeof snippetToNormalize.code === 'undefined'
        ) {
          try {
            if (window.api?.getSnippetById) {
              const existing = await window.api.getSnippetById(snippetToNormalize.id)
              if (existing && typeof existing.code !== 'undefined') {
                snippetToNormalize.code = existing.code
              }
            }
          } catch (err) {}
        }

        const payload = normalizeSnippet(snippetToNormalize)
        await window.api.saveSnippet(payload)

        // Metadata for the sidebar list
        // eslint-disable-next-line no-unused-vars
        const { code, ...metadataOnly } = payload

        setSnippets((prev) => {
          const exists = prev.some((s) => s.id === payload.id)
          return exists
            ? prev.map((s) => (s.id === payload.id ? { ...s, ...metadataOnly } : s))
            : [metadataOnly, ...prev]
        })

        if (!options.skipSelectedUpdate) {
          setSelectedSnippetState((current) => {
            // Even if IDs match, we want a fresh object to trigger re-renders
            if (current && current.id === payload.id) {
              return { ...current, ...payload }
            }
            return current
          })
        }
        showToast('✓ Snippet saved successfully')
      } catch (error) {
        if (!error.message?.includes('DUPLICATE')) {
          showToast('❌ Failed to save snippet')
        }
        throw error
      }
    },
    [showToast]
  )

  const deleteItem = async (id) => {
    try {
      const isSnippet = snippets.find((s) => s.id === id)
      const isProject = projects.find((p) => p.id === id)

      if (isSnippet && window.api?.deleteSnippet) {
        await window.api.deleteSnippet(id)
        const next = snippets.filter((s) => s.id !== id)
        setSnippets(next)
        setTrash((prev) => [{ ...isSnippet, deleted_at: Date.now() }, ...prev])

        if (selectedSnippet?.id === id) {
          setSelectedSnippet(null)
        }
        showToast('✓ Snippet moved to trash')
      } else if (isProject && window.api?.deleteProject) {
        await window.api.deleteProject(id)
        const next = projects.filter((p) => p.id !== id)
        setProjects(next)
        showToast('✓ Project deleted')

        if (selectedSnippet?.id === id) {
          setSelectedSnippet(null)
        }
      }
    } catch (error) {
      showToast('❌ Failed to delete item')
    }
  }

  const deleteItems = async (ids) => {
    try {
      const snippetsToDelete = snippets.filter((s) => ids.includes(s.id))
      if (snippetsToDelete.length === 0) return

      for (const snippet of snippetsToDelete) {
        if (window.api?.deleteSnippet) {
          await window.api.deleteSnippet(snippet.id)
        } else {
          await window.api.invoke('db:deleteSnippet', snippet.id)
        }
      }

      setSnippets((prev) => prev.filter((s) => !ids.includes(s.id)))
      setTrash((prev) => [
        ...snippetsToDelete.map((s) => ({ ...s, deleted_at: Date.now() })),
        ...prev
      ])

      if (selectedSnippet && ids.some(id => String(id) === String(selectedSnippet.id))) {
        setSelectedSnippet(null)
      }
      showToast(`✓ ${snippetsToDelete.length} items moved to trash`)
    } catch (error) {
      showToast('❌ Failed to delete items')
    }
  }

  const moveSnippet = async (snippetId, folderId) => {
    try {
      const ids = Array.isArray(snippetId) ? snippetId : [snippetId]
      const api = window.api

      for (const id of ids) {
        if (api?.moveSnippet) {
          await api.moveSnippet(id, folderId)
        } else {
          await api.invoke('db:moveSnippet', id, folderId)
        }
      }

      setSnippets((prev) =>
        prev.map((s) => (ids.includes(s.id) ? { ...s, folder_id: folderId || null } : s))
      )

      // CRITICAL: Update selectedSnippet if it was moved
      // This prevents Ctrl+S from reverting the folder change
      setSelectedSnippetState((current) => {
        if (current && ids.includes(current.id)) {
          return { ...current, folder_id: folderId || null }
        }
        return current
      })
    } catch (error) {
      showToast('❌ Failed to move snippet(s)')
    }
  }

  const togglePinnedSnippet = async (id) => {
    try {
      const snippet = snippets.find((s) => s.id === id)
      if (!snippet) return

      const newPinned = snippet.is_pinned ? 0 : 1
      const updated = { ...snippet, is_pinned: newPinned }

      let fullSnippet = updated
      if (window.api?.getSnippetById) {
        const full = await window.api.getSnippetById(id)
        if (full) fullSnippet = { ...full, is_pinned: newPinned }
      }

      await saveSnippet(fullSnippet, { skipSelectedUpdate: false })
      showToast(newPinned ? '📌 Snippet pinned' : '📍 Snippet unpinned')
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      showToast('❌ Failed to update pin status')
    }
  }

  return {
    snippets,
    setSnippets,
    folders,
    setFolders,
    trash,
    loadTrash: trashOps.loadTrash,
    projects,
    setProjects,
    selectedSnippet,
    setSelectedSnippet,
    saveSnippet,
    deleteItem,
    deleteItems,
    restoreItem: trashOps.restoreItem,
    permanentDeleteItem: trashOps.permanentDeleteItem,
    searchSnippetList,
    saveFolder: folderOps.saveFolder,
    deleteFolder: folderOps.deleteFolder,
    deleteFolders: folderOps.deleteFolders,
    toggleFolderCollapse: folderOps.toggleFolderCollapse,
    moveSnippet,
    moveFolder: folderOps.moveFolder,
    togglePinnedSnippet,
    hasLoadedSnippets
  }
}
