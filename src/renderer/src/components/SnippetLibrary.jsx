import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useToast } from '../utils/ToastNotification'
import { useSnippetData } from '../hook/useSnippetData'
// Components
import Workbench from './workbench/Workbench'

const SnippetLibrary = () => {
  // 1. Logic & Data (From Hook)
  const {
    snippets,
    selectedSnippet,
    setSelectedSnippet,
    setSnippets,
    saveSnippet,
    deleteItem,
    onNewSnippet
  } = useSnippetData()

  // 2. UI STATE (Local only)
  const [activeView, setActiveView] = useState(() => {
    // Restore activeView from localStorage, default to 'snippets'
    return localStorage.getItem('activeView') || 'snippets'
  })
  const [searchTerm, setSearchTerm] = useState('')

  // Persist activeView to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeView', activeView)
  }, [activeView])

  // Modals
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null })
  const [renameInput, setRenameInput] = useState('')
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const { toast, showToast } = useToast()
  const [activeSnippet, setActiveSnippet] = useState(null)

  // Removed global OS file drop handler in favor of sidebar-focused drop + dnd-kit
  // Re-introduce guarded global drop for OS files: only acts when hovering sidebar list container
  useEffect(() => {
    const onDragOver = (e) => {
      try {
        const types = Array.from(e.dataTransfer?.types || [])
        if (!types.includes('Files')) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      } catch {}
    }
    const onDrop = async (e) => {
      try {
        const types = Array.from(e.dataTransfer?.types || [])
        if (!types.includes('Files')) return
        e.preventDefault()
        const files = Array.from(e.dataTransfer.files || [])
        for (const f of files) {
          const path = f.path || ''
          if (!path) continue
          const name = path.split('\\').pop().split('/').pop()
          const content = await window.api.readFile(path)
          const ext = (name.includes('.') ? name.split('.').pop() : 'txt')?.toLowerCase()
          const draft = {
            id: `draft-${Date.now().toString()}-${Math.random().toString(36).slice(2)}`,
            title: 'untitled',
            code: content,
            language: ext || 'txt',
            timestamp: Date.now(),
            type: 'snippet',
            is_draft: true
          }
          setSnippets((prev) => [draft, ...prev])
          setActiveSnippet(draft)
          setSelectedSnippet(draft)
        }
      } catch {}
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [activeView])

  // Ensure only items of current view are open
  useEffect(() => {
    if (isCreatingSnippet) return
    if (activeView === 'snippets' || activeView === 'markdown') {
      setSelectedSnippet(activeSnippet || null)
    }
  }, [activeView, activeSnippet, isCreatingSnippet])
  // 3. Search Filter Logic
  const filteredItems = useMemo(() => {
    // B. Handle Markdown
    if (activeView === 'markdown') {
      const items = snippets.filter(
        (s) => s.language === 'markdown' || s.title.toLowerCase().endsWith('.md')
      )
      if (!searchTerm.trim()) return items
      return items.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // C. Default (All Snippets) — include markdown too
    const items = snippets
    if (!searchTerm.trim()) return items

    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.language && item.language.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [snippets, searchTerm, activeView])
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
            language: extension || 'txt',
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
      // if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      //   e.preventDefault()
      //   console.log('Reload prevented')
      //   return
      // }

      // Escape closes modals and editor
      if (e.key === 'Escape') {
        if (renameModal.isOpen) setRenameModal({ ...renameModal, isOpen: false })
        if (isCreatingSnippet) setIsCreatingSnippet(false)
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false)
      }
      // Ctrl+N creates new snippet
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault()
        setIsCreatingSnippet(true)
      }
      // Ctrl+Shift+W goes to Welcome page
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        setSelectedSnippet(null)
        setIsCreatingSnippet(false)
        setActiveView('welcome')
      }
      // Ctrl+P toggles Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      }
      // Ctrl+Shift+C copies selected snippet to clipboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
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
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [
    isCreatingSnippet,
    isCommandPaletteOpen,
    selectedSnippet,
    showToast,
    activeView,
    renameModal.isOpen
  ])

  // 6. Rename Logic -- This is where the rename modal is triggered and the rename is handled
  const handleRename = async (newName) => {
    if (!renameModal.item) return

    const baseName = (newName || '').trim()
    if (!baseName) return
    const updatedItem = { ...renameModal.item, title: baseName }
    const hasExt = /\.[^\.\s]+$/.test(baseName)
    const extMap = {
      js: 'js',
      jsx: 'js',
      ts: 'js',
      py: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      sql: 'sql',
      cpp: 'cpp',
      h: 'cpp',
      java: 'java',
      sh: 'sh',
      md: 'md',
      txt: 'txt'
    }
    let lang = renameModal.item.language
    if (hasExt) {
      const ext = baseName.split('.').pop().toLowerCase()
      lang = extMap[ext] || lang
    } else {
      lang = 'txt'
    }
    updatedItem.language = lang

    // 2. Update the selected item immediately (optimistic update)
    if (selectedSnippet && selectedSnippet.id === updatedItem.id) {
      setSelectedSnippet(updatedItem)
    }

    // 3. Save to backend using the hook's functions
    // These functions automatically reload the sidebar list after saving
    try {
      await saveSnippet(updatedItem)
      // Toast is shown by the hook functions
    } catch (error) {
      // Error toast is shown by the hook functions
      // Revert the optimistic update if save failed
      if (selectedSnippet && selectedSnippet.id === updatedItem.id) {
        setSelectedSnippet(renameModal.item)
      }
    } finally {
      setRenameModal({ isOpen: false, item: null })
      setIsCreatingSnippet(false)
    }
  }

  const handleDeleteSnippet = async (id) => {
    try {
      // Cancel any pending autosave for this snippet
      if (window.__autosaveCancel && window.__autosaveCancel.get(id)) {
        try {
          window.__autosaveCancel.get(id)()
        } catch {}
      }

      // Check if active BEFORE deleting (because deleteItem might change selectedSnippet)
      const wasActive =
        activeView === 'snippets' && (selectedSnippet?.id === id || activeSnippet?.id === id)

      // Determine type and list to calculate next item
      // We need to know the remaining items *after* deletion to update local state
      let nextItem = null
      const remaining = snippets.filter((s) => s.id !== id)
      if (remaining.length > 0) nextItem = remaining[0]

      // Use the hook's deleteItem which handles API calls and state updates for both snippets and projects
      await deleteItem(id)

      // Ensure creating editor mode is turned off
      setIsCreatingSnippet(false)

      // Update local selection state to match what the hook did (or should have done)
      if (wasActive) {
        setActiveSnippet(nextItem)

        // If we have a next item, ensure it's selected (hook does this, but we sync local state above)
        // If NO next item, we might want to show Welcome if list is empty
        if (!nextItem) {
          // If list is empty, show Welcome
          setActiveView('welcome')
          setSelectedSnippet(null)
        }
        // If there IS a next item, we stay in current view (snippets or projects)
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      {toast && <div className="toast">{toast}</div>}

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
            // so the editor doesn't close or reset.
            if (isCreatingSnippet) {
              setSelectedSnippet(item)
              setIsCreatingSnippet(false)
            }
          }}
          onDeleteRequest={handleDeleteSnippet}
          onNewSnippet={() => {
            setIsCreatingSnippet(true)
            const draft = {
              id: `draft-${Date.now()}`,
              title: '',
              code: '',
              language: 'txt',
              timestamp: Date.now(),
              type: 'snippet',
              is_draft: true
            }
            setSnippets((prev) => [draft, ...prev])
            setActiveSnippet(draft)
            setSelectedSnippet(draft)
            setActiveView('snippets')
          }}
          onChange={(code) => {
            if (selectedSnippet) {
              const updated = { ...selectedSnippet, code }
              setActiveSnippet(updated)
              setSelectedSnippet(updated)
            }
          }}
        />
      </div>

      {renameModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Rename Snippet
              </h3>
              <button
                onClick={() => setRenameModal({ ...renameModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
              >
                ✖
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">Name</label>
              <input
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                placeholder="Enter name (optionally with extension)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setRenameModal({ ...renameModal, isOpen: false })}
                  className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRename(renameInput)}
                  className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        snippets={snippets}
        onSelect={(item) => {
          setSelectedSnippet(item)
          setActiveView('snippets')
        }}
      />
    </div>
  )
}

export default SnippetLibrary
