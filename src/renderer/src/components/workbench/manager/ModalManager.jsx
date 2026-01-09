import React, { useContext, useState, useCallback, Suspense, lazy } from 'react'
import PropTypes from 'prop-types'
// NOTE: `useSettings` is intentionally not imported here to avoid accessing context outside provider

// Lazy load modals
const CommandPalette = lazy(() => import('../../CommandPalette'))
const ImageExportModal = lazy(() => import('../../CodeEditor/ImageExport/ImageExportModal'))
const SettingsModal = lazy(() => import('../../settings/SettingsModal'))
const SyncControlModal = lazy(() => import('../../sync/SyncControlModal'))
const KnowledgeGraphModal = lazy(() => import('../../Graph/KnowledgeGraphModal'))
const AIPilotModal = lazy(() => import('../../AI/AIPilotModal'))
const LivePreview = lazy(() => import('../../livepreview/LivePreview'))
import { docs } from '../../../documentation/content'
import UniversalModal from '../../universal/UniversalModal'
import { BookOpen } from 'lucide-react'

import { ModalContext } from './ModalContext'
import { sanitizeTitle } from '../../../utils/snippetUtils'
import { useTheme } from '../../../hook/useTheme'
import '../../Graph/KnowledgeGraphModal.css'
import Prompt from '../../universal/Prompt'
import TrashModal from './TrashModal'
// Loading fallback component
const ModalLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
    <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
  </div>
)

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                          MODAL MANAGER                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * FILE LOCATION:
 *   src/renderer/src/components/workbench/manager/ModalManager.jsx
 *
 * PARENT COMPONENTS:
 *   - SnippetLibrary.jsx (Wraps the entire app tree)
 *
 * CORE RESPONSIBILITY:
 *   Centralized state management for all global modals. It prevents "modal hell"
 *   by lifting state up and exposing simple open/close functions via Context.
 *
 * MANAGED MODALS:
 *   - SettingsModal (Lazy loaded)
 *   - CommandPalette (Lazy loaded)
 *   - TrashModal (Lazy loaded)
 *   - SyncControlModal (Lazy loaded)
 *   - ImageExportModal (Lazy loaded)
 *   - Prompt (Rename/Confirm) (Lazy loaded)
 *
 * FEATURES:
 *   - Code Splitting: All heavy modals are lazy-loaded to speed up initial app load.
 *   - Context API: Exposes `openXModal()` functions to any child component.
 *   - Suspense: Shows a lightweight loader while modals fetch.
 *   - Z-Index Management: Ensures critical prompts (like delete confirmation) appear on top.
 *
 * HOW TO USE:
 *   ```javascript
 *   import { useModal } from './manager/ModalContext'
 *
 *   const MyComponent = () => {
 *     const { openSettingsModal, openDeleteModal } = useModal()
 *     // ...
 *     return <button onClick={openSettingsModal}>Settings</button>
 *   }
 *   ```
 *
 * ARCHITECTURE NOTES:
 *   - Modals are rendered at the root level (inside this Provider), ensuring they
 *     are visually "on top" of the Workbench without complex z-index wars in CSS.
 *   - State is kept local to this component to avoid re-rendering the whole tree,
 *     except for the Context consumers.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ModalProvider = ({
  children,
  snippets,
  folders,
  trash,
  onRestoreItem,
  onPermanentDeleteItem,
  onLoadTrash,
  onSelectSnippet,
  selectedSnippet
}) => {
  const { currentTheme } = useTheme()
  // useSettings intentionally not used here; modals should request their own settings if needed
  const [promptInputValue, setPromptInputValue] = useState('')

  // Modal States
  const [renameModal, setRenameModal] = useState({
    isOpen: false,
    item: null,
    onConfirm: null,
    title: 'Rename Snippet'
  })
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    snippetId: null,
    onConfirm: null
  })
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [commandPaletteMode, setCommandPaletteMode] = useState(null) // null or 'command'
  const [imageExportModal, setImageExportModal] = useState({ isOpen: false, snippet: null })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false)
  const [isAIPilotOpen, setIsAIPilotOpen] = useState(false)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)

  // API exposed to consumers
  const openRenameModal = useCallback((item, onConfirm, customTitle = 'Rename Snippet') => {
    setRenameModal({ isOpen: true, item, onConfirm, title: customTitle || 'Rename Snippet' })
    setPromptInputValue(item?.title || item?.name || '') // Initialize input
  }, [])

  const openDeleteModal = useCallback((idOrIds, onConfirm) => {
    setDeleteModal({ isOpen: true, snippetId: idOrIds, onConfirm })
  }, [])

  const openImageExportModal = useCallback((snippet) => {
    setImageExportModal({ isOpen: true, snippet })
  }, [])

  const openSettingsModal = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const openTrashModal = useCallback(() => {
    setIsTrashOpen(true)
  }, [])

  const openSyncModal = useCallback(() => {
    setIsSyncModalOpen(true)
  }, [])

  const openGraphModal = useCallback(() => {
    setIsGraphModalOpen(true)
  }, [])

  const closeGraphModal = useCallback(() => {
    setIsGraphModalOpen(false)
  }, [])

  const openAIPilot = useCallback(() => {
    setIsAIPilotOpen(true)
  }, [])

  const closeAIPilot = useCallback(() => {
    setIsAIPilotOpen(false)
  }, [])

  const openManualModal = useCallback(() => {
    setIsManualModalOpen(true)
  }, [])

  const closeManualModal = useCallback(() => {
    setIsManualModalOpen(false)
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
    // 1. Close high-priority UI Prompts first (Rename/Delete/Export)
    if (renameModal.isOpen || deleteModal.isOpen || imageExportModal.isOpen) {
      setRenameModal({ isOpen: false, item: null, onConfirm: null })
      setDeleteModal({ isOpen: false, snippetId: null, onConfirm: null })
      setImageExportModal({ isOpen: false, snippet: null })
      return
    }

    // 2. Close navigation overlays
    if (isCommandPaletteOpen) {
      setIsCommandPaletteOpen(false)
      setCommandPaletteMode(null)
      return
    }

    // 3. Close the Manual/Graph last (since they often serve as base layers)
    if (isManualModalOpen) {
      setIsManualModalOpen(false)
      return
    }

    // 4. Fallback: Close everything else if no specific priority hit
    setIsSettingsOpen(false)
    setIsTrashOpen(false)
    setIsSyncModalOpen(false)
    setIsGraphModalOpen(false)
    setIsAIPilotOpen(false)
  }, [
    renameModal,
    deleteModal,
    imageExportModal,
    isCommandPaletteOpen,
    isManualModalOpen
  ])

  return (
    <ModalContext.Provider
      value={{
        openRenameModal,
        openDeleteModal,
        openImageExportModal,
        openSettingsModal,
        openSyncModal,
        openTrashModal,
        openGraphModal,
        closeGraphModal,
        toggleCommandPalette,
        closeAll,
        isSettingsOpen,
        isTrashOpen,
        isGraphModalOpen,
        isAnyOpen:
          renameModal.isOpen ||
          deleteModal.isOpen ||
          isCommandPaletteOpen ||
          imageExportModal.isOpen ||
          isSettingsOpen ||
          isTrashOpen ||
          isSyncModalOpen ||
          isGraphModalOpen ||
          isAIPilotOpen ||
          isManualModalOpen,
        openAIPilot,
        closeAIPilot,
        openManualModal,
        closeManualModal,
        isManualModalOpen
      }}
    >
      {children}

      {/* Knowledge Graph Modal - Ctrl+G */}
      <Suspense fallback={<ModalLoader />}>
        {isGraphModalOpen && (
          <KnowledgeGraphModal
            isOpen={isGraphModalOpen}
            onClose={closeGraphModal}
            snippets={snippets}
            onSelectSnippet={(snippet) => {
              closeGraphModal()
              onSelectSnippet(snippet)
            }}
          />
        )}
      </Suspense>

      {/* Render Modals at Root Level */}
      <Suspense fallback={<ModalLoader />}>
        {renameModal.isOpen && (
          <Prompt
            isOpen={true}
            zIndex={300000}
            title={renameModal.title}
            message={
              renameModal.item
                ? `Rename "${renameModal.item?.title || renameModal.item?.name || ''}"`
                : 'Enter a name'
            }
            confirmLabel="Confirm"
            showInput={true}
            inputValue={promptInputValue}
            onInputChange={(val) => setPromptInputValue(sanitizeTitle(val))}
            placeholder="Enter name..."
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
            zIndex={300000}
            variant="danger"
            title={
              deleteModal.snippetId === 'empty-trash'
                ? 'Empty Trash'
                : Array.isArray(deleteModal.snippetId)
                  ? 'Delete Selected'
                  : folders?.some((f) => f.id === deleteModal.snippetId)
                    ? 'Delete Folder'
                    : 'Delete Snippet'
            }
            message={
              deleteModal.snippetId === 'empty-trash' ? (
                <span>
                  Are you sure you want to{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    permanently delete all items
                  </span>{' '}
                  in the trash? This action cannot be undone.
                </span>
              ) : Array.isArray(deleteModal.snippetId) ? (
                <span>
                  Are you sure you want to delete{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {deleteModal.snippetId.length} items
                  </span>
                  ?
                </span>
              ) : (
                <span>
                  This action is permanent. Delete{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    "
                    {deleteModal.snippetId
                      ? snippets?.find((s) => s.id === deleteModal.snippetId)?.title ||
                        folders?.find((f) => f.id === deleteModal.snippetId)?.name
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

        {isSettingsOpen && (
          <SettingsModal
            isOpen={true}
            onClose={() => setIsSettingsOpen(false)}
            // SettingsModal should now use useSettings internally
          />
        )}

        {isTrashOpen && (
          <TrashModal
            isOpen={true}
            onClose={() => setIsTrashOpen(false)}
            items={trash || []}
            onRestore={onRestoreItem}
            onPermanentDelete={onPermanentDeleteItem}
            onLoadTrash={onLoadTrash}
            openDeleteModal={openDeleteModal}
          />
        )}

        {isSyncModalOpen && (
          <SyncControlModal isOpen={true} onClose={() => setIsSyncModalOpen(false)} />
        )}

        {isAIPilotOpen && (
          <AIPilotModal
            isOpen={true}
            onClose={() => setIsAIPilotOpen(false)}
            selectedSnippet={selectedSnippet}
          />
        )}

        {/* show documentation modal */}
        {isManualModalOpen && (
          <UniversalModal
            isOpen={true}
            onClose={() => setIsManualModalOpen(false)}
            title={
              <>
                <BookOpen size={14} className="text-[var(--color-accent-primary)]" />
              </>
            }
            width="90vw"
            height="90vh"
            resetPosition={false}
            className="no-padding documentation-modal knowledge-graph-modal-wrapper"
            noTab={true}
            hideBorder={true}
            allowMaximize={true}
            customKey="documentation_manager_modal"
            borderRadius={false}
            hideHeaderBorder={true}
            headerHeight={40}
            footer={
              <div className="nexus-modal-footer-stats">
                <div className="flex items-center gap-4 px-4 h-8 text-[11px] opacity-60 font-medium tracking-wide uppercase">
                  <span>Reference Manual</span>
                  <div className="w-[1px] h-3 bg-white/10" />
                  <span>V1.0</span>
                  <div className="w-[1px] h-3 bg-white/10" />
                  <span className="text-[var(--color-accent-primary)]">
                    Enterprise Edition
                  </span>
                </div>
              </div>
            }
          >
            <div className="h-full bg-[var(--color-bg-primary)] overflow-y-auto overflow-x-hidden pt-12 pb-24 px-4">
              <Suspense fallback={<ModalLoader />}>
                <LivePreview
                  code={docs['doc:manual']?.content || ''}
                  language="markdown"
                  snippets={snippets}
                  theme={currentTheme}
                  showHeader={false}
                  noScroll={true}
                />
              </Suspense>
            </div>
          </UniversalModal>
        )}
      </Suspense>
    </ModalContext.Provider>
  )
}

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
  snippets: PropTypes.array,
  folders: PropTypes.array,
  trash: PropTypes.array,
  onRestoreItem: PropTypes.func,
  onPermanentDeleteItem: PropTypes.func,
  onLoadTrash: PropTypes.func,
  onSelectSnippet: PropTypes.func,
  selectedSnippet: PropTypes.object
}

// useModal is now exported from ModalContext.js
