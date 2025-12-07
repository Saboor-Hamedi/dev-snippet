import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import { useSnippetData } from '../../hook/useSnippetData'
import { handleRenameSnippet } from '../../hook/handleRenameSnippet'
// Components
import Workbench from './Workbench'
import CommandPalette from '../CommandPalette'
import RenameModal from '../modal/RenameModal'
import DeleteModel from '../modal/DeleteModel'
import SettingsModal from '../SettingsModal'
import { useKeyboardShortcuts } from '../../hook/useKeyboardShortcuts'
import { useSettings } from '../../hook/useSettingsContext.jsx'
import { useFontSettings } from '../../hook/useFontSettings'

import { isSnippetSaved } from '../../hook/snippetUtils.js'

const SnippetLibrary = () => {
  // Apply font settings globally
  useFontSettings()

  // 1. Logic & Data (From Hook)
  const { snippets, selectedSnippet, setSelectedSnippet, setSnippets, saveSnippet, deleteItem } =
    useSnippetData()

  const [activeView, setActiveView] = useState('snippets')

  // Settings Context
  const { settings, updateSettings } = useSettings()

  // Modals
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { toast, showToast } = useToast()
  const [activeSnippet, setActiveSnippet] = useState(null)
  // Autosave status: null | 'pending' | 'saving' | 'saved'
  const [autosaveStatus, setAutosaveStatus] = useState(null)
  // Rename Modal State
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null })

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, snippetId: null })

  // Name prompt is handled by SnippetEditor component
  const [isCompact, setIsCompact] = useState(() => {
    try {
      return localStorage.getItem('compactMode') === 'true'
    } catch (e) {
      return false
    }
  }) // Compact mode state Header

  useEffect(() => {
    try {
      localStorage.setItem('compactMode', isCompact)
    } catch (e) {}
  }, [isCompact])

  // Live preview visibility (default: closed, no persistence)
  const [showPreview, setShowPreview] = useState(false)

  // Since sidebar is removed, filteredItems is just all snippets
  const filteredItems = useMemo(() => {
    return snippets
  }, [snippets])

  // Ensure only items of current view are open
  useEffect(() => {
    // If we're actively creating and still in the editor, don't override selection.
    // But if the view changes (for example user selects a search result and
    // activeView becomes 'snippets'), we should allow replacing the selection
    // so the search result opens the editor instead of keeping the draft.
    if (isCreatingSnippet && activeView === 'editor') return
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
      id: Date.now().toString(),
      title: '',
      code: '',
      language: 'md',
      timestamp: Date.now(),
      type: 'snippet',
      is_draft: true
    }
    // Keep draft in memory and open editor directly so it isn't accidentally
    // autosaved from the snippets list. We still add it to local state so UI
    // can show it while editing, but open the editor view immediately.
    setSnippets((prev) => [draft, ...prev])
    setActiveSnippet(draft)
    setSelectedSnippet(draft)
    setActiveView('editor')
    return draft
  }
  // Adding focus management for textarea - only when command palette closes and editor is active
  useEffect(() => {
    // Only try to focus editor when command palette closes (not when it opens)
    if (isCommandPaletteOpen) return

    // Only focus if we're in editor view
    if (activeView !== 'editor' && !isCreatingSnippet) return

    setTimeout(() => {
      try {
        const ta = document.querySelector('.editor-container textarea')
        if (ta && typeof ta.focus === 'function') {
          ta.focus()
        }
      } catch (err) {}
    }, 150) // Slightly longer delay to ensure command palette is fully closed
  }, [isCommandPaletteOpen, activeView, isCreatingSnippet])

  // Use the keyboard shortcuts hook here
  useKeyboardShortcuts({
    onEscapeMenusOnly: () => {
      // Close ephemeral UI first (modals, palette) with plain Escape.
      // Return true if we handled something so other components don't react.
      let handled = false
      if (renameModal.isOpen) {
        setRenameModal({ ...renameModal, isOpen: false })
        handled = true
      }
      if (deleteModal.isOpen) {
        setDeleteModal({ isOpen: false, snippetId: null })
        handled = true
      }
      if (isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false)
        handled = true
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false)
        handled = true
      }
      return handled
    },
    onCloseEditor: () => {
      // Ctrl+Shift+W: Close editor and go to welcome
      if (isCreatingSnippet) {
        setIsCreatingSnippet(false)
        setActiveView('welcome')
      } else if (activeView === 'editor' || selectedSnippet) {
        setSelectedSnippet(null)
        setActiveView('welcome')
      }
    },
    onToggleCompact: () => {
      setIsCompact((prev) => !prev)
    },
    onTogglePreview: () => {
      setShowPreview((s) => !s)
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

    onToggleSettings: () => {
      setIsSettingsOpen((prev) => !prev)
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
      if (selectedSnippet && (activeView === 'snippets' || activeView === 'editor')) {
        handleRenameOrSave() //  call the new unified handler
      }
    },
    onDeleteSnippet: () => {
      if ((activeView === 'snippets' || activeView === 'editor') && selectedSnippet) {
        setDeleteModal({ isOpen: true, snippetId: selectedSnippet.id });
      }
    },
    // You can also keep the Ctrl+S save if you want
    onSave: (e) => {
      if (selectedSnippet) {
        e?.preventDefault() // The hook already does this
        // If an editor textarea is present (covers create-mode and when
        // viewing an existing snippet in the editor), dispatch 'force-save'
        // so the editor flushes its local state and performs the change
        // detection. This avoids saving from the parent when nothing changed.
        const editorPresent = !!document.querySelector('.editor-container textarea')
        if (editorPresent || activeView === 'editor' || isCreatingSnippet) {
          try {
            window.__forceSave = true
          } catch {}
          try {
            setAutosaveStatus('saved')
            window.dispatchEvent(new Event('force-save'))
          } catch {}
          return
        }

        // Prevent saving unnamed drafts from the global handler when not in editor.
        const title = selectedSnippet.title || ''
        if (!title || !title.trim()) {
          // Switch to editor so user can name the snippet
          setActiveView('editor')
          return
        }
        saveSnippet(selectedSnippet)
      }
    }
  })

  // Note: save-toasts are emitted by `useSnippetData.saveSnippet` to avoid duplicates.

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

  // Handle rename - only allow if snippet has a title (is saved)
  const handleRenameOrSave = async () => {
    if (!selectedSnippet?.title || !selectedSnippet.title.trim()) {
      showToast('💾 Please save the snippet first before renaming', 'info')
      return
    }

    // Display the rename modal
    setRenameModal({ isOpen: true, item: selectedSnippet })
  }
function renameSnippet(oldId, updatedItem) {
  setSnippets((prev) => [
    ...prev.filter((snippet) => snippet.id !== oldId), // Remove old draft
    updatedItem // Add updated snippet with new id
  ])
}
  // 5. Rename Logic
  const handleRename = async (newName) => {
    await handleRenameSnippet({
      renameModal: { ...renameModal, newName }, // we pass new name here
      saveSnippet,
      setSelectedSnippet,
      setRenameModal,
      setIsCreatingSnippet,
      renameSnippet,
      showToast,
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
      // Delete failed silently
    }
  }

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
          isCompact={isCompact}
          onToggleCompact={() => setIsCompact(!isCompact)}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview((s) => !s)}
          showToast={showToast}
          onSave={async (item) => {
            try {
              const wasForce = !!window.__forceSave
              if (!wasForce) setAutosaveStatus('saving')
              await saveSnippet(item)
              setActiveSnippet(item)
              // If we were creating a new snippet, switch to viewing/editing it
              if (isCreatingSnippet) {
                setSelectedSnippet(item)
                setIsCreatingSnippet(false)
              }
              // If this was a forced save, editor already set 'saved' optimistically.
              if (wasForce) {
                try {
                  window.__forceSave = false
                } catch {}
                setAutosaveStatus('saved')
                setTimeout(() => setAutosaveStatus(null), 1200)
              } else {
                setAutosaveStatus('saved')
                setTimeout(() => setAutosaveStatus(null), 1200)
              }
            } catch (err) {
              try {
                window.__forceSave = false
              } catch {}
              setAutosaveStatus(null)
            }
          }}
          autosaveStatus={autosaveStatus}
          onAutosave={(s) => {
            setAutosaveStatus(s)
            if (s === 'saved') setTimeout(() => setAutosaveStatus(null), 1200)
          }}
      onDeleteRequest={handleDeleteSnippet}
          onNewSnippet={() => {
            setIsCreatingSnippet(true)
            createDraftSnippet()
          }}
          onSelectSnippet={(snippet) => {
            setSelectedSnippet(snippet)
            setActiveView('editor')
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
          // If user selects from search/palette, cancel create-mode so the
          // selected snippet replaces any open draft/editor.
          setSelectedSnippet(item)
          setActiveSnippet(item)
          setIsCommandPaletteOpen(false)
          setIsCreatingSnippet(false)
          setActiveView('snippets')
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={settings}
        onSettingsChange={updateSettings}
      />
    </div>
  )
}

export default SnippetLibrary
