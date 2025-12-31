import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import Workbench from './Workbench'
import { useSettings, useZoomLevel, useEditorZoomLevel } from '../../hook/useSettingsContext'
import useAdvancedSplitPane from '../splitPanels/useAdvancedSplitPane.js'
import useFontSettings from '../../hook/settings/useFontSettings'
import { useView } from '../../context/ViewContext'
import { useModal } from './manager/ModalContext'
import KeyboardHandler from './manager/KeyboardHandler'
import AltPHandler from './AltPHandler'
import PinPopover from './sidebar/PinPopover'
import { useThemeManager } from '../../hook/useThemeManager'
import { themeProps } from '../preference/theme/themeProps'
import { usePagination } from '../../hook/pagination/usePagination'
import { handleRenameSnippet } from '../../hook/handleRenameSnippet'
import { useFlowMode } from '../FlowMode/useFlowMode'
import { getBaseTitle } from '../../utils/snippetUtils'
import { useSessionRestore } from '../../hook/session/useSessionRestore'

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
  useFlowMode({ showPreview, togglePreview })

  // Sync Zen Focus state to global UI
  useEffect(() => {
    if (settings?.ui?.zenFocus) {
      document.body.classList.add('zen-focus-active')
    } else {
      document.body.classList.remove('zen-focus-active')
    }
  }, [settings?.ui?.zenFocus])

  // Session Restoration (P1 Feature)

  const isCompact = getSetting('ui.compactMode') || false
  const setIsCompact = (val) => updateSetting('ui.compactMode', val)

  const [autosaveStatus, setAutosaveStatus] = useState(null)
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)
  const [zoomLevel, setZoomLevel] = useZoomLevel()
  const [editorZoom, setEditorZoom] = useEditorZoomLevel()
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [pinPopover, setPinPopover] = useState({ visible: false, x: 0, y: 0, snippetId: null })
  const { overlayMode, setOverlayMode } = useAdvancedSplitPane()

  // Clipboard state for cut/copy/paste operations
  const [clipboard, setClipboard] = useState(null) // { type: 'cut'|'copy', items: [{id, type, data}] }

  // Use pagination hook
  const handleSearchResults = useCallback(
    (searchResults) => {
      // Auto-select first search result if available and pagination allows it
      if (searchResults.length > 0) {
        const firstResult = searchResults[0]
        setSelectedSnippet(firstResult)
        setSelectedFolderId(null)
        setSelectedIds([firstResult.id])
        navigateTo('editor')
      }
    },
    [setSelectedSnippet, setSelectedFolderId, setSelectedIds, navigateTo]
  )

  const {
    paginatedSnippets,
    totalPages,
    currentPage,
    hasSearchResults,
    isSearching,
    searchQuery,
    handlePageChange,
    handleSearchSnippets,
    clearSearch,
    resetPagination,
    hasMultiplePages,
    canGoNext,
    canGoPrevious,
    enablePagination
  } = usePagination(snippets, null, handleSearchResults)

  // Wrap handleSearchSnippets to clear folder selection when search is cleared
  const handleSearchSnippetsWrapped = useCallback(
    (query) => {
      handleSearchSnippets(query)
      if (!query || !query.trim()) {
        setSelectedFolderId(null)
      }
    },
    [handleSearchSnippets, setSelectedFolderId]
  )

  // Lifted Sidebar State - defaults to closed, remembers last state
  const isSidebarOpen = settings?.ui?.showSidebar !== false
  const handleToggleSidebar = useCallback(() => {
    updateSetting('ui.showSidebar', !isSidebarOpen)
  }, [isSidebarOpen, updateSetting])

  const handleSelectSnippet = useCallback(
    (s) => {
      try {
        console.debug(
          '[handleSelectSnippet] called with:',
          s && { id: s.id, title: s.title, is_draft: s.is_draft }
        )
      } catch (e) {}
      if (!s) {
        setSelectedSnippet(null)
        setSelectedFolderId(null)
        setSelectedIds([])
        return
      }

      setSelectedSnippet(s)
      setSelectedFolderId(null)
      setSelectedIds([s.id])

      // Only switch pages if pagination is enabled AND the snippet is not currently visible
      // This prevents unwanted pagination when clicking snippets already visible in sidebar
      if (enablePagination) {
        // Check if the snippet is already in the current paginated results
        const isSnippetVisible = paginatedSnippets.some((snippet) => snippet.id === s.id)
        if (!isSnippetVisible) {
          // Snippet is not visible, calculate which page it should be on
          const snippetIndex = snippets.findIndex((snippet) => snippet.id === s.id)
          if (snippetIndex !== -1) {
            const pageSize = getSetting('pagination.pageSize') || 5
            const targetPage = Math.floor(snippetIndex / pageSize) + 1

            if (targetPage !== currentPage) {
              handlePageChange(targetPage)
            }
          }
        }
      }

      navigateTo('editor')
    },
    [
      setSelectedSnippet,
      setSelectedFolderId,
      setSelectedIds,
      enablePagination,
      paginatedSnippets,
      snippets,
      getSetting,
      currentPage,
      handlePageChange,
      navigateTo
    ]
  )

  // Session Restoration (P1 Feature) - Must be after state init & handler definition
  const { isRestoring } = useSessionRestore({
    snippets,
    selectedSnippet,
    selectedFolderId,
    activeView,
    setSelectedSnippet, // Reverted to stable setter to prevent loop
    setSelectedFolderId,
    navigateTo
  })

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

  const createDailyNote = async () => {
    const now = new Date()
    // Standard ISO title: e.g. "2025-12-27"
    const dateTitle = now.toISOString().split('T')[0]
    const targetBase = getBaseTitle(dateTitle)

    // Find if a note for today already exists (with robust normalization)
    const existing = snippets.find((s) => getBaseTitle(s.title) === targetBase && !s.is_deleted)

    if (existing) {
      handleSelectSnippet(existing)
      showToast(`Opening today's log: ${dateTitle}`, 'info')
      return
    }

    // Time signature for the initial log entry
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    // Premium Template
    const initialCode = `# ${dateTitle}\n\n## Log Started at ${timeStr}\n\n- [ ] \n`

    // Multi-Folder Detection: Support "Inbox", "Daily", or "Journal"
    let targetFolder = folders.find((f) =>
      ['inbox', 'daily', 'journal'].some((keyword) => f.name.toLowerCase().includes(keyword))
    )

    let folderId = targetFolder ? targetFolder.id : null

    // Auto-create "📥 Inbox" if no suitable home is found
    if (!targetFolder) {
      try {
        const folderResult = await saveFolder({ name: '📥 Inbox', parent_id: null })
        folderId = folderResult.id
      } catch (e) {
        console.error('Failed to auto-create Inbox:', e)
      }
    }

    const draft = createDraftSnippet(dateTitle, folderId, {
      initialCode,
      skipNavigation: false
    })

    // Save immediately with Auto-Pin enabled
    await saveSnippet({
      ...draft,
      is_draft: false,
      is_pinned: 1
    })

    showToast(`Journal entry "${dateTitle}" Pinned!`, 'success')
  }

  const createDraftSnippet = (initialTitle = '', folderId = null, options = {}) => {
    try {
      console.debug('[createDraftSnippet] called', {
        initialTitle,
        folderId,
        options,
        stack: new Error().stack.split('\n').slice(1, 6)
      })
    } catch (e) {}
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
      code: options.initialCode || '',
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

  // Toggle favorite helper used by popover and sidebar menu
  const toggleFavoriteSnippet = async (id) => {
    try {
      console.debug('[SnippetLibraryInner] toggleFavoriteSnippet', id)
    } catch (e) {}
    try {
      const s = snippets.find((t) => t.id === id)
      if (!s) return
      const updated = { ...s, is_favorite: s.is_favorite === 1 ? 0 : 1 }
      await saveSnippet(updated)
      console.debug('[SnippetLibraryInner] saveSnippet returned for favorite', id)
      setSnippets((prev) => prev.map((it) => (it.id === id ? updated : it)))
      if (selectedSnippet?.id === id) setSelectedSnippet(updated)
    } catch (err) {
      console.error('Failed toggle favorite from sidebar/menu', err)
      showToast('Failed to toggle favorite', 'error')
    }
  }

  const handlePing = useCallback(
    async (id) => {
      try {
        console.debug('[SnippetLibraryInner] Ping handler', id)
      } catch (e) {}
      const s = snippets.find((t) => t.id === id)
      if (s) {
        // 1. Toggle pinned state and update timestamp
        const isCurrentlyPinned = s.is_pinned === 1
        const updated = {
          ...s,
          is_pinned: isCurrentlyPinned ? 0 : 1,
          timestamp: Date.now()
        }

        // 2. Persist the update
        await saveSnippet(updated)

        // 3. Update local state
        setSnippets((prev) => prev.map((it) => (it.id === id ? updated : it)))

        // 4. Select and navigate
        setSelectedSnippet(updated)
        navigateTo('editor')
      }
    },
    [snippets, setSelectedSnippet, navigateTo, setSnippets, saveSnippet]
  )

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
    const onCommandZenFocus = () => {
      const current = settings?.ui?.zenFocus === true
      const next = !current
      updateSetting('ui.zenFocus', next)
      // When enabling Zen Focus, we also hide sidebars for maximum immersion
      if (next) {
        updateSetting('ui.showActivityBar', false)
        updateSetting('ui.showSidebar', false)
        updateSetting('ui.showHeader', false)
        updateSetting('ui.showStatusBar', false)
      } else {
        updateSetting('ui.showActivityBar', true)
        updateSetting('ui.showSidebar', true)
        updateSetting('ui.showHeader', true)
        updateSetting('ui.showStatusBar', true)
      }
      showToast(next ? 'Zen Focus Enabled' : 'Zen Focus Disabled', 'info')
    }
    const onCommandReset = () => {
      updateSetting('ui.showFlowMode', false)
      // updateSetting('ui.showSidebar', true)
      updateSetting('ui.showActivityBar', true)
      updateSetting('ui.showHeader', true)
      updateSetting('ui.showStatusBar', true)
      // showToast('Window layout reset', 'success')
      // Try to restore window size if API available
      if (window.api?.restoreDefaultSize) {
        window.api.restoreDefaultSize()
      }
    }
    // Flow Mode logic moved to useFlowMode hook
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
    const onCommandFavorite = () => {
      if (selectedSnippet) toggleFavoriteSnippet(selectedSnippet.id)
      else showToast('No snippet selected', 'info')
    }
    const onCommandPing = () => {
      if (selectedSnippet) handlePing(selectedSnippet.id)
      else showToast('No snippet selected', 'info')
    }

    window.addEventListener('app:command-new-snippet', onCommandNew)
    window.addEventListener('app:toggle-theme', onCommandTheme)
    window.addEventListener('app:toggle-sidebar', onCommandSidebar)
    window.addEventListener('app:toggle-preview', onCommandPreview)
    window.addEventListener('app:open-settings', onCommandSettings)
    window.addEventListener('app:toggle-activity-bar', onCommandActivityBar)
    window.addEventListener('app:toggle-zen', onCommandZen)
    window.addEventListener('app:toggle-zen-focus', onCommandZenFocus)
    window.addEventListener('app:reset-layout', onCommandReset)
    // window.addEventListener('app:toggle-flow', onCommandFlow) - Handled in useFlowMode
    window.addEventListener('app:command-copy-image', onCommandCopyImage)
    window.addEventListener('app:toggle-overlay', onCommandOverlay)
    window.addEventListener('app:export-pdf', onCommandExportPDF)
    window.addEventListener('app:toggle-status-bar', onCommandStatusBar)
    window.addEventListener('app:toggle-header', onCommandHeader)
    window.addEventListener('app:reset-window', onResetWindow)
    window.addEventListener('app:toggle-favorite', onCommandFavorite)
    window.addEventListener('app:ping-snippet', onCommandPing)

    return () => {
      window.removeEventListener('app:command-new-snippet', onCommandNew)
      window.removeEventListener('app:toggle-theme', onCommandTheme)
      window.removeEventListener('app:toggle-sidebar', onCommandSidebar)
      window.removeEventListener('app:toggle-preview', onCommandPreview)
      window.removeEventListener('app:open-settings', onCommandSettings)
      window.removeEventListener('app:toggle-activity-bar', onCommandActivityBar)
      window.removeEventListener('app:toggle-zen', onCommandZen)
      window.removeEventListener('app:toggle-zen-focus', onCommandZenFocus)
      window.removeEventListener('app:reset-layout', onCommandReset)
      // window.removeEventListener('app:toggle-flow', onCommandFlow)
      window.removeEventListener('app:command-copy-image', onCommandCopyImage)
      window.removeEventListener('app:toggle-overlay', onCommandOverlay)
      window.removeEventListener('app:export-pdf', onCommandExportPDF)
      window.removeEventListener('app:toggle-status-bar', onCommandStatusBar)
      window.removeEventListener('app:toggle-header', onCommandHeader)
      window.removeEventListener('app:reset-window', onResetWindow)
      window.removeEventListener('app:toggle-favorite', onCommandFavorite)
      window.removeEventListener('app:ping-snippet', onCommandPing)
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

  // Clipboard operations
  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return

    const items = selectedIds
      .map((id) => {
        const snippet = snippets.find((s) => s.id === id)
        if (snippet) return { id, type: 'snippet', data: snippet }

        const folder = folders.find((f) => f.id === id)
        if (folder) return { id, type: 'folder', data: folder }

        return null
      })
      .filter(Boolean)

    if (items.length > 0) {
      setClipboard({ type: 'copy', items })
      showToast(`Copied ${items.length} item${items.length > 1 ? 's' : ''}`, 'success')
    }
  }, [selectedIds, snippets, folders, showToast])

  const handleCut = useCallback(() => {
    if (selectedIds.length === 0) return

    const items = selectedIds
      .map((id) => {
        const snippet = snippets.find((s) => s.id === id)
        if (snippet) return { id, type: 'snippet', data: snippet }

        const folder = folders.find((f) => f.id === id)
        if (folder) return { id, type: 'folder', data: folder }

        return null
      })
      .filter(Boolean)

    if (items.length > 0) {
      setClipboard({ type: 'cut', items })
      showToast(`Cut ${items.length} item${items.length > 1 ? 's' : ''}`, 'success')
    }
  }, [selectedIds, snippets, folders, showToast])

  const handlePaste = useCallback(async () => {
    if (!clipboard || clipboard.items.length === 0) return

    const targetFolderId = selectedFolderId || null

    try {
      if (clipboard.type === 'cut') {
        // Move existing items
        for (const item of clipboard.items) {
          if (item.type === 'snippet') {
            await moveSnippet(item.id, targetFolderId)
          } else if (item.type === 'folder') {
            await moveFolder(item.id, targetFolderId)
          }
        }
        setClipboard(null)
        setSelectedIds([])
        const destinationName = targetFolderId
          ? folders.find((f) => f.id === targetFolderId)?.name || 'Unknown Folder'
          : 'Root'
        showToast(
          `Moved ${clipboard.items.length} item${clipboard.items.length > 1 ? 's' : ''} to ${destinationName}`,
          'success'
        )
      } else {
        // Copy: create new items
        let successCount = 0
        for (const item of clipboard.items) {
          if (item.type === 'snippet') {
            // Generate unique name for duplicate snippets
            const baseName = item.data.title || 'Untitled'
            let finalName = baseName
            let counter = 1

            while (
              snippets.some(
                (s) =>
                  (s.title || '').toLowerCase() === finalName.toLowerCase() &&
                  (s.folder_id || null) === targetFolderId
              )
            ) {
              finalName = `${baseName} (${counter})`
              counter++
            }

            const newSnippet = {
              ...item.data,
              id:
                window.crypto?.randomUUID?.() ||
                `snippet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              title: finalName,
              folder_id: targetFolderId,
              timestamp: Date.now()
            }

            await saveSnippet(newSnippet)
            successCount++
          } else if (item.type === 'folder') {
            // Generate unique name for duplicate folders
            const baseName = item.data.name || 'Untitled Folder'
            let finalName = baseName
            let counter = 1

            while (
              folders.some(
                (f) =>
                  f.name.toLowerCase() === finalName.toLowerCase() &&
                  (f.parent_id || null) === targetFolderId
              )
            ) {
              finalName = `${baseName} (${counter})`
              counter++
            }

            const newFolder = {
              ...item.data,
              id:
                window.crypto?.randomUUID?.() ||
                `folder-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: finalName,
              parent_id: targetFolderId,
              created_at: Date.now(),
              updated_at: Date.now()
            }

            await saveFolder(newFolder)
            successCount++
          }
        }
        showToast(`Pasted ${successCount} item${successCount > 1 ? 's' : ''}`, 'success')
      }
    } catch (error) {
      console.error('Paste operation failed:', error)
      showToast('Failed to paste items', 'error')
    }
  }, [
    clipboard,
    selectedFolderId,
    snippets,
    folders,
    moveSnippet,
    moveFolder,
    saveSnippet,
    saveFolder,
    showToast
  ])

  const handleSelectAll = useCallback(() => {
    // Select all visible items (from current tree)
    // This is a simplified version - in a real implementation you'd want to select all items in the current view
    const allItemIds = [...snippets.map((s) => s.id), ...folders.map((f) => f.id)]
    setSelectedIds(allItemIds)
    showToast(`Selected ${allItemIds.length} items`, 'info')
  }, [snippets, folders, showToast])

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

  if (isRestoring) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="app-loading-placeholder animate-pulse opacity-50" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      <ToastNotification toast={toast} />
      <KeyboardHandler
        showFlowMode={settings?.ui?.showFlowMode}
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
        onOpenPinPopover={(id, rect, origin = 'mouse') => {
          let x = rect?.x ?? rect?.left ?? rect?.clientX ?? window.innerWidth / 2 - 80
          let y = rect?.y ?? rect?.top ?? rect?.clientY ?? window.innerHeight / 2 - 24
          try {
            console.debug('[SnippetLibraryInner] onOpenPinPopover', { id, origin, x, y })
          } catch (e) {}
          // Ensure idempotent open: do not close immediately if called twice quickly
          if (pinPopover.visible && pinPopover.snippetId === id) {
            try {
              console.debug('[SnippetLibraryInner] PinPopover already open for', id)
            } catch (e) {}
            // Toggle behavior: close then reopen to refresh position when requested rapidly
            setPinPopover((prev) => ({ ...prev, visible: false }))
            setTimeout(() => {
              if (origin === 'keyboard') {
                try {
                  window.__suppressNextMousedownClose = true
                  setTimeout(() => (window.__suppressNextMousedownClose = false), 250)
                } catch (e) {}
              }
              setPinPopover((prev) => ({ ...prev, visible: true, x, y, snippetId: id, origin }))
            }, 80)
            return
          }
          if (origin === 'keyboard') {
            try {
              // Try to position the popover near the corresponding sidebar row (left side)
              const el = document.querySelector(`[data-snippet-id="${id}"]`)
              if (el && el.getBoundingClientRect) {
                const r = el.getBoundingClientRect()
                // Place popover inside the sidebar area (slightly right of the row)
                x = Math.max(8, r.left + 8)
                y = r.top
              }
              window.__suppressNextMousedownClose = true
              setTimeout(() => (window.__suppressNextMousedownClose = false), 250)
            } catch (e) {}
          }
          setPinPopover((prev) => ({ ...prev, visible: true, x, y, snippetId: id, origin }))
        }}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolderId}
      />

      {/* Global Alt+P handler as a fallback so popover opens regardless of focus */}
      <AltPHandler
        snippets={snippets}
        selectedSnippet={selectedSnippet}
        selectedIds={selectedIds}
        onOpen={(id, rect) => {
          if (!id) return
          let x = rect?.x ?? rect?.left ?? rect?.clientX ?? window.innerWidth / 2 - 80
          let y = rect?.y ?? rect?.top ?? rect?.clientY ?? window.innerHeight / 2 - 24
          // Idempotent open
          if (pinPopover.visible && pinPopover.snippetId === id) return
          try {
            window.__suppressNextMousedownClose = true
            setTimeout(() => (window.__suppressNextMousedownClose = false), 250)
          } catch (e) {}
          setPinPopover({ visible: true, x, y, snippetId: id })
        }}
      />

      <div className="flex-1 flex flex-col items-stretch min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Workbench
          settings={settings}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={(val) => updateSetting('ui.showSidebar', val)}
          activeView={isCreatingSnippet ? 'editor' : activeView}
          pinPopover={pinPopover}
          setPinPopover={setPinPopover}
          onPing={handlePing}
          onFavorite={toggleFavoriteSnippet}
          currentContext={activeView}
          selectedSnippet={selectedSnippet}
          snippets={paginatedSnippets}
          allSnippets={snippets}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          enablePagination={enablePagination}
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
                  // Auto-increment instead of blocking
                  let counter = 1
                  let newTitle = item.title
                  let newBase = targetBase

                  while (
                    snippets.find(
                      (s) =>
                        normalize(s.title) === newBase &&
                        (s.folder_id || null) === (item.folder_id || null) &&
                        s.id !== item.id
                    )
                  ) {
                    newTitle = `${item.title.replace(/\.md$/, '')} (${counter}).md`
                    newBase = normalize(newTitle)
                    counter++
                  }

                  item.title = newTitle
                  showToast(`Renamed to "${newTitle}" to avoid duplicate`, 'info')
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
          onDailyNote={createDailyNote}
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
          onToggleFavorite={toggleFavoriteSnippet}
          onSelectSnippet={handleSelectSnippet}
          onSearchSnippets={handleSearchSnippetsWrapped}
          searchQuery={searchQuery}
          onOpenSettings={() => openSettingsModal()}
          isSettingsOpen={isSettingsOpen}
          onCloseSettings={() => navigateTo('snippets')}
          onRename={handleRenameRequest}
          // Clipboard operations
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onSelectAll={handleSelectAll}
        />
      </div>
      {pinPopover.visible && activeView !== 'editor' && !isCreatingSnippet && (
        <PinPopover
          x={pinPopover.x}
          y={pinPopover.y}
          snippet={snippets.find((s) => s.id === pinPopover.snippetId)}
          onClose={() => {
            setPinPopover((prev) => ({ ...prev, visible: false, x: 0, y: 0, snippetId: null }))
            try {
              console.debug('[SnippetLibraryInner] PinPopover closed')
            } catch (e) {}
            focusEditor()
          }}
          onPing={handlePing}
          onFavorite={toggleFavoriteSnippet}
        />
      )}
    </div>
  )
}

export default SnippetLibraryInner
