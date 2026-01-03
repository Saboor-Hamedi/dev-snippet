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
import AltPHandler from './AltPHandler'
import PinPopover from './sidebar/PinPopover'
import { useThemeManager } from '../../hook/useThemeManager'
import { themeProps } from '../preference/theme/themeProps'
import { handleRenameSnippet } from '../../hook/handleRenameSnippet'
import { useFlowMode } from '../FlowMode/useFlowMode'
import { getBaseTitle } from '../../utils/snippetUtils'
import { useSessionRestore } from '../../hook/session/useSessionRestore'
import { useSidebarStore } from '../../store/useSidebarStore'

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
    hasLoadedSnippets
  } = snippetData

  const { activeView, showPreview, togglePreview, navigateTo } = useView()
  const {
    openRenameModal,
    openDeleteModal,
    openImageExportModal,
    openSettingsModal,
    openSyncModal,
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
    async (s, silent = false) => {
      if (!s) return

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

      // Standard snippet save logic...
      const result = await window.api.updateSnippet(s.id, {
        title: s.title,
        code: s.code,
        language: s.language,
        tags: s.tags,
        folder_id: s.folder_id
      })

      if (!silent && result) {
        showToast('✓ Changes saved successfully', 'success')
      }
    },
    [contextUpdateSettings]
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
  const [pinPopover, setPinPopover] = useState({ visible: false, x: 0, y: 0, snippetId: null })
  const { overlayMode, setOverlayMode } = useAdvancedSplitPane()

  // SYNC VIRTUAL SETTINGS: DISABLE TO PREVENT CURSOR JUMPS
  // Syncing causing race conditions with CodeMirror cursor state.
  // User must reopen settings.json to see UI-triggered changes.
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
      !isFocused &&
      !window.__isSavingSettings && // BLOCK SYNC DURING/AFTER MANUAL SAVE
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

  const sortedAndFilteredSnippets = useMemo(() => {
    let filtered = [...snippets]

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (snippet) =>
          (snippet.title || '').toLowerCase().includes(query) ||
          (snippet.code || '').toLowerCase().includes(query) ||
          (snippet.language || '').toLowerCase().includes(query) ||
          (Array.isArray(snippet.tags) ? snippet.tags.join(' ') : snippet.tags || '')
            .toLowerCase()
            .includes(query)
      )
    }

    // Sort: pinned first, then by timestamp DESC (newest first)
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return b.timestamp - a.timestamp
    })

    return filtered
  }, [snippets, searchQuery])

  const handleSearchSnippets = useCallback(
    (query) => {
      setSearchQuery(query)
    },
    [setSearchQuery]
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

  const handleSelectSnippet = useCallback(
    (s) => {
      if (!s) {
        setSelectedSnippet(null)
        setSelectedFolderId(null)
        setSelectedIds([])
        return
      }

      // UNSAVED CHANGES CHECK: Before switching to a different snippet
      if (
        selectedSnippet &&
        selectedSnippet.id !== s.id &&
        dirtySnippetIds.has(selectedSnippet.id)
      ) {
        // Store the next snippet to switch to
        window.__pendingSnippetSwitch = s
        // Trigger close check on current snippet
        window.dispatchEvent(new CustomEvent('app:trigger-close-check'))
        return
      }

      setSelectedSnippet(s)
      setSelectedFolderId(null)
      setSelectedIds([s.id])

      navigateTo('editor')
    },
    [
      setSelectedSnippet,
      setSelectedFolderId,
      setSelectedIds,
      navigateTo,
      selectedSnippet,
      dirtySnippetIds
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
    const handleZoomReset = () => setZoomLevel(1.0)
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

  const createDailyNote = async () => {
    const now = new Date()
    // FIX: Use local date instead of UTC to avoid timezone alignment issues (e.g. 2026-01-02)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateTitle = `${year}-${month}-${day}`
    const targetBase = getBaseTitle(dateTitle)

    // Check if a note for today already exists
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
      skipNavigation: false,
      isPinned: 0,
      isDraft: false
    })

    // Save immediately
    await saveSnippet({
      ...draft,
      is_draft: false,
      is_pinned: 0
    })

    showToast(`Journal entry "${dateTitle}" created`, 'success')
  }

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
      code: options.initialCode || '',
      timestamp: Date.now(),
      type: 'snippet',
      is_draft: options.isDraft !== undefined ? options.isDraft : true,
      is_pinned: options.isPinned !== undefined ? options.isPinned : 0,
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
    } catch (e) {}
    try {
      const s = snippets.find((t) => t.id === id)
      if (!s) return
      const updated = { ...s, is_favorite: s.is_favorite === 1 ? 0 : 1 }
      await saveSnippet(updated)

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
    [snippets, setSelectedSnippet, navigateTo, setSnippets, originalSaveSnippet, saveSnippet]
  )

  const handleRenameRequest = () => {
    if (selectedSnippet?.id === 'system:settings') {
      showToast('The settings.json file cannot be renamed', 'info')
      return
    }
    if (selectedSnippet?.id === 'system:default-settings') {
      // showToast('The default settings file cannot be renamed', 'info')
      return
    }
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
          navigateTo('editor')
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
          navigateTo('editor')
          showToast('Opened default settings (read-only)', 'info')
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

    // Listen for wiki-link navigation events
    const onOpenSnippet = async (e) => {
      const rawTitle = e.detail?.title
      if (!rawTitle) return

      // Normalize: remove .md extension
      const textTitle = rawTitle.replace(/\.md$/i, '').trim()
      const searchTitle = textTitle.toLowerCase()

      // Debounce: Prevent double-creation if event fires multiple times
      if (window.__wikiLock === searchTitle) return

      // Smart Search: Match "Title" OR "Title.md"
      const target = snippets.find((s) => {
        const t = (s.title || '').trim().toLowerCase()
        return t === searchTitle || t === `${searchTitle}.md`
      })

      if (target) {
        handleSelectSnippet(target)
      } else {
        // Lock creation for 1s to prevent duplicates
        window.__wikiLock = searchTitle
        setTimeout(() => {
          window.__wikiLock = null
        }, 1000)

        // Robustness: Smart Sanitize
        // 1. Remove chars that imply punctuation (?*"><)
        let safeTitle = textTitle.replace(/[?*"><]/g, '')
        // 2. Replace structural chars (: / \ |) with hyphens
        safeTitle = safeTitle.replace(/[:/\\|]/g, '-')
        safeTitle = safeTitle.trim()

        if (!safeTitle) safeTitle = 'Untitled Wiki Note'

        // Create persistent snippet
        const newSnippet = createDraftSnippet(safeTitle, null, {
          initialCode: `# New Snippet ${safeTitle}\n\n`,
          skipNavigation: true,
          isDraft: false
        })

        if (newSnippet) {
          try {
            await saveSnippet(newSnippet) // Persist to DB immediately

            // Critical Fix: Force navigation to the new snippet
            // We use a timeout to ensure this executes after any potential re-renders from saveSnippet
            handleSelectSnippet(newSnippet)

            setTimeout(() => {
              setSelectedSnippet(newSnippet)
              navigateTo('editor')
            }, 50)

            showToast(`New Snippet "${safeTitle}"`, 'success')
          } catch (error) {
            console.error('[WikiLink] Creation failed:', error)
            showToast('Failed to save new snippet', 'error')
          }
        }
      }
    }
    window.addEventListener('app:open-snippet', onOpenSnippet)

    return () => {
      window.removeEventListener('app:open-snippet', onOpenSnippet)
      window.removeEventListener('app:command-new-snippet', onCommandNew)
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
    settings?.sidebar?.visible,
    settings?.ui?.showStatusBar,
    settings?.ui?.showHeader,
    settings?.ui?.showFlowMode,
    updateSetting,
    openSettingsModal,
    openSyncModal,
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

  const handleInlineRename = async (id, newName, type) => {
    try {
      if (!newName || !newName.trim()) return

      if (type === 'snippet') {
        const snippet = snippets.find((s) => s.id === id)
        if (snippet) {
          if (snippet.title === newName.trim()) return

          const uniqueTitle = getUniqueTitle(newName.trim(), snippet.folder_id, id)
          const updated = { ...snippet, title: uniqueTitle }

          if (uniqueTitle !== newName.trim()) {
            showToast(`Renamed to "${uniqueTitle}" to avoid duplicate`, 'info')
          }

          await saveSnippet(updated)
          setSnippets((prev) => prev.map((s) => (s.id === id ? updated : s)))
          if (selectedSnippet?.id === id) setSelectedSnippet(updated)
          showToast('Snippet renamed', 'success')
        }
      } else {
        const folder = folders.find((f) => f.id === id)
        if (folder) {
          if (folder.name === newName.trim()) return
          // Future: check for duplicate folder names in same parent
          const updated = { ...folder, name: newName.trim() }
          await saveFolder(updated)
          showToast('Folder renamed', 'success')
        }
      }
    } catch (e) {
      console.error('Inline rename failed:', e)
      showToast('Rename failed', 'error')
    }
  }

  const handleDeleteRequest = (id) => {
    if (id === 'system:settings' || id === 'system:default-settings') {
      return
    }
    openDeleteModal(id, async (targetId) => {
      await deleteItem(targetId)
    })
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

  const getUniqueTitle = useCallback(
    (baseTitle, folderId, excludeId = null) => {
      const normalize = (t) => (t || '').toLowerCase().trim().replace(/\.md$/, '')
      const targetBase = normalize(baseTitle)

      let counter = 1
      let finalTitle = baseTitle
      let currentBase = targetBase

      while (
        snippets.find(
          (s) =>
            normalize(s.title) === currentBase &&
            (s.folder_id || null) === (folderId || null) &&
            s.id !== excludeId
        )
      ) {
        const cleanBase = baseTitle.replace(/\.md$/, '')
        if (cleanBase.match(/\sPart\s\d+$/)) {
          const basePart = cleanBase.replace(/\sPart\s\d+$/, '')
          finalTitle = `${basePart} Part ${counter + 1}.md`
        } else if (cleanBase.match(/\scontinue\s?(\d+)?$/)) {
          const match = cleanBase.match(/(.*? continue)\s?(\d+)?$/)
          const base = match ? match[1] : cleanBase
          const num = match && match[2] ? parseInt(match[2]) + 1 : counter + 1
          finalTitle = `${base} ${num}.md`
        } else {
          finalTitle = `${cleanBase} (${counter}).md`
        }
        currentBase = normalize(finalTitle)
        counter++
      }
      return finalTitle
    },
    [snippets]
  )

  if (isRestoring) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="app-loading-placeholder animate-pulse opacity-50" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden">
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
          } catch (e) {}
          // Ensure idempotent open: do not close immediately if called twice quickly
          if (pinPopover.visible && pinPopover.snippetId === id) {
            try {
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
        onToggleZenFocus={() => window.dispatchEvent(new CustomEvent('app:toggle-zen-focus'))}
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
          onPing={handlePing}
          onFavorite={toggleFavoriteSnippet}
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
              createDraftSnippet()
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
                const uniqueTitle = getUniqueTitle(item.title, item.folder_id, item.id)
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
            createDraftSnippet()
          }}
          onDeleteRequest={handleDeleteRequest}
          onBulkDeleteRequest={handleBulkDelete}
          onNewSnippet={(title, folderId, options) => {
            try {
              const parentId = folderId || selectedFolderId || selectedSnippet?.folder_id || null
              const uniqueTitle = getUniqueTitle(title || '', parentId)
              const draft = createDraftSnippet(uniqueTitle, parentId, options)
              // We no longer force-save here. Snippet stays a 'Draft' in-memory
              // until the user either manually saves or autosave triggers.
            } catch (e) {
              console.error('[SnippetLibrary] Failed to create snippet:', e)
            }
          }}
          onRenameSnippet={handleRenameSnippetRequest}
          onNewFolder={handleNewFolder}
          onDailyNote={createDailyNote}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onDeleteBulk={handleBulkDelete}
          onToggleFolder={toggleFolderCollapse}
          onMoveSnippet={moveSnippet}
          onMoveFolder={moveFolder}
          onTogglePin={togglePinnedSnippet}
          onToggleFavorite={toggleFavoriteSnippet}
          onSelectSnippet={handleSelectSnippet}
          onSearchSnippets={handleSearchSnippets}
          onOpenSettings={(params = {}) => {
            openSettingsModal() // Keep this for now if needed, but navigation is primary
            navigateTo('settings', params)
          }}
          isSettingsOpen={isSettingsOpen}
          onCloseSettings={() => navigateTo('snippets')}
          onInlineRename={handleInlineRename}
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
