import { useEffect } from 'react'
import { useKeyboardShortcuts } from '../../../hook/useKeyboardShortcuts'
import { useModal } from './ModalContext'
import { useView } from '../../../context/ViewContext'

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
  setSelectedFolderId
}) => {
  const {
    toggleCommandPalette,
    openDeleteModal,
    openRenameModal,
    isAnyOpen,
    closeAll,
    openSettingsModal,
    isSettingsOpen
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
    onTogglePreview: togglePreview,
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
      if (selectedSnippet && (activeView === 'snippets' || activeView === 'editor')) {
        handleRename()
      }
    },

    onDeleteSnippet: () => {
      if (selectedSnippet) {
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
        const targetId = selectedSnippet?.id || (selectedIds && selectedIds.length === 1 ? selectedIds[0] : null)
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
    onToggleFlow: () => {
      window.dispatchEvent(new CustomEvent('app:toggle-flow'))
    }
  })

  // Listen for custom zoom events which hook into useZoomLevel elsewhere or here?
  // Actually useZoomLevel is global hook, we can import it if needed or let components listen.
  // For now leaving zoom commands dispatching events or being handled by global listeners if they exist
  // Simplest is to just call the setZoom from context if passed, or ignore if managed globally.

  return null // Renderless text
}

export default KeyboardHandler
