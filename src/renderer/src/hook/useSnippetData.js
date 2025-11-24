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
  const saveSnippet = async (snippet) => {
    try {
      if (window.api?.saveSnippet) {
        await window.api.saveSnippet(snippet)
        // Reload snippets
        const loadedSnippets = await window.api.getSnippets()
        setSnippets(loadedSnippets || [])
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
        setSnippets(snippets.filter((s) => s.id !== id))
        showToast('✓ Snippet deleted')
      } else if (isProject && window.api?.deleteProject) {
        await window.api.deleteProject(id)
        setProjects(projects.filter((p) => p.id !== id))
        showToast('✓ Project deleted')
      }

      // Clear selection if deleted item was selected
      if (selectedSnippet?.id === id) {
        setSelectedSnippet(null)
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

  return {
    snippets,
    setSnippets,
    projects,
    setProjects,
    selectedSnippet,
    setSelectedSnippet,
    saveSnippet,
    deleteItem,
    createProject
  }
}
