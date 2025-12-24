import { useState, useEffect } from 'react'
import { useToast } from './useToast'
import { normalizeSnippet } from '../utils/snippetUtils'

export const useSnippetData = () => {
  const [snippets, setSnippets] = useState([])
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
            limit: 100,
            offset: 0
          })
          setSnippets(loadedSnippets || [])
        }
      } catch (error) {
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

  // Restore a snippet from trash
  const restoreItem = async (id) => {
    try {
      if (window.api?.restoreSnippet) {
        await window.api.restoreSnippet(id)

        // Update States
        const restored = trash.find((t) => t.id === id)
        setTrash((prev) => prev.filter((t) => t.id !== id))
        if (restored) {
          setSnippets((prev) => [restored, ...prev])
        } else {
          // Fallback reload if we didn't have it in state
          searchSnippetList('')
        }

        showToast('✓ Snippet restored')
      }
    } catch (error) {
      showToast('❌ Failed to restore item')
    }
  }

  // Permanently delete
  const permanentDeleteItem = async (id) => {
    try {
      if (window.api?.permanentDeleteSnippet) {
        await window.api.permanentDeleteSnippet(id)
        setTrash((prev) => prev.filter((t) => t.id !== id))
        showToast('✓ Snippet permanently deleted')
      }
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

  return {
    snippets,
    setSnippets,
    trash, // Exposed
    loadTrash, // Exposed
    projects,
    setProjects,
    selectedSnippet,
    setSelectedSnippet,
    saveSnippet,
    deleteItem,
    restoreItem,
    permanentDeleteItem,
    searchSnippetList
  }
}
