import { useState, useEffect } from 'react'
import { useToast } from './useToast'
export const useSnippetData = () => {
  const [snippets, setSnippets] = useState([])
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

      // Otherwise fetch full content from DB
      if (window.api?.getSnippetById) {
        const fullSnippet = await window.api.getSnippetById(item.id)
        setSelectedSnippetState(fullSnippet || item)
      } else {
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
          // Fetch only metadata for the sidebar/list - MUCH faster
          const loadedSnippets = await window.api.getSnippets({ metadataOnly: true })
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
      const fullText = snippet?.code || ''

      // Simple DB-only storage for all snippets
      const payload = {
        ...snippet,
        type: 'snippet',
        sort_index: snippet.sort_index ?? null,
        code: fullText,
        is_draft: false // Explicitly mark as saved (not draft)
      }

      // Save to database
      await window.api.saveSnippet(payload)

      // Update local list in-place to avoid flicker
      setSnippets((prev) => {
        const exists = prev.some((s) => s.id === snippet.id)
        const updatedItem = { ...snippet, code: fullText, is_draft: false } // Keep full content in local state and mark as saved
        return exists
          ? prev.map((s) => (s.id === snippet.id ? { ...s, ...updatedItem } : s))
          : [updatedItem, ...prev]
      })

      // Update the active view immediately to refresh snippet data for rename functionality
      if (!options.skipSelectedUpdate) {
        if (selectedSnippet && selectedSnippet.id === snippet.id) {
          // Force refresh the selected snippet with updated data
          const refreshedSnippet = { ...snippet, code: fullText, is_draft: false }
          setSelectedSnippetState(refreshedSnippet)
        }
      }
      showToast('✓ Snippet saved successfully')
    } catch (error) {
      showToast('❌ Failed to save snippet')
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
        // Select next available snippet to keep editor open
        if (selectedSnippet?.id === id) {
          setSelectedSnippet(next.length ? next[0] : null)
        }
        showToast('✓ Snippet deleted')
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

  return {
    snippets,
    setSnippets,
    projects,
    setProjects,
    selectedSnippet,
    setSelectedSnippet,
    saveSnippet,
    deleteItem
  }
}
