import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import Workbench from './Workbench'
import { useSettings, useZoomLevel, useEditorZoomLevel } from '../../hook/useSettingsContext'
import useAdvancedSplitPane from '../splitPanels/useAdvancedSplitPane.js'
import useFontSettings from '../../hook/settings/useFontSettings'
import { useView } from '../../context/ViewContext'
import { useModal } from './manager/ModalContext'
import KeyboardHandler from './manager/KeyboardHandler'
import { useThemeManager } from '../../hook/useThemeManager'
import { themeProps } from '../preference/theme/themeProps'
import { usePagination } from '../../hook/pagination/usePagination'

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

  // Use pagination hook
  const handleSearchResults = useCallback((searchResults) => {
    // Auto-select first search result if available
    if (searchResults.length > 0) {
      const firstResult = searchResults[0]
      setSelectedSnippet(firstResult)
      setSelectedFolderId(null)
      setSelectedIds([firstResult.id])
      navigateTo('editor')
    }
  }, [setSelectedSnippet, setSelectedFolderId, setSelectedIds, navigateTo])

  const {
    paginatedSnippets,
    totalPages,
    currentPage,
    hasSearchResults,
    isSearching,
    handlePageChange,
    handleSearchSnippets,
    clearSearch,
    resetPagination,
    hasMultiplePages,
    canGoNext,
    canGoPrevious
  } = usePagination(snippets, selectedFolderId, 5, handleSearchResults)

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
    if (activeView === 'editor' || isCreatingSnippet) {
      focusEditor()
    }
  }, [activeView, isCreatingSnippet, focusEditor])

  // --- Zoom Listeners ---
  useEffect(() => {
    const handleZoomIn = () => setZoomLevel((z) => z + 0.1)
    const handleZoomOut = () => setZoomLevel((z) => z - 0.1)
    const handleZoomReset = () => setZoomLevel(1.0)
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

  const createDraftSnippet = (initialTitle = '', folderId = null, options = {}) => {
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
        snippets
      }).then(() => focusEditor())
    })
  }

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

  const { setTheme, currentThemeId } = themeProps()
  const themeRef = React.useRef(currentThemeId)
  useEffect(() => {
    themeRef.current = currentThemeId
  }, [currentThemeId])

  useEffect(() => {
    const onCommandNew = () => {
      const parentId = selectedFolderId || selectedSnippet?.folder_id || null
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
      const next = !isActVisible
      updateSetting('ui.showActivityBar', next)
      updateSetting('ui.showSidebar', next)
      showToast(next ? 'Workspace expanded' : 'Zen Mode enabled', 'info')
    }
    const onCommandFlow = () => {
      const current = settings?.ui?.showFlowMode || false
      const next = !current
      updateSetting('ui.showFlowMode', next)

      // Auto-close standard preview to avoid layout conflicts in Flow Mode
      if (next && showPreview) {
        togglePreview()
      }

      if (next && window.api?.setFlowSize) {
        window.api.setFlowSize()
      } else if (!next && window.api?.restoreDefaultSize) {
        window.api.restoreDefaultSize()
      }
      // showToast(next ? 'Flow Mode enabled' : 'Flow Mode disabled', 'info')
    }
    const onCommandCopyImage = () => {
      if (selectedSnippet) openImageExportModal(selectedSnippet)
      else showToast('Open a snippet to export as image', 'info')
    }
    const onCommandOverlay = () => {
      setOverlayMode(!overlayMode)
      showToast(`Overlay Mode ${!overlayMode ? 'Enabled' : 'Disabled'}`, 'info')
    }
    const onCommandExportPDF = () => {
      window.dispatchEvent(new CustomEvent('app:trigger-export-pdf'))
    }
    const onResetWindow = () => {
      // 1. Reset Native Window
      if (window.api?.resetWindow) window.api.resetWindow()

      // 2. Reset UI settings to defaults (Visible)
      updateSetting('ui.showActivityBar', true)
      updateSetting('ui.showSidebar', true)
      updateSetting('ui.showHeader', true)
      updateSetting('ui.showStatusBar', true)
      updateSetting('ui.showFlowMode', false)

      showToast('Workspace Reset', 'success')
    }
    const onCommandStatusBar = () => {
      const current = settings?.ui?.showStatusBar !== false
      updateSetting('ui.showStatusBar', !current)
      showToast(`Status Bar ${!current ? 'Shown' : 'Hidden'}`, 'info')
    }
    const onCommandHeader = () => {
      const current = settings?.ui?.showHeader !== false
      updateSetting('ui.showHeader', !current)
      showToast(`Header ${!current ? 'Shown' : 'Hidden'}`, 'info')
    }

    window.addEventListener('app:command-new-snippet', onCommandNew)
    window.addEventListener('app:toggle-theme', onCommandTheme)
    window.addEventListener('app:toggle-sidebar', onCommandSidebar)
    window.addEventListener('app:toggle-preview', onCommandPreview)
    window.addEventListener('app:open-settings', onCommandSettings)
    window.addEventListener('app:toggle-activity-bar', onCommandActivityBar)
    window.addEventListener('app:toggle-zen', onCommandZen)
    window.addEventListener('app:toggle-flow', onCommandFlow)
    window.addEventListener('app:command-copy-image', onCommandCopyImage)
    window.addEventListener('app:toggle-overlay', onCommandOverlay)
    window.addEventListener('app:export-pdf', onCommandExportPDF)
    window.addEventListener('app:toggle-status-bar', onCommandStatusBar)
    window.addEventListener('app:toggle-header', onCommandHeader)
    window.addEventListener('app:reset-window', onResetWindow)

    return () => {
      window.removeEventListener('app:command-new-snippet', onCommandNew)
      window.removeEventListener('app:toggle-theme', onCommandTheme)
      window.removeEventListener('app:toggle-sidebar', onCommandSidebar)
      window.removeEventListener('app:toggle-preview', onCommandPreview)
      window.removeEventListener('app:open-settings', onCommandSettings)
      window.removeEventListener('app:toggle-activity-bar', onCommandActivityBar)
      window.removeEventListener('app:toggle-zen', onCommandZen)
      window.removeEventListener('app:toggle-flow', onCommandFlow)
      window.removeEventListener('app:command-copy-image', onCommandCopyImage)
      window.removeEventListener('app:toggle-overlay', onCommandOverlay)
      window.removeEventListener('app:export-pdf', onCommandExportPDF)
      window.removeEventListener('app:toggle-status-bar', onCommandStatusBar)
      window.removeEventListener('app:toggle-header', onCommandHeader)
      window.removeEventListener('app:reset-window', onResetWindow)
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
    selectedSnippet,
    settings?.ui?.showActivityBar,
    settings?.ui?.showSidebar,
    settings?.ui?.showStatusBar,
    settings?.ui?.showHeader,
    settings?.ui?.showFlowMode,
    updateSetting,
    openSettingsModal,
    openImageExportModal
  ])

  const handleNewFolder = (arg1 = {}, arg2 = null) => {
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

    const options = arg1 || {}
    const parentId = options.parentId || selectedFolderId || selectedSnippet?.folder_id || null

    openRenameModal(
      null,
      async (name) => {
        if (name && name.trim()) {
          try {
            await saveFolder({ name: name.trim(), parent_id: parentId })
            if (parentId) toggleFolderCollapse(parentId, false)
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

  const handleDeleteRequest = (id) => {
    openDeleteModal(id, async (targetId) => {
      await deleteItem(targetId)
    })
  }

  const handleSelectSnippet = (s) => {
    setSelectedSnippet(s)
    setSelectedFolderId(null)
    setSelectedIds(s ? [s.id] : [])
    navigateTo('editor')
  }

  const handleSelectFolder = (folderId) => {
    setSelectedFolderId(folderId)
    setSelectedIds(folderId ? [folderId] : [])
    resetPagination() // Reset to first page when changing folders
  }

  const handleSelectionChange = (ids) => {
    setSelectedIds(ids)
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
          setRenameModal: () => {},
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
          snippets={paginatedSnippets}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          setSnippets={setSnippets}
          saveSnippet={saveSnippet}
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
          onAutosave={(s) => setAutosaveStatus(s)}
          onSave={async (item) => {
            try {
              if (item.title && item.title.trim()) {
                const normalize = (t) => (t || '').toLowerCase().trim().replace(/\.md$/, '')
                const targetBase = normalize(item.title)
                const duplicate = snippets.find(
                  (s) =>
                    normalize(s.title) === targetBase &&
                    (s.folder_id || null) === (item.folder_id || null) &&
                    s.id !== item.id
                )
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
              if (e.message && e.message.includes('DUPLICATE_TITLE'))
                showToast('Title conflict: Name already taken (DB)', 'error')
              else console.error(e)
            }
          }}
          onNewRequest={() => createDraftSnippet()}
          onDeleteRequest={handleDeleteRequest}
          onBulkDeleteRequest={handleBulkDelete}
          onNewSnippet={async (title, folderId, options) => {
            const parentId = folderId || selectedFolderId || selectedSnippet?.folder_id || null
            const draft = createDraftSnippet(title, parentId, options)
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
          onSearchSnippets={handleSearchSnippets}
          onOpenSettings={() => openSettingsModal()}
          isSettingsOpen={isSettingsOpen}
          onCloseSettings={() => navigateTo('snippets')}
          onRename={handleRenameRequest}
        />
      </div>
    </div>
  )
}

export default SnippetLibraryInner
