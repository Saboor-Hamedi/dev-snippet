import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import { useSnippetData } from '../../hook/useSnippetData'
import { handleRenameSnippet } from '../../hook/handleRenameSnippet'
import Workbench from './Workbench'
import { useSettings, useZoomLevel, useEditorZoomLevel } from '../../hook/useSettingsContext'
import useAdvancedSplitPane from '../splitPanels/useAdvancedSplitPane.js'
import useFontSettings from '../../hook/settings/useFontSettings'
// Removed redundant import from useZoomLevel wrapper
import { ViewProvider, useView } from '../../context/ViewContext'
import { ModalProvider, useModal } from './manager/ModalManager'
import KeyboardHandler from './manager/KeyboardHandler'
import { useThemeManager } from '../../hook/useThemeManager'
import { themeProps } from '../preference/theme/themeProps'

// The Core Logic Component
const SnippetLibraryInner = ({ snippetData }) => {
  const {
    snippets,
    selectedSnippet,
    setSelectedSnippet,
    setSnippets,
    saveSnippet,
    deleteItem,
    deleteItems,
    searchSnippetList,
    // Folder props
    folders,
    saveFolder,
    deleteFolder,
    deleteFolders,
    toggleFolderCollapse,
    moveSnippet,
    moveFolder,
    togglePinnedSnippet,
    // Trash props
    trash,
    loadTrash,
    restoreItem,
    permanentDeleteItem
  } = snippetData
  const { activeView, showPreview, togglePreview, navigateTo } = useView()
  const {
    openRenameModal,
    openDeleteModal,
    openImageExportModal,
    openSettingsModal,
    isSettingsOpen
  } = useModal()
  const { settings, getSetting, updateSetting } = useSettings()
  const { toast, showToast } = useToast()

  // Ensure global settings are applied when this component mounts/updates
  useFontSettings()
  useThemeManager()

  const isCompact = getSetting('ui.compactMode') || false
  const setIsCompact = (val) => updateSetting('ui.compactMode', val)

  const [autosaveStatus, setAutosaveStatus] = useState(null)
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)
  const [zoomLevel, setZoomLevel] = useZoomLevel()
  const [editorZoom, setEditorZoom] = useEditorZoomLevel()
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const { overlayMode, setOverlayMode } = useAdvancedSplitPane()

  // Lifted Sidebar State - defaults to closed, remembers last state
  const isSidebarOpen = settings?.ui?.showSidebar !== false
  const handleToggleSidebar = useCallback(() => {
    updateSetting('ui.showSidebar', !isSidebarOpen)
  }, [isSidebarOpen, updateSetting])

  const focusEditor = useCallback(() => {
    if (activeView !== 'editor' && !isCreatingSnippet) return
    setTimeout(() => {
      const el =
        document.querySelector('.editor-container .cm-content') ||
        document.querySelector('.editor-container textarea')
      if (el?.focus) el.focus()
    }, 50)
  }, [activeView, isCreatingSnippet])

  // --- Navigation Listeners ---
  useEffect(() => {
    // When returning to the editor area, proactively attempt to grab focus.
    // This solves the "missing caret" issue when returning from settings.
    if (activeView === 'editor' || isCreatingSnippet) {
      focusEditor()
    }
  }, [activeView, isCreatingSnippet, focusEditor])

  // --- Zoom Listeners ---
  useEffect(() => {
    // 1. Global UI Zoom Level (Keyboard)
    const handleZoomIn = () => setZoomLevel((z) => z + 0.1)
    const handleZoomOut = () => setZoomLevel((z) => z - 0.1)
    const handleZoomReset = () => setZoomLevel(1.0)

    // 2. Editor-Only Local Zoom (Mouse Wheel)
    const handleEditorZoomIn = () => setEditorZoom((z) => z + 0.1)
    const handleEditorZoomOut = () => setEditorZoom((z) => z - 0.1)

    window.addEventListener('app:zoom-in', handleZoomIn)
    window.addEventListener('app:zoom-out', handleZoomOut)
    window.addEventListener('app:zoom-reset', handleZoomReset)

    window.addEventListener('app:editor-zoom-in', handleEditorZoomIn)
    window.addEventListener('app:editor-zoom-out', handleEditorZoomOut)

    return () => {
      window.removeEventListener('app:zoom-in', handleZoomIn)
      window.removeEventListener('app:zoom-out', handleZoomOut)
      window.removeEventListener('app:zoom-reset', handleZoomReset)
      window.removeEventListener('app:editor-zoom-in', handleEditorZoomIn)
      window.removeEventListener('app:editor-zoom-out', handleEditorZoomOut)
    }
  }, [setZoomLevel, setEditorZoom])

  // --- Draft Logic ---
  const createDraftSnippet = (initialTitle = '', folderId = null, options = {}) => {
    // Singleton Pattern: If an empty draft exists, reuse it instead of creating a new one.
    if (!initialTitle && !folderId) {
      const existingBlank = snippets.find(
        (s) =>
          (!s.title || s.title.trim() === '') && (!s.code || s.code.trim() === '') && !s.folder_id
      )

      if (existingBlank) {
        if (!options.skipNavigation) {
          setSelectedSnippet(existingBlank)
          setIsCreatingSnippet(true)
          navigateTo('editor')
        }
        showToast('Resuming empty draft', 'info')
        return existingBlank
      }
    }

    console.log('[SnippetLibrary] Creating draft:', { initialTitle, folderId })

    const draft = {
      id: window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: initialTitle,
      code: '',
      timestamp: Date.now(),
      type: 'snippet',
      is_draft: true,
      folder_id: folderId
    }
    setSnippets((prev) => [draft, ...prev])

    if (!options.skipNavigation) {
      setSelectedSnippet(draft)
      setIsCreatingSnippet(true)
      navigateTo('editor')
    }
    return draft
  }

  const handleRenameRequest = () => {
    // Proceed directly to rename modal, even for drafts
    openRenameModal(selectedSnippet, (newName) => {
      handleRenameSnippet({
        renameModal: { newName, item: selectedSnippet },
        saveSnippet,
        setSelectedSnippet,
        setRenameModal: () => {},
        setIsCreatingSnippet,
        renameSnippet: (oldId, updated) => {
          setSnippets((prev) => [...prev.filter((s) => s.id !== oldId), updated])
        },
        showToast,
        snippets // Pass snippets for validation
      }).then(() => focusEditor())
    })
  }

  // --- Ghost Linking ---
  useEffect(() => {
    const handleOpenRequest = (e) => {
      const { title } = e.detail
      if (!title) return
      const search = title.trim().toLowerCase()
      const target = snippets.find((s) => (s.title || '').toLowerCase().trim() === search)
      if (target) {
        setSelectedSnippet(target)
        navigateTo('editor')
      } else {
        const finalTitle = search.endsWith('.md') ? title.trim() : `${title.trim()}.md`
        showToast(`Navigating to ${finalTitle}...`, 'info')
        createDraftSnippet(finalTitle)
      }
    }
    window.addEventListener('app:open-snippet', handleOpenRequest)
    return () => window.removeEventListener('app:open-snippet', handleOpenRequest)
  }, [snippets, showToast, navigateTo, setSelectedSnippet])

  // --- Command Palette Actions ---
  const { setTheme, currentThemeId } = themeProps()
  const themeRef = React.useRef(currentThemeId)
  useEffect(() => {
    themeRef.current = currentThemeId
  }, [currentThemeId])

  useEffect(() => {
    const onCommandNew = () => {
      const parentId = selectedFolderId || selectedSnippet?.folder_id || null
      // Trigger inline creation in Sidebar instead of direct draft
      window.dispatchEvent(
        new CustomEvent('app:sidebar-start-creation', { detail: { type: 'snippet', parentId } })
      )
    }
    const onCommandTheme = () => {
      const current = themeRef.current
      const next = current === 'polaris' ? 'midnight-pro' : 'polaris'
      setTheme(next)
      showToast(`Theme switched to ${next === 'polaris' ? 'Light' : 'Dark'}`, 'info')
    }
    const onCommandSidebar = () => handleToggleSidebar()
    const onCommandPreview = () => togglePreview()
    const onCommandSettings = () => openSettingsModal()
    const onCommandActivityBar = () => {
      const current = settings?.ui?.showActivityBar !== false
      updateSetting('ui.showActivityBar', !current)
      showToast(`Activity Bar ${!current ? 'Shown' : 'Hidden'}`, 'info')
    }
    const onCommandZen = () => {
      const isActVisible = settings?.ui?.showActivityBar !== false
      const isSideVisible = settings?.ui?.showSidebar !== false
      const next = !isActVisible // Toggle based on activity bar state
      updateSetting('ui.showActivityBar', next)
      updateSetting('ui.showSidebar', next)
      showToast(next ? 'Workspace expanded' : 'Zen Mode enabled', 'info')
    }
    const onCommandFocus = () => {
      const current = settings?.ui?.showFocusMode || false
      const next = !current
      updateSetting('ui.showFocusMode', next)

      if (next && window.api?.setFocusSize) {
        window.api.setFocusSize()
      } else if (!next && window.api?.restoreDefaultSize) {
        window.api.restoreDefaultSize()
      }

      showToast(next ? 'Focus Mode enabled' : 'Focus Mode disabled', 'info')
    }
    const onCommandCopyImage = () => {
      if (selectedSnippet) {
        openImageExportModal(selectedSnippet)
      } else {
        showToast('Open a snippet to export as image', 'info')
      }
    }
    const onCommandOverlay = () => {
      setOverlayMode(!overlayMode)
      showToast(`Overlay Mode ${!overlayMode ? 'Enabled' : 'Disabled'}`, 'info')
    }
    const onCommandExportPDF = () => {
      window.dispatchEvent(new CustomEvent('app:trigger-export-pdf'))
    }

    window.addEventListener('app:command-new-snippet', onCommandNew)
    window.addEventListener('app:toggle-theme', onCommandTheme)
    window.addEventListener('app:toggle-sidebar', onCommandSidebar)
    window.addEventListener('app:toggle-preview', onCommandPreview)
    window.addEventListener('app:open-settings', onCommandSettings)
    window.addEventListener('app:toggle-activity-bar', onCommandActivityBar)
    window.addEventListener('app:toggle-zen', onCommandZen)
    window.addEventListener('app:toggle-focus', onCommandFocus)
    window.addEventListener('app:command-copy-image', onCommandCopyImage)
    window.addEventListener('app:toggle-overlay', onCommandOverlay)
    window.addEventListener('app:export-pdf', onCommandExportPDF)

    return () => {
      window.removeEventListener('app:command-new-snippet', onCommandNew)
      window.removeEventListener('app:toggle-theme', onCommandTheme)
      window.removeEventListener('app:toggle-sidebar', onCommandSidebar)
      window.removeEventListener('app:toggle-preview', onCommandPreview)
      window.removeEventListener('app:open-settings', onCommandSettings)
      window.removeEventListener('app:toggle-activity-bar', onCommandActivityBar)
      window.removeEventListener('app:toggle-zen', onCommandZen)
      window.removeEventListener('app:toggle-focus', onCommandFocus)
      window.removeEventListener('app:command-copy-image', onCommandCopyImage)
      window.removeEventListener('app:toggle-overlay', onCommandOverlay)
      window.removeEventListener('app:export-pdf', onCommandExportPDF)
    }
  }, [
    createDraftSnippet,
    handleToggleSidebar,
    togglePreview,
    navigateTo,
    setTheme,
    showToast,
    overlayMode,
    setOverlayMode,
    selectedFolderId,
    selectedSnippet
  ])

  const handleNewFolder = (arg1 = {}, arg2 = null) => {
    // Case 1: Inline Creation (Name provided directly from Sidebar)
    if (typeof arg1 === 'string') {
      const name = arg1
      const parentId = arg2
      if (name && name.trim()) {
        saveFolder({ name: name.trim(), parent_id: parentId })
          .then(() => {
            if (parentId) toggleFolderCollapse(parentId, false)
            showToast(`Folder "${name}" created`, 'success')
          })
          .catch((e) => {
            console.error('Failed to create folder:', e)
            showToast('Failed to create folder', 'error')
          })
      }
      return
    }

    // Case 2: Command/Button Request (No name yet -> Open Modal)
    const options = arg1 || {}
    const parentId = options.parentId || selectedFolderId || selectedSnippet?.folder_id || null

    openRenameModal(
      null,
      async (name) => {
        if (name && name.trim()) {
          try {
            await saveFolder({
              name: name.trim(),
              parent_id: parentId
            })
            if (parentId) {
              toggleFolderCollapse(parentId, false)
            }
            showToast(`Folder "${name}" created`, 'success')
          } catch (e) {
            console.error('Failed to create folder:', e)
            showToast('Failed to create folder', 'error')
          }
        }
      },
      'New Folder'
    )
  }
  // --- Handlers for Workbench ---
  const handleDeleteRequest = (id) => {
    openDeleteModal(id, async (targetId) => {
      await deleteItem(targetId)
    })
  }

  const handleSelectSnippet = (s) => {
    setSelectedSnippet(s)
    setSelectedFolderId(null) // Focus moves to snippet, clear explicit folder selection
    setSelectedIds(s ? [s.id] : [])
    navigateTo('editor')
  }

  const handleSelectFolder = (folderId) => {
    setSelectedFolderId(folderId)
    setSelectedIds(folderId ? [folderId] : [])
  }

  const handleSelectionChange = (ids) => {
    setSelectedIds(ids)
    // If only one snippet is selected, select it as the active one
    if (ids.length === 1) {
      const snippet = snippets.find((s) => s.id === ids[0])
      if (snippet) {
        setSelectedSnippet(snippet)
        setSelectedFolderId(null)
      } else {
        setSelectedFolderId(ids[0])
      }
    }
  }

  const handleBulkDelete = (ids) => {
    openDeleteModal(
      ids,
      async (targetIds) => {
        // Logic inside SnippetLibraryInner already knows snippets vs folders if we pass both
        // But let's keep it simple: find which are folders and which are snippets
        const folderIds = ids.filter((id) => folders.some((f) => f.id === id))
        const snippetIds = ids.filter((id) => snippets.some((s) => s.id === id))

        if (snippetIds.length > 0) await deleteItems(snippetIds)
        if (folderIds.length > 0) await deleteFolders(folderIds)

        setSelectedIds([])
      },
      ids.length > 1 ? `${ids.length} items` : 'item'
    )
  }

  const handleRenameFolder = (folder) => {
    openRenameModal(
      folder,
      async (newName) => {
        if (newName && newName.trim()) {
          try {
            await saveFolder({ ...folder, name: newName.trim() })
            showToast(`Folder renamed to "${newName}"`, 'success')
          } catch (e) {
            console.error('Failed to rename folder:', e)
            showToast('Failed to rename folder', 'error')
          }
        }
      },
      'Rename Folder'
    )
  }

  const handleDeleteFolder = (folderId) => {
    // We reuse the openDeleteModal but we need a specific folder delete version if it differs
    // For now, let's assume it works for IDs.
    // Wait, the delete modal might be specifically for snippets.
    // Let's check how deleteFolder is handled.
    openDeleteModal(
      folderId,
      async (id) => {
        try {
          await deleteFolder(id)
          showToast('Folder deleted', 'success')
        } catch (e) {
          showToast('Failed to delete folder', 'error')
        }
      },
      'Folder'
    )
  }

  const handleRenameSnippetRequest = (snippet) => {
    openRenameModal(
      snippet,
      async (newName) => {
        handleRenameSnippet({
          renameModal: { item: snippet, newName },
          saveSnippet,
          setSelectedSnippet,
          setRenameModal: () => {}, // Modal already closing
          setIsCreatingSnippet: () => {},
          showToast,
          snippets
        })
      },
      'Rename Snippet'
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      <ToastNotification toast={toast} />
      <KeyboardHandler
        selectedSnippet={selectedSnippet}
        setSelectedSnippet={setSelectedSnippet}
        saveSnippet={saveSnippet}
        deleteItem={deleteItem}
        setAutosaveStatus={setAutosaveStatus}
        createDraftSnippet={createDraftSnippet}
        focusEditor={focusEditor}
        isCreatingSnippet={isCreatingSnippet}
        setIsCreatingSnippet={setIsCreatingSnippet}
        showToast={showToast}
        handleRename={handleRenameRequest}
        onToggleSidebar={handleToggleSidebar}
        onTogglePin={togglePinnedSnippet}
        // Selection Props
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolderId}
      />

      <div className="flex-1 flex flex-col items-stretch min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Workbench
          settings={settings}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={(val) => updateSetting('ui.showSidebar', val)}
          activeView={isCreatingSnippet ? 'editor' : activeView}
          currentContext={activeView}
          selectedSnippet={selectedSnippet}
          snippets={snippets}
          folders={folders}
          trash={trash}
          onRestoreItem={restoreItem}
          onPermanentDeleteItem={permanentDeleteItem}
          onLoadTrash={loadTrash}
          onCloseSnippet={() => {
            setIsCreatingSnippet(false)
            setSelectedSnippet(null)
            navigateTo('snippets')
          }}
          onCancelEditor={() => {
            setIsCreatingSnippet(false)
            navigateTo('snippets')
          }}
          isCompact={isCompact}
          onToggleCompact={() => setIsCompact(!isCompact)}
          showPreview={showPreview}
          onTogglePreview={togglePreview}
          showToast={showToast}
          hideWelcomePage={settings?.welcome?.hideWelcomePage || false}
          autosaveStatus={autosaveStatus}
          onAutosave={(s) => {
            setAutosaveStatus(s)
          }}
          onSave={async (item) => {
            try {
              // Client-Side Robust Check (Normalize extension)
              if (item.title && item.title.trim()) {
                const normalize = (t) => (t || '').toLowerCase().trim().replace(/\.md$/, '')
                const targetBase = normalize(item.title)

                const duplicate = snippets.find((s) => {
                  const titleMatch = normalize(s.title) === targetBase
                  const folderMatch = (s.folder_id || null) === (item.folder_id || null)
                  return titleMatch && folderMatch && s.id !== item.id
                })
                if (duplicate) {
                  showToast(`${item.title}: already taken in this folder`, 'error')
                  setAutosaveStatus(null)
                  return
                }
              }

              const wasForce = !!window.__forceSave
              if (!wasForce) setAutosaveStatus('saving')
              await saveSnippet(item)
              if (isCreatingSnippet) {
                setIsCreatingSnippet(false)
                setSelectedSnippet(item)
              }
              if (wasForce) window.__forceSave = false
              setAutosaveStatus('saved')
            } catch (e) {
              setAutosaveStatus(null)
              if (e.message && e.message.includes('DUPLICATE_TITLE')) {
                showToast('Title conflict: Name already taken (DB)', 'error')
              } else {
                console.error(e)
              }
            }
          }}
          onNewRequest={() => createDraftSnippet()}
          onDeleteRequest={handleDeleteRequest}
          onBulkDeleteRequest={handleBulkDelete}
          onNewSnippet={async (title, folderId, options) => {
            const parentId = folderId || selectedFolderId || selectedSnippet?.folder_id || null
            const draft = createDraftSnippet(title, parentId, options)

            // If explicit title provided (Sidebar creation), save to DB immediately
            if (title && title.trim()) {
              await saveSnippet({ ...draft, is_draft: false }, { skipSelectedUpdate: true })
            }
          }}
          onRenameSnippet={handleRenameSnippetRequest}
          onNewFolder={handleNewFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onDeleteBulk={handleBulkDelete}
          selectedFolderId={selectedFolderId}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onSelectFolder={handleSelectFolder}
          onToggleFolder={toggleFolderCollapse}
          onMoveSnippet={moveSnippet}
          onMoveFolder={moveFolder}
          onTogglePin={togglePinnedSnippet}
          onSelectSnippet={handleSelectSnippet}
          onSearchSnippets={searchSnippetList}
          onOpenSettings={() => openSettingsModal()}
          isSettingsOpen={isSettingsOpen}
          onCloseSettings={() => navigateTo('snippets')}
          onRename={handleRenameRequest}
        />
      </div>
    </div>
  )
}

// Wrapper Component to inject Providers
const SnippetLibrary = () => {
  const snippetData = useSnippetData() // Global data

  return (
    <ViewProvider>
      <ModalProvider
        snippets={snippetData.snippets}
        folders={snippetData.folders}
        onSelectSnippet={(s) => {
          // Dispatch event to be handled by Inner component which has full context access
          // This ensures we switch views (e.g. out of Settings) and set selection correctly
          window.dispatchEvent(
            new CustomEvent('app:open-snippet', {
              detail: { title: s.title }
            })
          )
        }}
      >
        <SnippetLibraryInner snippetData={snippetData} />
      </ModalProvider>
    </ViewProvider>
  )
}

export default SnippetLibrary
