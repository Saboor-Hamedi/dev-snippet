import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import Workbench from './Workbench'
import { useSettings, useZoomLevel, useEditorZoomLevel } from '../../hook/useSettingsContext'
import useAdvancedSplitPane from '../splitPanels/useAdvancedSplitPane.js'
import useFontSettings from '../../hook/settings/useFontSettings'
import { ZOOM_STEP } from '../../hook/useZoomLevel.js'
import { useView } from '../../context/ViewContext'
import { useModal } from './manager/ModalContext'
import KeyboardHandler from './manager/KeyboardHandler'
import PinPopover from './sidebar/PinPopover'
import { useThemeManager } from '../../hook/useThemeManager'
import { themeProps } from '../preference/theme/themeProps'
import { handleRenameSnippet } from '../../hook/handleRenameSnippet'
import { useFlowMode } from '../FlowMode/useFlowMode'
import { getBaseTitle, getUniqueTitle } from '../../utils/snippetUtils'
import { useSessionRestore } from '../../hook/session/useSessionRestore'
import { useSidebarStore } from '../../store/useSidebarStore'
// Extracted library hooks
import { useSnippetOperations } from './library/useSnippetOperations'
import { useClipboardOperations } from './library/useClipboardOperations'
import { useFolderOperations } from './library/useFolderOperations'
import { useSnippetHandlers } from './library/useSnippetHandlers'
import { docs } from '../../documentation/content'

// #file:SnippetLibraryInner.jsx orchestrates the entire workbench experience.
// The Core Logic Component

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                      SNIPPET LIBRARY INNER                                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * FILE LOCATION:
 *   src/renderer/src/components/workbench/SnippetLibraryInner.jsx
 *
 * PARENT COMPONENTS:
 *   - SnippetLibrary.jsx (src/renderer/src/components/workbench/SnippetLibrary.jsx)
 *     └─> Wraps this component with Context Providers (View, Modal, etc.)
 *
 * CORE RESPONSIBILITY:
 *   This is the "Brain" or "Controller" of the entire application. It acts as the
 *   central hub for:
 *   - State Management (Snippets, Folders, Trash, Selection)
 *   - Business Logic (CRUD operations, Moving, Renaming)
 *   - Global Event Handling (Commands, Shortcuts)
 *   - Integration (Connecting Hooks to UI)
 *
 * ARCHITECTURE PATTERN:
 *   Container/View Pattern:
 *   - SnippetLibraryInner.jsx (Container): Handles logic, state, and data fetching.
 *   - Workbench.jsx (View): Pure presentational component that renders the UI.
 *
 * PRIMARY FUNCTIONS:
 *   1. Data Orchestration: Fetches and updates data via Electron IPC.
 *   2. Command Handling: Centralizes logic for 'Save', 'New', 'Delete', etc.
 *   3. Session Management: Restores previous state on load.
 *   4. Keyboard Coordination: Maps keys to actions.
 *
 * RELATED FILES:
 *   - Workbench.jsx - The UI layer receiving props from here.
 *   - useSnippetData.js - (Likely parent hook) Data fetching logic.
 *   - KeyboardHandler.jsx - Global key listener.
 *
 * MAINTENANCE NOTES:
 *   - This file is large (~1500 lines). Avoid adding UI code here.
 *   - Keep it focused on logic and passing props down.
 *   - If logic becomes complex, extract into custom hooks (e.g., useSnippetOperations).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                      SNIPPET LIBRARY INNER                                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ARCHITECTURE:
 * This is the primary "Conductor" component of the developer workbench.
 * It manages the high-level application state, including:
 * 1. Global Snippet List & Search
 * 2. Navigation (Folders vs Recent vs Favorites)
 * 3. Settings Interface (Special 'system:settings' virtual file)
 * 4. Command Orchestration (Saving, Deleting, Renaming)
 *
 * SETTINGS SYNCHRONIZATION (THE "JUMP" PREVENTION):
 * This component handles the unique 'system:settings' virtual snippet. Unlike
 * normal snippets, this one mirrors the actual app configuration.
 * - SAVE: When saving settings.json, we parse the code and push it to the
 *   global SettingsContext.
 * - SYNC: When global settings change (e.g., via the settings modal), we
 *   optionally push those changes BACK into the editor's text.
 *
 * To prevent the "Formatting Jump" (cursor resetting to top on manual save):
 * 1. We use window.__isSavingSettings as a temporary global shield.
 * 2. We only sync-back if the editor is NOT focused (!isFocused).
 * 3. We perform a semantic equality check (parsed JSON) before setCode().
 */

const SnippetLibraryInner = ({ snippetData }) => {
  const {
    snippets,
    selectedSnippet,
    setSelectedSnippet,
    setSnippets,
    saveSnippet: originalSaveSnippet,
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
    permanentDeleteItem,
    hasLoadedSnippets,
    searchSnippetList
  } = snippetData

  const { activeView, showPreview, togglePreview, navigateTo } = useView()
  const {
    openRenameModal,
    openDeleteModal,
    openImageExportModal,
    openSettingsModal,
    openSyncModal,
    openAIPilot,
    openManualModal,
    isSettingsOpen
  } = useModal()

  const {
    settings,
    getSetting,
    updateSetting,
    updateSettings: contextUpdateSettings
  } = useSettings()
  const { toast, showToast } = useToast()

  /**
   * saveSnippet - Handles atomic persistence of snippet content to SQLite.
   * FOR SETTINGS: This function performs an additional step of synchronizing
   * the JSON text with the application's runtime configuration.
   *
   * SECURITY/STABILITY:
   * - Uses a global shield (window.__isSavingSettings) to block background
   *   sync-back events during the reformatting phase.
   * - Silent auto-save vs Manual Save toast feedback.
   */
  const saveSnippet = useCallback(
    async (s, options = false) => {
      const silent = typeof options === 'object' ? options.silent : options
      if (!s) return

      // GUARDIAN: Prevent persistence of Read-Only / Virtual Snippets
      if (s.readOnly || String(s.id).startsWith('doc:')) {
        if (!silent) showToast('Read-only: Changes are not saved', 'info')
        return
      }

      // CRITICAL: Block background sync while this function is executing
      if (s.id === 'system:settings') {
        try {
          const parsed = JSON.parse(s.code)
          if (contextUpdateSettings) {
            try {
              window.__isSavingSettings = true // Activate Shield
              await contextUpdateSettings(parsed)
            } finally {
              // Keep the shield active for a moment to allow React state to settle
              // This is the primary defense against the Cursor Jump.
              setTimeout(() => {
                window.__isSavingSettings = false
              }, 1000)
            }
            showToast('✓ Settings synchronized to disk', 'success')
            return
          }
        } catch (e) {
          // Suppress parsing errors during auto-save to avoid notification spam while typing
          if (!silent) {
            showToast('Invalid JSON structure. Please check your syntax.', 'error')
          }
          return
        }
      }

      // Standard snippet save logic - use the hook's originalSaveSnippet
      // to ensure global state (list & selected item) stays in sync.
      await originalSaveSnippet(s, options)
    },
    [contextUpdateSettings, originalSaveSnippet]
  )

  // Ensure global settings are applied when this component mounts/updates
  useFontSettings()
  useThemeManager()
  useFlowMode({ showPreview, togglePreview })

  // Sync Zen Focus state to global UI - useLayoutEffect for atomic sync to prevent flicker
  React.useLayoutEffect(() => {
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

  // Sidebar UI Store
  const {
    selectedFolderId,
    setSelectedFolderId,
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    updateSnippetIndex
  } = useSidebarStore()

  // Keep the WikiLink index fresh
  useEffect(() => {
    if (snippets && snippets.length > 0) {
      updateSnippetIndex(snippets)
    }
  }, [snippets, updateSnippetIndex])

  const [dirtySnippetIds, setDirtySnippetIds] = useState(new Set())
  const [sidebarSearchResults, setSidebarSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [pinPopover, setPinPopover] = useState({
    visible: false,
    x: 0,
    y: 0,
    snippetId: null,
    isCentered: false
  })
  const { overlayMode, setOverlayMode } = useAdvancedSplitPane()

  // SYNC VIRTUAL SETTINGS: DISABLE TO PREVENT CURSOR JUMPS
  // Syncing causing race conditions with CodeMirror cursor state.
  // User must reopen settings.json to see UI-triggered changes.
  useEffect(() => {
    if (activeView === 'graph' || activeView === 'settings') {
      setIsCreatingSnippet(false)
    }
  }, [activeView])

  useEffect(() => {
    // Determine if the user is currently interacting with the editor
    const isFocused =
      document.activeElement &&
      (document.activeElement.classList.contains('cm-content') ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.closest('.editor-container'))

    if (
      selectedSnippet?.id === 'system:settings' &&
      !dirtySnippetIds.has('system:settings') &&
      !window.__isSavingSettings &&
      settings
    ) {
      try {
        const freshJson = JSON.stringify(settings, null, 2)
        // Only update if the content is functionally different
        // We compare the stringified version of current code to handle formatting consistency
        let currentJson = ''
        try {
          currentJson = JSON.stringify(JSON.parse(selectedSnippet.code), null, 2)
        } catch (e) {
          currentJson = selectedSnippet.code
        }

        if (freshJson !== currentJson) {
          setSelectedSnippet((curr) => {
            if (curr?.id === 'system:settings') {
              return { ...curr, code: freshJson }
            }
            return curr
          })
        }
      } catch (e) {
        // Silently fail
      }
    }
  }, [settings, selectedSnippet?.id, dirtySnippetIds, setSelectedSnippet])

  // Clipboard state for cut/copy/paste operations
  const [clipboard, setClipboard] = useState(null) // { type: 'cut'|'copy', items: [{id, type, data}] }

  // Pre-calculate searchable terms to avoid expensive work in the main search hook
  const searchableSnippets = useMemo(() => {
    return snippets.map((s) => ({
      item: s,
      lowerTitle: (s.title || '').toLowerCase(),
      lowerCode: (s.code || '').toLowerCase(),
      lowerTags: Array.isArray(s.tags)
        ? s.tags.join(' ').toLowerCase()
        : (s.tags || '').toLowerCase(),
      lowerLang: (s.language || '').toLowerCase()
    }))
  }, [snippets])

  const sortedAndFilteredSnippets = useMemo(() => {
    // 🔍 SEARCH MODE: Use Backend Results + Local Refinement
    if (searchQuery && searchQuery.trim()) {
      // HYBRID FALLBACK: ALWAYS use the full local list for title/metadata matching.
      // We combine it with sidebarSearchResults (deep code search) if they exist.
      const baseList = (sidebarSearchResults && sidebarSearchResults.length > 0)
        ? Array.from(new Map([...snippets, ...sidebarSearchResults].map(s => [s.id, s])).values())
        : snippets
      const lowerQuery = searchQuery.toLowerCase().trim()
      const queryTerms = lowerQuery.split(/\s+/).filter(Boolean)

      return baseList.filter(({ title, code, tags, language, match_context }) => {
        // 1. Trust the backend: If it found it and we have it in this list, keep it
        if (match_context) return true

        // 2. Local Fallback/Refinement
        const lowerTitle = (title || '').toLowerCase()
        const lowerCode = (code || '').toLowerCase()
        const lowerTags = Array.isArray(tags)
          ? tags.join(' ').toLowerCase()
          : (tags || '').toLowerCase()
        const lowerLang = (language || '').toLowerCase()

        return queryTerms.every((term) => {
          return (
            lowerTitle.includes(term) ||
            lowerCode.includes(term) ||
            lowerTags.includes(term) ||
            lowerLang.includes(term)
          )
        })
      })
    }

    // Default View: Pinned first, then by timestamp DESC (newest first)
    const sorted = [...snippets]
    sorted.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return b.timestamp - a.timestamp
    })

    return sorted
  }, [snippets, searchableSnippets, searchQuery, sidebarSearchResults])

  const handleSearchSnippets = useCallback(
    async (query) => {
      setSearchQuery(query)
      if (!query.trim()) {
        setSidebarSearchResults(null)
        return
      }
      if (searchSnippetList) {
        setIsSearching(true)
        try {
          const results = await searchSnippetList(query)
          setSidebarSearchResults(results) // Updates sidebar ONLY
        } finally {
          setIsSearching(false)
        }
      }
    },
    [setSearchQuery, searchSnippetList]
  )

  const handleDirtyStateChange = useCallback((id, isDirty) => {
    setDirtySnippetIds((prev) => {
      const next = new Set(prev)
      if (isDirty) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  // GLOBAL WINDOW DIRTY TRACKING: Syncs the set of all dirty snippets to the main process
  // to ensure exit protection works even across different workbench views.
  useEffect(() => {
    if (window.api?.setWindowDirty) {
      window.api.setWindowDirty(dirtySnippetIds.size > 0)
    }
  }, [dirtySnippetIds])

  // GLOBAL WINDOW CLOSE HANDLER (Fallback for when editor is not focused/mounted)
  useEffect(() => {
    let unsubscribe = null
    if (window.api?.onCloseRequest) {
      unsubscribe = window.api.onCloseRequest(() => {
        // 1. If we have any dirty snippets, we must handle them
        if (dirtySnippetIds.size > 0) {
          // If we are not currently looking at the dirty snippet, jump back to it first
          const firstDirtyId = Array.from(dirtySnippetIds)[0]
          if (!selectedSnippet || selectedSnippet.id !== firstDirtyId) {
            const snippet = snippets.find((s) => s.id === firstDirtyId)
            if (snippet) {
              setSelectedSnippet(snippet)
              navigateTo('editor')
            }
          }

          // Wait a tick for navigation if it happened, then trigger the modal
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('app:trigger-close-check'))
          }, 50)
        } else {
          // 2. No dirty snippets, safe to close the application immediately
          if (window.api?.closeWindow) window.api.closeWindow()
        }
      })
    }
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [dirtySnippetIds, selectedSnippet, snippets, setSelectedSnippet, navigateTo])

  // Lifted Sidebar State - defaults to closed, remembers last state
  const isSidebarOpen = settings?.sidebar?.visible !== false
  const handleToggleSidebar = useCallback(() => {
    updateSetting('sidebar.visible', !isSidebarOpen)
  }, [isSidebarOpen, updateSetting])


  // Session Restoration (P1 Feature) - Must be after state init & handler definition
  const { isRestoring } = useSessionRestore({
    snippets,
    selectedSnippet,
    selectedFolderId,
    activeView,
    setSelectedSnippet, // Reverted to stable setter to prevent loop
    setSelectedFolderId,
    navigateTo,
    hasLoadedSnippets
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

  // Initialize extracted library hooks
  const snippetOps = useSnippetOperations({
    snippets,
    folders,
    saveSnippet,
    saveFolder,
    setSnippets,
    setSelectedSnippet,
    setIsCreatingSnippet,
    navigateTo,
    showToast
  })

  const clipboardOps = useClipboardOperations({
    selectedIds,
    selectedFolderId,
    snippets,
    folders,
    clipboard,
    setClipboard,
    setSelectedIds,
    moveSnippet,
    moveFolder,
    saveSnippet,
    saveFolder,
    showToast
  })

  const folderOps = useFolderOperations({
    folders,
    snippets,
    saveFolder,
    deleteFolder,
    deleteFolders,
    toggleFolderCollapse,
    selectedFolderId,
    selectedSnippet,
    openRenameModal,
    openDeleteModal,
    showToast
  })

  const snippetHandlers = useSnippetHandlers({
    snippets,
    selectedSnippet,
    selectedIds,
    dirtySnippetIds,
    setSelectedSnippet,
    setSelectedFolderId,
    setSelectedIds,
    setIsCreatingSnippet,
    saveSnippet,
    deleteItem,
    deleteItems,
    navigateTo,
    openRenameModal,
    openDeleteModal,
    showToast,
    createDraftSnippet: snippetOps.createDraftSnippet
  })

  // --- Navigation Listeners ---
  useEffect(() => {
    if (activeView === 'editor' || isCreatingSnippet) {
      focusEditor()
    }
  }, [activeView, isCreatingSnippet, focusEditor])

  // --- Zoom Listeners ---
  useEffect(() => {
    const handleZoomIn = () => setZoomLevel((z) => z + ZOOM_STEP)
    const handleZoomOut = () => setZoomLevel((z) => z - ZOOM_STEP)
    const handleZoomReset = () => {
      setZoomLevel(1.0)
      setEditorZoom(1.0)
    }
    const handleEditorZoomIn = () => setEditorZoom((z) => z + ZOOM_STEP)
    const handleEditorZoomOut = () => setEditorZoom((z) => z - ZOOM_STEP)

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
    const onCommandSettings = (e) => {
      const params = e.detail || {}
      navigateTo('settings', params)
    }

    const onCommandJsonEditor = async () => {
      if (window.api?.readSettingsFile) {
        try {
          const content = await window.api.readSettingsFile()
          const virtual = {
            id: 'system:settings',
            title: 'settings.json',
            code: content || '{}',
            language: 'json',
            timestamp: Date.now(),
            is_pinned: 0,
            is_draft: false
          }
          setSelectedSnippet(virtual)
          navigateTo('snippets')
          // showToast('Opened configuration for advanced editing', 'info')
        } catch (err) {
          showToast('Failed to load settings from disk', 'error')
        }
      }
    }

    const onCommandDefaultSettingsEditor = async () => {
      if (window.api?.readDefaultSettingsFile) {
        try {
          const content = await window.api.readDefaultSettingsFile()
          const virtual = {
            id: 'system:default-settings',
            title: 'defaultSettings.js (Read Only)',
            code: content || '',
            language: 'javascript',
            timestamp: Date.now(),
            is_pinned: 0,
            is_draft: false,
            readOnly: true
          }
          setSelectedSnippet(virtual)
          navigateTo('snippets')
          // showToast('Opened default settings (read-only)', 'info')
        } catch (err) {
          showToast('Failed to load default settings', 'error')
        }
      }
    }

    const onCommandSyncCenter = () => openSettingsModal()
    const onCommandActivityBar = () => {
      const current = settings?.ui?.showActivityBar !== false
      updateSetting('ui.showActivityBar', !current)
      showToast(`Activity Bar ${!current ? 'Shown' : 'Hidden'}`, 'info')
    }
    const onCommandZen = () => {
      const isActVisible = settings?.ui?.showActivityBar !== false
      const next = !isActVisible
      updateSetting('ui.showActivityBar', next)
      updateSetting('sidebar.visible', next)
      showToast(next ? 'Workspace expanded' : 'Zen Mode enabled', 'info')
    }
    const onCommandZenFocus = () => {
      const current = settings?.ui?.zenFocus === true
      const next = !current
      updateSetting('ui.zenFocus', next)
    }
    const onCommandReset = () => {
      updateSetting('ui.showFlowMode', false)
      // updateSetting('sidebar.visible', true)
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
      updateSetting('sidebar.visible', true)
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
      if (selectedSnippet) snippetOps.toggleFavoriteSnippet(selectedSnippet.id)
      else showToast('No snippet selected', 'info')
    }
    const onCommandPing = () => {
      if (selectedSnippet) snippetOps.handlePing(selectedSnippet.id)
      else showToast('No snippet selected', 'info')
    }
    const onCommandAIPilot = () => openAIPilot()
    const onCommandDocs = () => {
      openManualModal()
      showToast('Opened Reference Manual', 'info')
    }

    const onBulkDelete = (e) => {
      const ids = e.detail?.ids
      if (ids && ids.length > 0) snippetHandlers.handleBulkDelete(ids)
    }

    const onDraftTitleUpdated = (e) => {
      const { id, title } = e.detail
      if (!id) return
      
      // 1. Update list for Sidebar consistency
      setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)))

      // 2. Update active object for Header/Tab consistency
      // Use functional update to ensure we only trigger if the title actually differs
      setSelectedSnippet((prev) => {
        if (prev?.id === id && prev.title !== title) {
          return { ...prev, title }
        }
        return prev
      })
    }

    window.addEventListener('app:command-new-snippet', onCommandNew)
    window.addEventListener('app:draft-title-updated', onDraftTitleUpdated)
    window.addEventListener('app:open-docs', onCommandDocs)
    window.addEventListener('app:command-bulk-delete', onBulkDelete)
    window.addEventListener('app:toggle-theme', onCommandTheme)
    window.addEventListener('app:toggle-sidebar', onCommandSidebar)
    window.addEventListener('app:toggle-preview', onCommandPreview)
    window.addEventListener('app:open-settings', onCommandSettings)
    window.addEventListener('app:open-json-editor', onCommandJsonEditor)
    window.addEventListener('app:open-default-settings-editor', onCommandDefaultSettingsEditor)
    window.addEventListener('app:open-sync-center', onCommandSyncCenter)
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
    window.addEventListener('app:toggle-ai-pilot', onCommandAIPilot)

    const handleOpenSnippetEvent = (e) => snippetHandlers.handleOpenSnippet(e.detail?.title)
    window.addEventListener('app:open-snippet', handleOpenSnippetEvent)

    return () => {
      window.removeEventListener('app:draft-title-updated', onDraftTitleUpdated)
      window.removeEventListener('app:open-snippet', handleOpenSnippetEvent)
      window.removeEventListener('app:command-new-snippet', onCommandNew)
      window.removeEventListener('app:command-bulk-delete', onBulkDelete)
      window.removeEventListener('app:toggle-theme', onCommandTheme)
      window.removeEventListener('app:toggle-sidebar', onCommandSidebar)
      window.removeEventListener('app:toggle-preview', onCommandPreview)
      window.removeEventListener('app:open-settings', onCommandSettings)
      window.removeEventListener('app:open-json-editor', onCommandJsonEditor)
      window.removeEventListener('app:open-default-settings-editor', onCommandDefaultSettingsEditor)
      window.removeEventListener('app:open-sync-center', onCommandSyncCenter)
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
      window.removeEventListener('app:open-docs', onCommandDocs)
    }
  }, [
    snippetOps,
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
    settings?.sidebar?.visible,
    settings?.ui?.showStatusBar,
    settings?.ui?.showHeader,
    settings?.ui?.showFlowMode,
    updateSetting,
    openSettingsModal,
    openSyncModal,
    openImageExportModal
  ])


  if (isRestoring) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="app-loading-placeholder animate-pulse opacity-50" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden workbench-layout">
      <ToastNotification toast={toast} />
      <KeyboardHandler
        showFlowMode={settings?.ui?.showFlowMode}
        selectedSnippet={selectedSnippet}
        setSelectedSnippet={setSelectedSnippet}
        saveSnippet={saveSnippet}
        deleteItem={deleteItem}
        setAutosaveStatus={setAutosaveStatus}
        createDraftSnippet={snippetOps.createDraftSnippet}
        focusEditor={focusEditor}
        isCreatingSnippet={isCreatingSnippet}
        setIsCreatingSnippet={setIsCreatingSnippet}
        showToast={showToast}
        handleRename={snippetHandlers.handleRenameRequest}
        onToggleSidebar={handleToggleSidebar}
        onTogglePin={togglePinnedSnippet}
        onOpenPinPopover={(id, rect, origin = 'mouse') => {
          let x = rect?.x ?? rect?.left ?? rect?.clientX ?? window.innerWidth / 2 - 80
          let y = rect?.y ?? rect?.top ?? rect?.clientY ?? window.innerHeight / 2 - 24
          let isCentered = false

          // Idempotent open: do not close immediately if called twice quickly
          if (pinPopover.visible && pinPopover.snippetId === id) {
            setPinPopover((prev) => ({ ...prev, visible: false }))
            setTimeout(() => {
              if (origin === 'keyboard') {
                window.__suppressNextMousedownClose = true
                setTimeout(() => (window.__suppressNextMousedownClose = false), 250)
              }
              setPinPopover((prev) => ({
                ...prev,
                visible: true,
                x,
                y,
                snippetId: id,
                origin,
                isCentered: !rect && origin === 'keyboard'
              }))
            }, 80)
            return
          }

          if (origin === 'keyboard') {
            try {
              // Try to position the popover near the corresponding sidebar row (left side)
              const el = document.querySelector(`[data-snippet-id="${id}"]`)
              if (el && el.getBoundingClientRect) {
                const r = el.getBoundingClientRect()
                x = Math.max(8, r.left + 8)
                y = r.top
              } else {
                // If keyboard trigger but no row found (maybe focus in editor), center it
                isCentered = true
              }
              window.__suppressNextMousedownClose = true
              setTimeout(() => (window.__suppressNextMousedownClose = false), 250)
            } catch (e) {
              isCentered = true
            }
          }

          setPinPopover((prev) => ({
            ...prev,
            visible: true,
            x,
            y,
            snippetId: id,
            origin,
            isCentered
          }))
        }}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolderId}
        onToggleZenFocus={() => window.dispatchEvent(new CustomEvent('app:toggle-zen-focus'))}
      />

      <div
        className="flex-1 flex flex-col items-stretch min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200"
        style={{ backgroundColor: 'var(--editor-bg)' }}
      >
        <Workbench
          settings={settings}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={(val) => updateSetting('sidebar.visible', val)}
          onToggleSidebar={handleToggleSidebar}
          onToggleZenFocus={() => window.dispatchEvent(new CustomEvent('app:toggle-zen-focus'))}
          activeView={isCreatingSnippet ? 'editor' : activeView}
          pinPopover={pinPopover}
          setPinPopover={setPinPopover}
          isSearching={isSearching}
          onPing={snippetOps.handlePing}
          onFavorite={snippetOps.toggleFavoriteSnippet}
          currentContext={activeView}
          selectedSnippet={selectedSnippet}
          snippets={sortedAndFilteredSnippets}
          allSnippets={snippets}
          onPageChange={() => {}}
          enablePagination={false}
          setSnippets={setSnippets}
          saveSnippet={saveSnippet}
          folders={folders}
          trash={trash}
          onRestoreItem={restoreItem}
          onPermanentDeleteItem={permanentDeleteItem}
          onLoadTrash={loadTrash}
          onCloseSnippet={(force = false) => {
            // UNSAVED CHANGES CHECK
            if (!force && selectedSnippet && dirtySnippetIds.has(selectedSnippet.id)) {
              // Dispatch event to Editor to show the Unsaved Modal
              window.dispatchEvent(new CustomEvent('app:trigger-close-check'))
              return
            }

            // If forced (Discard), clear dirty state immediately
            if (force && selectedSnippet) {
              setDirtySnippetIds((prev) => {
                const next = new Set(prev)
                next.delete(selectedSnippet.id)
                return next
              })
            }

            // DISCARD GHOST DRAFTS: Only remove if it's a clean, empty ghost
            const freshSnippet = snippets.find((s) => s.id === selectedSnippet?.id)
            if (freshSnippet && freshSnippet.is_draft && !freshSnippet.is_modified) {
              const isEmpty = !freshSnippet.code || freshSnippet.code.trim() === ''
              const isUntitled =
                !freshSnippet.title || freshSnippet.title.toLowerCase() === 'untitled'
              if (isEmpty && isUntitled) {
                setSnippets((prev) => prev.filter((s) => s.id !== freshSnippet.id))
              }
            }

            // Handle pending snippet switch (when user discards and wants to switch)
            if (window.__pendingSnippetSwitch) {
              const pendingSnippet = window.__pendingSnippetSwitch
              window.__pendingSnippetSwitch = null

              setIsCreatingSnippet(false)
              setSelectedIds([])
              setSelectedSnippet(pendingSnippet)
              setSelectedFolderId(null)
              setSelectedIds([pendingSnippet.id])
              navigateTo('editor')
            } else if (window.__pendingNewSnippet) {
              // Handle pending new snippet creation (Ctrl+N or new button)
              window.__pendingNewSnippet = null

              setIsCreatingSnippet(false)
              setSelectedIds([])
              setSelectedSnippet(null)
              snippetOps.createDraftSnippet()
            } else {
              setIsCreatingSnippet(false)
              setSelectedIds([])
              setSelectedSnippet(null)
              navigateTo('snippets')
            }
          }}
          onCancelEditor={() => {
            // DISCARD GHOST DRAFTS: Only remove if truly a blank ghost
            if (selectedSnippet && selectedSnippet.is_draft) {
              const isEmpty = !selectedSnippet.code || selectedSnippet.code.trim() === ''
              const isUntitled =
                !selectedSnippet.title || selectedSnippet.title.toLowerCase() === 'untitled'
              if (isEmpty && isUntitled) {
                setSnippets((prev) => prev.filter((s) => s.id !== selectedSnippet.id))
              }
            }
            setIsCreatingSnippet(false)
            setSelectedSnippet(null)
            setSelectedIds([])
            navigateTo('snippets')
          }}
          isCompact={isCompact}
          onToggleCompact={() => setIsCompact(!isCompact)}
          showPreview={showPreview}
          onTogglePreview={togglePreview}
          showToast={showToast}
          dirtyIds={dirtySnippetIds}
          onDirtyStateChange={handleDirtyStateChange}
          hideWelcomePage={settings?.welcome?.hideWelcomePage || false}
          autosaveStatus={autosaveStatus}
          onAutosave={(s) => setAutosaveStatus(s)}
          onSave={async (item) => {
            try {
              if (item.title && item.title.trim()) {
                const uniqueTitle = getUniqueTitle(item.title, item.folder_id, snippets, item.id)
                if (uniqueTitle !== item.title) {
                  item.title = uniqueTitle
                  showToast(`Renamed to "${uniqueTitle}" to avoid duplicate`, 'info')
                }
              }
              const wasForce = !!window.__forceSave
              if (!wasForce) setAutosaveStatus('saving')
              await saveSnippet(item, { skipSelectedUpdate: !!item._skipSelectionSwitch })

              // PERFORMANCE & NAVIGATION: If this was a background bridge-save, skip the selection bounce
              if (item._skipSelectionSwitch) return

              if (isCreatingSnippet && item.id === selectedSnippet?.id) {
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
          onNewRequest={() => {
            // UNSAVED CHANGES CHECK: Before creating a new snippet
            if (selectedSnippet && dirtySnippetIds.has(selectedSnippet.id)) {
              // Store action to create new snippet after discard
              window.__pendingNewSnippet = true
              // Trigger close check on current snippet
              window.dispatchEvent(new CustomEvent('app:trigger-close-check'))
              return
            }
            snippetOps.createDraftSnippet()
          }}
          onDeleteRequest={snippetHandlers.handleDeleteRequest}
          onBulkDeleteRequest={snippetHandlers.handleBulkDelete}
          onNewSnippet={async (title, folderId, options) => {
            try {
              const parentId = folderId || selectedFolderId || selectedSnippet?.folder_id || null
              const uniqueTitle = getUniqueTitle(title || '', parentId, snippets)
              const draft = snippetOps.createDraftSnippet(uniqueTitle, parentId, options)

              // PERSISTENCE: If a title was provided (Naming Flow), commit it to DB immediately
              // a "Draft" is only for blank, untitled snippets.
              if (uniqueTitle && uniqueTitle.trim()) {
                await saveSnippet({ ...draft, is_draft: false })
              }
            } catch (err) {
              console.error('Failed to create new snippet:', err)
              showToast('Creation failed', 'error')
            }
          }}
          onRenameSnippet={snippetHandlers.handleRenameSnippetRequest}
          onNewFolder={folderOps.handleNewFolder}
          onDailyNote={snippetOps.createDailyNote}
          onRenameFolder={folderOps.handleRenameFolder}
          onDeleteFolder={folderOps.handleDeleteFolder}
          onDeleteBulk={snippetHandlers.handleBulkDelete}
          onToggleFolder={toggleFolderCollapse}
          onMoveSnippet={moveSnippet}
          onMoveFolder={moveFolder}
          onTogglePin={togglePinnedSnippet}
          onToggleFavorite={snippetOps.toggleFavoriteSnippet}
          onSelectSnippet={snippetHandlers.handleSelectSnippet}
          onSearchSnippets={handleSearchSnippets}
          onOpenSettings={(params = {}) => {
            openSettingsModal() // Keep this for now if needed, but navigation is primary
            navigateTo('settings', params)
          }}
          isSettingsOpen={isSettingsOpen}
          onCloseSettings={() => navigateTo('snippets')}
          onInlineRename={(id, newName, type) => {
            if (type === 'snippet') snippetHandlers.handleInlineRenameSnippet(id, newName)
            else folderOps.handleInlineRenameFolder(id, newName)
          }}
          // Clipboard operations
          onCopy={clipboardOps.handleCopy}
          onCut={clipboardOps.handleCut}
          onPaste={clipboardOps.handlePaste}
          onSelectAll={clipboardOps.handleSelectAll}
        />
      </div>
      {pinPopover.visible && (
        <PinPopover
          x={pinPopover.x}
          y={pinPopover.y}
          isCentered={pinPopover.isCentered}
          snippet={snippets.find((s) => s.id === pinPopover.snippetId)}
          onClose={() => {
            setPinPopover((prev) => ({
              ...prev,
              visible: false,
              x: 0,
              y: 0,
              snippetId: null,
              isCentered: false
            }))
            try {
            } catch (e) {}
            focusEditor()
          }}
          onPing={snippetOps.handlePing}
          onFavorite={snippetOps.toggleFavoriteSnippet}
        />
      )}
    </div>
  )
}

export default SnippetLibraryInner
