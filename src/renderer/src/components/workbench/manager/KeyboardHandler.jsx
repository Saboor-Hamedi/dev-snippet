import { useEffect } from 'react'
import { useKeyboardShortcuts } from '../../../hook/useKeyboardShortcuts'
import { useModal } from './ModalManager'
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
  handleRename // Pass the rename logic function
}) => {
  const { toggleCommandPalette, openDeleteModal, openRenameModal, isAnyOpen, closeAll } = useModal()
  const { activeView, navigateTo, togglePreview, showPreview } = useView()

  useKeyboardShortcuts({
    onEscapeMenusOnly: () => {
      // Priority 1: Close Modals
      if (isAnyOpen) {
        closeAll()
        focusEditor()
        return true
      }
      // Priority 2: Close creating mode or settings
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

    // ... Settings toggle is handled in Workbench usually via header, but shortcut can be here
    onToggleSettings: () => {
      if (activeView === 'settings') navigateTo('snippets')
      else navigateTo('settings')
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
            setAutosaveStatus('saved')
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
    onZoomReset: () => window.dispatchEvent(new CustomEvent('app:zoom-reset'))
  })

  // Listen for custom zoom events which hook into useZoomLevel elsewhere or here?
  // Actually useZoomLevel is global hook, we can import it if needed or let components listen.
  // For now leaving zoom commands dispatching events or being handled by global listeners if they exist
  // Simplest is to just call the setZoom from context if passed, or ignore if managed globally.

  return null // Renderless text
}

export default KeyboardHandler
