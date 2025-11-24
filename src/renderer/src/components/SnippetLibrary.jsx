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
  const [activeView, setActiveView] = useState('explorer')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' })
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)

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
      // Escape closes modals and editor
      if (e.key === 'Escape') {
        if (deleteModal.isOpen) setDeleteModal({ ...deleteModal, isOpen: false })
        if (createProjectModalOpen) setCreateProjectModalOpen(false)
        if (isCreatingSnippet) setIsCreatingSnippet(false)
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
        setActiveView('explorer')
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [deleteModal.isOpen, createProjectModalOpen, isCreatingSnippet])

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
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
        <div className="w-80 flex-shrink-0 border-r border-slate-700">
          <Sidebar
            activeView={activeView}
            items={filteredItems}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedSnippet={selectedSnippet}
            onSelect={setSelectedSnippet}
            // Wiring up actions
            onDeleteRequest={(id) => {
              const item = filteredItems.find((i) => i.id === id)
              setDeleteModal({ isOpen: true, id, title: item?.title || 'Item' })
            }}
            onCreateProject={() => setCreateProjectModalOpen(true)}
            // Add a button in Sidebar to trigger handleOpenFile if you want
            // onOpenFile={handleOpenFile}
          />
        </div>
      )}

      {/* Main Workbench */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Workbench
          activeView={isCreatingSnippet ? 'editor' : activeView}
          selectedSnippet={selectedSnippet}
          snippets={snippets}
          projects={projects}
          onCloseSnippet={() => setSelectedSnippet(null)}
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
    </div>
  )
}

export default SnippetLibrary
