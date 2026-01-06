import { useEffect } from 'react'
import { useKeyboardShortcuts } from '../../../features/keyboard/useKeyboardShortcuts'
import { useModal } from './ModalContext'
import { useView } from '../../../context/ViewContext'
import { useSidebarStore } from '../../../store/useSidebarStore'

const KeyboardHandler = ({
  selectedSnippet,
  setSelectedSnippet,
  saveSnippet,
  deleteItem,
  setAutosaveStatus,
  createDraftSnippet,
  focusEditor,
  isCreatingSnippet,
  setIsCreatingSnippet,
  showToast,
  handleRename,
  onToggleSidebar,
  onTogglePin,
  onOpenPinPopover,
  // Selection Props
  selectedIds = [],
  setSelectedIds,
  selectedFolderId,
  setSelectedFolderId,
  showFlowMode,
  onToggleZenFocus
}) => {
  const {
    toggleCommandPalette,
    openDeleteModal,
    openRenameModal,
    isAnyOpen,
    closeAll,
    openSettingsModal,
    isSettingsOpen,
    openGraphModal,
    openAIPilot
  } = useModal()
  const { activeView, navigateTo, togglePreview, showPreview } = useView()

  useKeyboardShortcuts({
    onEscapeMenusOnly: () => {
      // Priority 1: Close Modals
      if (isAnyOpen) {
        closeAll()
        focusEditor()
        return true
      }

      // Priority 2: Clear Selection (Multi-select or Folder select)
      const hasSelection = (selectedIds && selectedIds.length > 0) || selectedFolderId
      if (hasSelection) {
        if (setSelectedIds) setSelectedIds([])
        if (setSelectedFolderId) setSelectedFolderId(null)
        // We do NOT clear selectedSnippet here to keep the editor open
        // if the user wants to close the editor, they can use the specific shortcut or click away
        return true
      }

      // Priority 3: Close creating mode or settings
      if (isCreatingSnippet) {
        setIsCreatingSnippet(false)
        navigateTo('snippets')
        return true
      }
      if (activeView === 'settings') {
        navigateTo('snippets')
        return true
      }
      return false
    },
    onCloseEditor: () => {
      if (isCreatingSnippet) {
        setIsCreatingSnippet(false)
        navigateTo('snippets')
      } else if (activeView === 'editor' || selectedSnippet) {
        setSelectedSnippet(null)
        navigateTo('snippets')
      }
    },
    onTogglePreview: () => {
      if (showFlowMode) {
        // In Flow Mode, redirect shortcut to local flow preview toggle
        window.dispatchEvent(new CustomEvent('app:flow-toggle-preview'))
        return
      }
      togglePreview()
    },
    onCreateSnippet: () => {
      setIsCreatingSnippet(true)
      if (showPreview) togglePreview() // consistent with old logic
      createDraftSnippet()
    },
    onGlobalSearch: toggleCommandPalette, // Assuming this maps to Cmd+P or similar
    onToggleCommandPalette: toggleCommandPalette,
    onToggleSidebar: onToggleSidebar,

    // ... Settings toggle is handled in Workbench usually via header, but shortcut can be here
    onToggleSettings: () => {
      if (isSettingsOpen) closeAll()
      else openSettingsModal()
    },

    onCopyToClipboard: () => {
      if (selectedSnippet && selectedSnippet.code) {
        navigator.clipboard
          .writeText(selectedSnippet.code)
          .then(() => showToast('✓ Copied'))
          .catch(() => showToast('❌ Failed copy'))
      }
    },

    onRenameSnippet: () => {
      const { selectedIds, setEditingId } = useSidebarStore.getState()
      
      // If we have a single item selected in the sidebar, trigger inline renaming
      if (selectedIds.length === 1) {
        setEditingId(selectedIds[0])
        return
      }

      // Fallback: Rename via modal if in editor or list view without specific sidebar focus
      if (selectedSnippet && (activeView === 'snippets' || activeView === 'editor')) {
        handleRename()
      }
    },

    onDeleteSnippet: () => {
      const { selectedIds, selectedFolderId } = useSidebarStore.getState()
      
      // Multi-select or Folder-select delete
      if (selectedIds.length > 0 || selectedFolderId) {
        // We'll let the existing delete logic in SnippetLibraryInner handle it via events
        // or we can call openDeleteModal directly here if we have access to IDs
        const idsToDelete = selectedIds.length > 0 ? selectedIds : [selectedFolderId]
        
        // Skip system files
        const filteredIds = idsToDelete.filter(id => id !== 'system:settings' && id !== 'system:default-settings')
        if (filteredIds.length === 0) return

        openDeleteModal(filteredIds, async (ids) => {
          // Dispatch a custom event that SnippetLibraryInner listens to for bulk delete
          window.dispatchEvent(new CustomEvent('app:command-bulk-delete', { detail: { ids } }))
        })
        return
      }

      if (selectedSnippet) {
        if (selectedSnippet.id === 'system:settings' || selectedSnippet.id === 'system:default-settings') return
        openDeleteModal(selectedSnippet.id, async (id) => {
          await deleteItem(id)
        })
      }
    },

    onSave: (e) => {
      e?.preventDefault()
      if (selectedSnippet) {
        // Force editor flush
        const editorPresent = !!document.querySelector('.editor-container .cm-editor')
        if (editorPresent || activeView === 'editor' || isCreatingSnippet) {
          try {
            window.__forceSave = true
          } catch {}
          try {
            // Let the editor handle the status updates to ensure alignment with visible notifications
            window.dispatchEvent(new Event('force-save'))
          } catch {}
          return
        }

        // Direct save if not in editor
        const title = selectedSnippet.title || ''
        if (!title.trim()) {
          navigateTo('editor')
          return
        }
        saveSnippet(selectedSnippet)
        focusEditor()
      }
    },

    onZoomIn: () => window.dispatchEvent(new CustomEvent('app:zoom-in')), // let context handle or direct
    onZoomOut: () => window.dispatchEvent(new CustomEvent('app:zoom-out')),
    onZoomReset: () => window.dispatchEvent(new CustomEvent('app:zoom-reset')),

    // --- Local Editor Zoom (Targeted Font Scaling) ---
    onEditorZoomIn: () => window.dispatchEvent(new CustomEvent('app:editor-zoom-in')),
    onEditorZoomOut: () => window.dispatchEvent(new CustomEvent('app:editor-zoom-out')),

    onTogglePin: () => {
      // Determine target id: prefer selectedSnippet, fallback to single selection id
      const targetId =
        selectedSnippet?.id || (selectedIds && selectedIds.length === 1 ? selectedIds[0] : null)
      if (!targetId) return

      try {
        const active = document.activeElement
        let rect = null
        if (active && active.getBoundingClientRect) rect = active.getBoundingClientRect()
        const x = rect ? rect.right + 8 : window.innerWidth / 2 - 80
        const y = rect ? rect.top : window.innerHeight / 2 - 24
        if (onOpenPinPopover) onOpenPinPopover(targetId, { x, y })
        else onTogglePin(targetId)
      } catch (err) {
        // Fallback: direct toggle
        onTogglePin(targetId)
      }
    },
    onToggleQuickCapture: () => {
      try {
        window.api?.toggleQuickCapture?.()
      } catch (err) {
        console.error('Quick Capture toggle failed:', err)
      }
    },
    onToggleFlow: () => {
      window.dispatchEvent(new CustomEvent('app:toggle-flow'))
    },
    onToggleZenFocus: onToggleZenFocus,
    onToggleGraph: openGraphModal, // Ctrl+G / Cmd+G to open Knowledge Graph
    onToggleAIPilot: openAIPilot // Ctrl+Shift+A to open AI Pilot
  })

  // Listen for custom zoom events which hook into useZoomLevel elsewhere or here?
  // Actually useZoomLevel is global hook, we can import it if needed or let components listen.
  // For now leaving zoom commands dispatching events or being handled by global listeners if they exist
  // Simplest is to just call the setZoom from context if passed, or ignore if managed globally.

  return null // Renderless text
}

export default KeyboardHandler
