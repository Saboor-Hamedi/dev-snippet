import { useState, useEffect } from 'react'
import { useToast } from '../utils/ToastNotification'

export const useSnippetData = () => {
  const [snippets, setSnippets] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedSnippet, setSelectedSnippet] = useState(null)
  const { showToast } = useToast()

  // Load initial data from the main process
  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.api?.getSnippets && window.api?.getProjects) {
          const loadedSnippets = await window.api.getSnippets()
          setSnippets(loadedSnippets || [])

          const loadedProjects = await window.api.getProjects()
          setProjects(loadedProjects || [])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        showToast('❌ Failed to load data')
      }
    }

    loadData()
  }, [showToast]) // showToast is a dependency

  // Save or update a snippet
  const saveSnippet = async (snippet, options = {}) => {
    try {
      if (window.api?.saveSnippet) {
        // Enforce type 'snippet'
        const payload = { ...snippet, type: 'snippet', sort_index: snippet.sort_index ?? null }
        await window.api.saveSnippet(payload)
        // Update local list in-place to avoid flicker
        setSnippets((prev) => {
          const exists = prev.some((s) => s.id === payload.id)
          return exists
            ? prev.map((s) => (s.id === payload.id ? { ...s, ...payload } : s))
            : [{ ...payload }, ...prev]
        })
        // C. IMPORTANT: Update the Active View Immediately!
        // If the item we just saved is the one currently open, update the state.
        if (!options.skipSelectedUpdate) {
          if (selectedSnippet && selectedSnippet.id === payload.id) {
            setSelectedSnippet(payload)
          }
        }
        showToast('✓ Snippet saved successfully')
      }
    } catch (error) {
      console.error('Failed to save snippet:', error)
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
      console.error('Failed to delete item:', error)
      showToast('❌ Failed to delete item')
    }
  }

  // Create a new project
  const createProject = async (projectData) => {
    try {
      if (window.api?.saveProject) {
        const newProject = {
          id: Date.now().toString(),
          ...projectData,
          timestamp: Date.now(),
          type: 'project'
        }
        await window.api.saveProject(newProject)
        // Reload projects
        const loadedProjects = await window.api.getProjects()
        setProjects(loadedProjects || [])
        showToast('✓ Project created successfully')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      showToast('❌ Failed to create project')
    }
  }

  // Save or update a project (for renaming/editing existing projects)
  const saveProject = async (project, options = {}) => {
    try {
      if (window.api?.saveProject) {
        // Enforce type 'project'
        const payload = { ...project, type: 'project', sort_index: project.sort_index ?? null }
        await window.api.saveProject(payload)
        // Update local list in-place to avoid flicker
        setProjects((prev) => {
          const exists = prev.some((p) => p.id === payload.id)
          return exists
            ? prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p))
            : [{ ...payload }, ...prev]
        })
        // Update selected item immediately if it's the one being edited
        if (!options.skipSelectedUpdate) {
          if (selectedSnippet && selectedSnippet.id === payload.id) {
            setSelectedSnippet(payload)
          }
        }
        showToast('✓ Project saved successfully')
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      showToast('❌ Failed to save project')
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
    saveProject,
    deleteItem,
    createProject
  }
}
