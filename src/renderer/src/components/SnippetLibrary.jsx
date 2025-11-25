import React, { useState, useEffect, useMemo } from 'react'
import { useToast } from '../utils/ToastNotification'
import { useSnippetData } from '../hook/useSnippetData'

// Components
import ActivityBar from './layout/ActivityBar'
import Sidebar from './layout/Sidebar'
import Workbench from './workbench/Workbench'
import SnippetEditor from './SnippetEditor'
import SnippetViewer from './SnippetViewer'
import DeleteModel from '../utils/DeleteModel'
import CreateProjectModal from './CreateProjectModal'
import RenameModal from './RenameModal'
import CommandPalette from './CommandPalette'

const SnippetLibrary = () => {
  // 1. Logic & Data (From Hook)
  const {
    snippets,
    projects,
    selectedSnippet,
    setSelectedSnippet,
    saveSnippet,
    deleteItem,
    createProject
  } = useSnippetData()

  // 2. UI STATE (Local only)
  const [activeView, setActiveView] = useState('welcome')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' })
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null })
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  const { toast, showToast } = useToast()

  // 3. Search Filter Logic
  const filteredItems = useMemo(() => {
    const items = activeView === 'projects' ? projects : snippets
    if (!searchTerm.trim()) return items
    const searchLower = searchTerm.toLowerCase()

    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        (item.language && item.language.toLowerCase().includes(searchLower))
    )
  }, [snippets, projects, searchTerm, activeView])

  // 4. Global Actions (e.g. Opening a file from OS)
  const handleOpenFile = async () => {
    try {
      if (window.api?.openFile) {
        const path = await window.api.openFile()
        if (path) {
          const content = await window.api.readFile(path)
          const fileName = path.split('\\').pop().split('/').pop()
          const extension = fileName.split('.').pop()?.toLowerCase()

          const newEntry = {
            id: Date.now().toString(),
            title: fileName,
            code: content,
            language: extension || 'text',
            timestamp: Date.now(),
            type: 'snippet'
          }

          // Use the hook to save it
          await saveSnippet(newEntry)
        }
      }
    } catch (error) {
      console.error('Error opening file:', error)
      showToast('❌ Failed to open file')
    }
  }

  // 5. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent Ctrl+R (Reload)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        console.log('Reload prevented')
        return
      }

      // Escape closes modals and editor
      if (e.key === 'Escape') {
        if (deleteModal.isOpen) setDeleteModal({ ...deleteModal, isOpen: false })
        if (createProjectModalOpen) setCreateProjectModalOpen(false)
        if (renameModal.isOpen) setRenameModal({ ...renameModal, isOpen: false })
        if (isCreatingSnippet) setIsCreatingSnippet(false)
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false)
      }
      // Ctrl+B toggles sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarCollapsed((prev) => !prev)
      }
      // Ctrl+N creates new snippet
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setIsCreatingSnippet(true)
      }
      // Ctrl+P toggles Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [
    deleteModal.isOpen,
    createProjectModalOpen,
    renameModal.isOpen,
    isCreatingSnippet,
    isCommandPaletteOpen
  ])

  // 6. Rename Logic -- This is where the rename modal is triggered and the rename is handled
  const handleRename = async (newName) => {
    if (!renameModal.item) return
    const updatedItem = { ...renameModal.item, title: newName }
    const isProject = renameModal.item.type === 'project'
    const itemType = isProject ? 'project' : 'snippet'

    try {
      const apiMethod = isProject ? 'saveProject' : 'saveSnippet'
      if (!window.api?.[apiMethod]) {
        throw new Error(`API method ${apiMethod} not found`)
      }
      await window.api[apiMethod](updatedItem)
      showToast(`✓ ${itemType} renamed`)
      // finally refresh the list
      if (createProject && isProject) {
        createProject(updatedItem)
      }
    } catch (error) {
      console.error('Rename failed:', error)
      showToast('❌ Rename failed')
    } finally {
      setRenameModal({ isOpen: false, item: null })
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      {toast && <div className="toast">{toast}</div>}

      {/* Activity Bar - Fixed */}
      <div className="flex-shrink-0">
        <ActivityBar
          activeView={activeView}
          setActiveView={setActiveView}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Sidebar - Collapsible */}
      {!sidebarCollapsed && (
        <div className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors duration-200">
          <Sidebar
            activeView={activeView}
            items={filteredItems}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedSnippet={selectedSnippet}
            onSelect={(item) => {
              setSelectedSnippet(item)
              if (activeView === 'settings') {
                setActiveView('snippets')
              }
            }}
            // Wiring up actions
            onDeleteRequest={(id) => {
              const item = filteredItems.find((i) => i.id === id)
              setDeleteModal({ isOpen: true, id, title: item?.title || 'Item' })
            }}
            onCreateProject={() => setCreateProjectModalOpen(true)}
            onCreateSnippet={() => setIsCreatingSnippet(true)}
            onRenameRequest={(item) => setRenameModal({ isOpen: true, item })}
          />
        </div>
      )}

      {/* Main Workbench */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Workbench
          activeView={isCreatingSnippet ? 'editor' : activeView}
          selectedSnippet={selectedSnippet}
          snippets={snippets}
          projects={projects}
          onCloseSnippet={() => setSelectedSnippet(null)}
          onCancelEditor={() => setIsCreatingSnippet(false)}
          onSave={(code) => {
            saveSnippet(code)
            setIsCreatingSnippet(false)
          }}
          onDeleteRequest={(id) => {
            const item = [...snippets, ...projects].find((i) => i.id === id)
            setDeleteModal({ isOpen: true, id, title: item?.title || 'Item' })
          }}
          onNewSnippet={() => setIsCreatingSnippet(true)}
          onChange={(code) => {
            if (selectedSnippet) {
              setSelectedSnippet({ ...selectedSnippet, code })
            }
          }}
        />
      </div>

      {/* Modals */}
      <DeleteModel
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => {
          deleteItem(deleteModal.id) // Call Hook
          setDeleteModal({ ...deleteModal, isOpen: false }) // Close Modal
        }}
        snippetTitle={deleteModal.title}
      />

      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onSave={(data) => {
          createProject(data) // Call Hook
          setCreateProjectModalOpen(false)
        }}
      />

      <RenameModal
        isOpen={renameModal.isOpen}
        onClose={() => setRenameModal({ ...renameModal, isOpen: false })}
        onRename={handleRename}
        currentName={renameModal.item?.title || ''}
        title={`Rename ${renameModal.item?.type === 'project' ? 'Project' : 'Snippet'}`}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        snippets={snippets}
        projects={projects}
        onSelect={(item) => {
          setSelectedSnippet(item)
          // Switch view if needed
          if (item.type === 'project') {
            setActiveView('projects')
          } else {
            setActiveView('snippets')
          }
        }}
      />
    </div>
  )
}

export default SnippetLibrary
