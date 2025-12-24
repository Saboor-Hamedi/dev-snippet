import React, { createContext, useContext, useState, useCallback, Suspense, lazy } from 'react'
import PropTypes from 'prop-types'

// Lazy load modals
const Prompt = lazy(() => import('../../modal/Prompt'))
const CommandPalette = lazy(() => import('../../CommandPalette'))
const ImageExportModal = lazy(() => import('../../CodeEditor/ImageExport/ImageExportModal'))

const ModalContext = createContext()

// Loading fallback component
const ModalLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
    <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
  </div>
)

export const ModalProvider = ({ children, snippets, onSelectSnippet }) => {
  // Input State for Prompts
  const [promptInputValue, setPromptInputValue] = useState('')

  // Modal States
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null, onConfirm: null })
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    snippetId: null,
    onConfirm: null
  })
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [commandPaletteMode, setCommandPaletteMode] = useState(null) // null or 'command'
  const [imageExportModal, setImageExportModal] = useState({ isOpen: false, snippet: null })

  // API exposed to consumers
  const openRenameModal = useCallback((item, onConfirm) => {
    setRenameModal({ isOpen: true, item, onConfirm })
    setPromptInputValue(item?.title || '') // Initialize input
  }, [])

  const openDeleteModal = useCallback((snippetId, onConfirm) => {
    setDeleteModal({ isOpen: true, snippetId, onConfirm })
  }, [])

  const openImageExportModal = useCallback((snippet) => {
    setImageExportModal({ isOpen: true, snippet })
  }, [])

  const toggleCommandPalette = useCallback(
    (forceCommandMode = false) => {
      setIsCommandPaletteOpen((prev) => {
        // If pressing "Ctrl+Shift+P" while "Ctrl+P" is already open -> Switch mode, don't close
        if (prev && forceCommandMode) {
          setCommandPaletteMode('command')
          return true
        }

        // If pressing "Ctrl+P" (search) while "Ctrl+Shift+P" (command) is open -> Switch to search, don't close
        if (prev && !forceCommandMode && commandPaletteMode === 'command') {
          setCommandPaletteMode(null)
          return true
        }

        // Standard Toggle Behavior
        if (!prev) {
          if (forceCommandMode) setCommandPaletteMode('command')
          else setCommandPaletteMode(null)
          return true
        }

        // Closing
        setCommandPaletteMode(null)
        return false
      })
    },
    [commandPaletteMode]
  ) // Added dependency

  const closeAll = useCallback(() => {
    setRenameModal({ isOpen: false, item: null, onConfirm: null })
    setDeleteModal({ isOpen: false, snippetId: null, onConfirm: null })
    setIsCommandPaletteOpen(false)
    setCommandPaletteMode(null)
    setImageExportModal({ isOpen: false, snippet: null })
  }, [])

  return (
    <ModalContext.Provider
      value={{
        openRenameModal,
        openDeleteModal,
        openImageExportModal,
        toggleCommandPalette,
        closeAll,
        isAnyOpen:
          renameModal.isOpen ||
          deleteModal.isOpen ||
          isCommandPaletteOpen ||
          imageExportModal.isOpen
      }}
    >
      {children}

      {/* Render Modals at Root Level */}
      <Suspense fallback={<ModalLoader />}>
        {renameModal.isOpen && (
          <Prompt
            isOpen={true}
            title="Rename Snippet"
            message={`Rename "${renameModal.item?.title || ''}"`}
            confirmLabel="Rename"
            showInput={true}
            inputValue={promptInputValue}
            onInputChange={setPromptInputValue}
            placeholder="Enter snippet name..."
            onClose={() => setRenameModal((prev) => ({ ...prev, isOpen: false }))}
            onConfirm={(newName) => {
              if (renameModal.onConfirm) renameModal.onConfirm(newName)
              setRenameModal((prev) => ({ ...prev, isOpen: false }))
            }}
          />
        )}

        {deleteModal.isOpen && (
          <Prompt
            isOpen={true}
            variant="danger"
            title={deleteModal.snippetId === 'empty-trash' ? 'Empty Trash' : 'Delete Snippet'}
            message={
              deleteModal.snippetId === 'empty-trash' ? (
                <span>
                  Are you sure you want to{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    permanently delete all items
                  </span>{' '}
                  in the trash? This action cannot be undone.
                </span>
              ) : (
                <span>
                  This action is permanent. Delete{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    "
                    {deleteModal.snippetId
                      ? snippets?.find((s) => s.id === deleteModal.snippetId)?.title
                      : 'this'}
                    "
                  </span>
                  ?
                </span>
              )
            }
            confirmLabel="Delete"
            onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
            onConfirm={async () => {
              if (deleteModal.onConfirm) await deleteModal.onConfirm(deleteModal.snippetId)
              setDeleteModal((prev) => ({ ...prev, isOpen: false }))
            }}
          />
        )}

        {isCommandPaletteOpen && (
          <CommandPalette
            isOpen={true}
            initialMode={commandPaletteMode}
            onClose={() => {
              setIsCommandPaletteOpen(false)
              setCommandPaletteMode(null)
            }}
            snippets={snippets}
            onSelect={(item) => {
              if (onSelectSnippet) onSelectSnippet(item)
              setIsCommandPaletteOpen(false)
              setCommandPaletteMode(null)
            }}
          />
        )}

        {imageExportModal.isOpen && (
          <ImageExportModal
            isOpen={true}
            snippet={imageExportModal.snippet}
            onClose={() => setImageExportModal({ isOpen: false, snippet: null })}
          />
        )}
      </Suspense>
    </ModalContext.Provider>
  )
}

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
  snippets: PropTypes.array,
  onSelectSnippet: PropTypes.func
}

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModal must be used within a ModalProvider')
  return context
}
