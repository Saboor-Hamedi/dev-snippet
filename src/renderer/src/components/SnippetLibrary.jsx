import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useToast } from '../hook/useToast'
import ToastNotification from '../utils/ToastNotification'
import { useSnippetData } from '../hook/useSnippetData'
import { handleRenameSnippet } from '../hook/handleRenameSnippet'
// Components
import Workbench from './workbench/Workbench'
import CommandPalette from './CommandPalette'
import RenameModal from './modal/RenameModal'
import DeleteModel from './modal/DeleteModel'
import { useKeyboardShortcuts } from '../hook/useKeyboardShortcuts'
const SnippetLibrary = () => {
  // 1. Logic & Data (From Hook)
  const { snippets, selectedSnippet, setSelectedSnippet, setSnippets, saveSnippet, deleteItem } =
    useSnippetData()

  const [activeView, setActiveView] = useState('snippets')

  // Modals
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const { toast, showToast } = useToast()
  const [activeSnippet, setActiveSnippet] = useState(null)
  // Rename Modal State
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null })

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, snippetId: null })

  const textareaRef = useRef(null)
  // Since sidebar is removed, filteredItems is just all snippets
  const filteredItems = useMemo(() => {
    return snippets
  }, [snippets])

  // Ensure only items of current view are open
  useEffect(() => {
    if (isCreatingSnippet) return
    if (activeView === 'snippets' || activeView === 'markdown') {
      setSelectedSnippet(activeSnippet || null)
    }
  }, [activeView, activeSnippet, isCreatingSnippet])

  const handleOpenSettings = () => {
    // Ensure we are not in create/editor mode so Workbench won't override the view
    if (isCreatingSnippet) setIsCreatingSnippet(false)
    setActiveView('settings')
  }

  const handleCloseSettings = () => {
    setActiveView('snippets')
  }

  // Helper: create a new draft snippet and select it (extracted to avoid duplication)
  const createDraftSnippet = () => {
    const draft = {
      id: `draft-${Date.now()}`,
      title: '',
      code: '',
      language: 'md',
      timestamp: Date.now(),
      type: 'snippet',
      is_draft: true
    }
    setSnippets((prev) => [draft, ...prev])
    setActiveSnippet(draft)
    setSelectedSnippet(draft)
    setActiveView('snippets')
    return draft
  }
  // Adding focus management for our textarea after search found 
  useEffect(() =>{
    if (isCommandPaletteOpen) return
    setTimeout(() => {
      try {
        const ta = document.querySelector('.editor-container textarea')
        if (ta && typeof ta.focus === 'function') ta.focus()
      } catch (err) {}
    }, 100)
  }, [isCommandPaletteOpen])

  // Use the keyboard shortcuts hook here 
  useKeyboardShortcuts({
    onEscape: () => {
      if (renameModal.isOpen) setRenameModal({ ...renameModal, isOpen: false })
      if (deleteModal.isOpen) setDeleteModal({ isOpen: false, snippetId: null })
      if (isCreatingSnippet) setIsCreatingSnippet(false)
      if (isCommandPaletteOpen) setIsCommandPaletteOpen(false)
    },

    onCreateSnippet: () => {
      setIsCreatingSnippet(true)
      const draft = createDraftSnippet()
    },

    onGoToWelcome: () => {
      setSelectedSnippet(null)
      setIsCreatingSnippet(false)
      setActiveView('welcome')
    },

    onToggleCommandPalette: () => {
      setIsCommandPaletteOpen((prev) => !prev)
    },

    onCopyToClipboard: () => {
      if (selectedSnippet && selectedSnippet.code) {
        navigator.clipboard
          .writeText(selectedSnippet.code)
          .then(() => {
            showToast('✓ Snippet copied to clipboard')
          })
          .catch(() => {
            showToast('❌ Failed to copy snippet')
          })
      }
    },

    onRenameSnippet: () => {
      if (selectedSnippet && activeView === 'snippets') {
        setRenameModal({ isOpen: true, item: selectedSnippet })
      }
    },
    onDeleteSnippet: () => {
      if (activeView === 'snippets' && selectedSnippet) {
        setDeleteModal({ isOpen: true, snippetId: selectedSnippet.id }) // ✅ show modal first
      }
    },
    // You can also keep the Ctrl+S save if you want
    onSave: (e) => {
      if (selectedSnippet) {
        e?.preventDefault() // The hook already does this
        saveSnippet(selectedSnippet)
        showToast('✓ Snippet saved')
      }
    }
  })

  // 3. Global Actions (e.g. Opening a file from OS)
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
      showToast('❌ Failed to open file')
    }
  }


  // 5. Rename Logic
  const handleRename = async (newName) => {
    await handleRenameSnippet({
      renameModal: { ...renameModal, newName }, // we pass new name here
      saveSnippet,
      setSelectedSnippet,
      setRenameModal,
      setIsCreatingSnippet,
      showToast
    })
  }
 
  const handleDeleteSnippet = async (id) => {
    try {
      // Cancel any pending autosave for this snippet
      if (window.__autosaveCancel && window.__autosaveCancel.get(id)) {
        try {
          window.__autosaveCancel.get(id)()
        } catch {}
      }

      // Check if active BEFORE deleting
      const wasActive =
        activeView === 'snippets' && (selectedSnippet?.id === id || activeSnippet?.id === id)

      // Determine next item
      let nextItem = null
      const remaining = snippets.filter((s) => s.id !== id)
      if (remaining.length > 0) nextItem = remaining[0]

      // Use the hook's deleteItem
      await deleteItem(id)

      // Ensure creating editor mode is turned off
      setIsCreatingSnippet(false)

      // Update local selection state
      if (wasActive) {
        setActiveSnippet(nextItem)

        if (!nextItem) {
          // If list is empty, show Welcome
          setActiveView('welcome')
          setSelectedSnippet(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }
  // 7. Delete
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Delete key deletes selected snippet if in snippets view
      if (e.key === 'Delete') {
        if (activeView === 'snippets' && selectedSnippet) {
          e.preventDefault()
          setDeleteModal({ isOpen: true, snippetId: selectedSnippet.id }) // ✅ show modal first
        }
      }
    }

    // Attach listener
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedSnippet, activeView])
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      <ToastNotification toast={toast} />
      {/* Main Workbench */}
      <div className="flex-1 flex flex-col items-stretch min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Workbench
          activeView={isCreatingSnippet ? 'editor' : activeView}
          currentContext={activeView}
          selectedSnippet={selectedSnippet}
          snippets={snippets}
          onCloseSnippet={() => setSelectedSnippet(null)}
          onCancelEditor={() => setIsCreatingSnippet(false)}
          onSave={(item) => {
            saveSnippet(item)
            setActiveSnippet(item)
            // If we were creating a new snippet, switch to viewing/editing it
            if (isCreatingSnippet) {
              setSelectedSnippet(item)
              setIsCreatingSnippet(false)
            }
          }}
          onDeleteRequest={handleDeleteSnippet}
          onNewSnippet={() => {
            setIsCreatingSnippet(true)
            createDraftSnippet()
          }}
          onOpenSettings={handleOpenSettings}
          onCloseSettings={handleCloseSettings}
          onChange={(code) => {
            if (selectedSnippet) {
              const updated = { ...selectedSnippet, code }
              setActiveSnippet(updated)
              setSelectedSnippet(updated)
            }
          }}
        />
      </div>

      {/* Rename Modal Component */}
      <RenameModal
        isOpen={renameModal.isOpen}
        item={renameModal.item}
        onClose={() => setRenameModal({ isOpen: false, item: null })}
        onRename={handleRename}
      />

      {/* Delete Modal  */}

      <DeleteModel
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, snippetId: null })}
        onConfirm={async () => {
          await handleDeleteSnippet(deleteModal.snippetId) // ✅ triggers  full logic
          setDeleteModal({ isOpen: false, snippetId: null })
        }}
        snippetTitle={deleteModal.title}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        snippets={snippets} // Pass raw snippets array directly
        onSelect={(item) => {
          setSelectedSnippet(item)
          setActiveSnippet(item)
          setIsCommandPaletteOpen(false)
          setActiveView('snippets')
        }}
      />
    </div>
  )
}

export default SnippetLibrary
