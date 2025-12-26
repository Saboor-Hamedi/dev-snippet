import { useState, useEffect } from 'react'
import { useToast } from './useToast'
import { normalizeSnippet } from '../utils/snippetUtils'

export const useSnippetData = () => {
  const [snippets, setSnippets] = useState([])
  const [folders, setFolders] = useState([]) // Folders state
  const [trash, setTrash] = useState([]) // Trash state
  const [projects, setProjects] = useState([])
  const [selectedSnippet, setSelectedSnippetState] = useState(null)
  const { showToast } = useToast()

  // lazy fetch full content only when selected
  const setSelectedSnippet = async (item) => {
    if (!item) {
      setSelectedSnippetState(null)
      return
    }

    try {
      // If code is already present (e.g. from a recent save), just use it
      if (item.code !== undefined && !item.is_draft) {
        setSelectedSnippetState(item)
        return
      }

      // Optimistic update: Show what we have (title, metadata) IMMEDIATELY
      // This makes the sidebar selection feel instant.
      setSelectedSnippetState(item)

      // Otherwise fetch full content from DB
      if (window.api?.getSnippetById) {
        const fullSnippet = await window.api.getSnippetById(item.id)
        // Only update if the user hasn't switched to another snippet in the meantime
        setSelectedSnippetState((current) => {
          if (current && current.id === item.id) {
            return fullSnippet || item
          }
          return current
        })
      } else {
        // Fallback if no API
        setSelectedSnippetState(item)
      }
    } catch (err) {
      setSelectedSnippetState(item)
    }
  }

  // Load initial metadata only
  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.api?.getSnippets) {
          // Fetch only recent metadata for the sidebar/list - MUCH faster
          // We limit to 100 for instant startup; older items are accessed via Search.
          const loadedSnippets = await window.api.getSnippets({
            metadataOnly: true,
            limit: 500, // Increased limit for better tree view
            offset: 0
          })
          setSnippets(loadedSnippets || [])
        }

        if (window.api?.getFolders) {
          const loadedFolders = await window.api.getFolders()
          setFolders(loadedFolders || [])
        } else if (window.api?.invoke) {
          // Fallback to direct invoke if wrapper is missing
          const loadedFolders = await window.api.invoke('db:getFolders')
          setFolders(loadedFolders || [])
        } else {
          console.warn('Folder API (getFolders) not found in window.api')
        }
      } catch (error) {
        console.error('Data loading error:', error)
        showToast('❌ Failed to load data')
      }
    }

    loadData()
  }, [])

  // Save or update a snippet
  const saveSnippet = async (snippet, options = {}) => {
    try {
      // 1. Normalize payload using centralized utility (DRY)
      const payload = normalizeSnippet(snippet)
      const fullText = payload.code

      // 2. Save to database
      console.log(
        `[useSnippetData] Saving snippet. Title: ${payload.title}, Folder: ${payload.folder_id}`
      )
      if (payload.folder_id) {
        console.log(`[DB] Saving snippet "${payload.title}" in folder: ${payload.folder_id}`)
      }
      await window.api.saveSnippet(payload)

      // 3. Update local list in-place to avoid flicker
      setSnippets((prev) => {
        const exists = prev.some((s) => s.id === payload.id)
        // CRITICAL PERFORMANCE: Remove code from the list metadata to keep the sidebar fast
        // eslint-disable-next-line no-unused-vars
        const { code, ...metadataOnly } = payload
        return exists
          ? prev.map((s) => (s.id === payload.id ? { ...s, ...metadataOnly } : s))
          : [metadataOnly, ...prev]
      })

      // Update the active view immediately to refresh snippet data for rename functionality
      if (!options.skipSelectedUpdate) {
        if (selectedSnippet && selectedSnippet.id === payload.id) {
          // Force refresh the selected snippet with updated data
          setSelectedSnippetState(payload)
        }
      }
      showToast('✓ Snippet saved successfully')
    } catch (error) {
      // Don't show generic toast here if we want caller to handle specific errors (like DUPLICATE)
      // But we can show it if it's NOT a Duplicate error?
      // Actually, cleaner to let caller handle UI entirely?
      // For now, keep generic toast as fallback but re-throw.
      if (!error.message?.includes('DUPLICATE')) {
        showToast('❌ Failed to save snippet')
      }
      throw error
    }
  }

  // Delete a snippet or project
  const deleteItem = async (id) => {
    try {
      // Find if it's a snippet or project
      const isSnippet = snippets.find((s) => s.id === id)
      const isProject = projects.find((p) => p.id === id)

      if (isSnippet && window.api?.deleteSnippet) {
        await window.api.deleteSnippet(id)
        const next = snippets.filter((s) => s.id !== id)
        setSnippets(next)

        // Add to trash state optimistically
        setTrash((prev) => [{ ...isSnippet, deleted_at: Date.now() }, ...prev])

        // Select next available snippet to keep editor open
        if (selectedSnippet?.id === id) {
          setSelectedSnippet(next.length ? next[0] : null)
        }
        showToast('✓ Snippet moved to trash')
      } else if (isProject && window.api?.deleteProject) {
        await window.api.deleteProject(id)
        const next = projects.filter((p) => p.id !== id)
        setProjects(next)
        showToast('✓ Project deleted')

        // Select next available project to keep editor open
        if (selectedSnippet?.id === id) {
          setSelectedSnippet(next.length ? next[0] : null)
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

      if (selectedSnippet && ids.includes(selectedSnippet.id)) {
        setSelectedSnippet(null)
      }
      showToast(`✓ ${snippetsToDelete.length} items moved to trash`)
    } catch (error) {
      showToast('❌ Failed to delete items')
    }
  }

  // Restore a snippet or folder from trash
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
        setFolders((prev) => [item, ...prev])
      } else {
        if (window.api?.restoreSnippet) {
          await window.api.restoreSnippet(id)
        } else {
          await window.api.invoke('db:restoreSnippet', id)
        }
        setSnippets((prev) => [item, ...prev])
      }

      setTrash((prev) => prev.filter((t) => t.id !== id))
      showToast(`✓ ${item.type === 'folder' ? 'Folder' : 'Snippet'} restored`)
    } catch (error) {
      showToast('❌ Failed to restore item')
    }
  }

  // Permanently delete snippet or folder
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

  // Load trash items
  const loadTrash = async () => {
    if (window.api?.getTrash) {
      const items = await window.api.getTrash()
      setTrash(items || [])
    }
  }

  // Search snippets
  const searchSnippetList = async (query) => {
    try {
      if (!query || !query.trim()) {
        // Reset to default view (Recent 100)
        if (window.api?.getSnippets) {
          const recents = await window.api.getSnippets({
            metadataOnly: true,
            limit: 100,
            offset: 0
          })
          setSnippets(recents || [])
        }
        return
      }

      if (window.api?.searchSnippets) {
        const results = await window.api.searchSnippets(query)
        setSnippets(results || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  // Pin/Unpin snippet
  const togglePinnedSnippet = async (id) => {
    try {
      const snippet = snippets.find((s) => s.id === id)
      if (!snippet) return

      const newPinned = snippet.is_pinned ? 0 : 1
      const updated = { ...snippet, is_pinned: newPinned }

      // Get full snippet for saving if we only have metadata
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

  // --- FOLDER OPERATIONS ---

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
        // Fallback to direct invoke
        await api.invoke('db:saveFolder', payload)
      } else {
        console.warn(
          'Folder API (saveFolder) not found in window.api. Keys found:',
          Object.keys(api || {})
        )
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
      setTrash((prev) => [{ ...folder, type: 'folder', deleted_at: Date.now() }, ...prev])

      // Items in the folder will remain orphaned in the DB but we could re-map them to root
      setSnippets((prev) => prev.map((s) => (s.folder_id === id ? { ...s, folder_id: null } : s)))
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
      setTrash((prev) => [
        ...foldersToDelete.map((f) => ({ ...f, type: 'folder', deleted_at: Date.now() })),
        ...prev
      ])

      // Orphan snippets
      setSnippets((prev) =>
        prev.map((s) => (ids.includes(s.folder_id) ? { ...s, folder_id: null } : s))
      )
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
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, collapsed: collapsed ? 1 : 0 } : f)))
    } catch (error) {
      console.error('Failed to toggle folder:', error)
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
    } catch (error) {
      showToast('❌ Failed to move snippet(s)')
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
    snippets,
    setSnippets,
    folders, // Exposed
    setFolders,
    trash,
    loadTrash,
    projects,
    setProjects,
    selectedSnippet,
    setSelectedSnippet,
    saveSnippet,
    deleteItem,
    deleteItems,
    restoreItem,
    permanentDeleteItem,
    searchSnippetList,
    saveFolder,
    deleteFolder,
    deleteFolders,
    toggleFolderCollapse,
    moveSnippet,
    moveFolder,
    togglePinnedSnippet
  }
}
