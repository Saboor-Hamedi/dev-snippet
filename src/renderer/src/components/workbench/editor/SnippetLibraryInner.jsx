import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useToast } from '../../../hook/useToast'
import ToastNotification from '../../../utils/ToastNotification'
import Workbench from '../Workbench'
import { useSettings, useZoomLevel, useEditorZoomLevel } from '../../../hook/useSettingsContext'
import useAdvancedSplitPane from '../../splitPanels/useAdvancedSplitPane.js'
import useFontSettings from '../../../hook/settings/useFontSettings'
import { ZOOM_STEP } from '../../../hook/useZoomLevel.js'
import { useView } from '../../../context/ViewContext'
import { useModal } from '../manager/ModalContext'
import KeyboardHandler from '../manager/KeyboardHandler'
import PinPopover from '../sidebar/PinPopover'
import { useThemeManager } from '../../../hook/useThemeManager'
import { themeProps } from '../../preference/theme/themeProps'
import { handleRenameSnippet } from '../../../hook/handleRenameSnippet'
import { useFlowMode } from '../../FlowMode/useFlowMode'
import { getBaseTitle } from '../../../utils/snippetUtils'
import { useSessionRestore } from '../../../hook/session/useSessionRestore'
import { useSidebarStore } from '../../../store/useSidebarStore'

// Multi-Hook Partitioning
import { useSnippetLibraryOperations } from './useSnippetLibraryOperations'
import { useGlobalCommands } from './useGlobalCommands'
import { useSnippetLifecycle } from './useSnippetLifecycle'
import { useWikiLinks } from './useWikiLinks'

const SnippetLibraryInner = ({ snippetData }) => {
  const {
    snippets,
    selectedSnippet,
    setSelectedSnippet,
    setSnippets,
    saveSnippet: originalSaveSnippet,
    deleteItem,
    folders,
    saveFolder,
    searchSnippetList,
    hasLoadedSnippets,
    toggleFolderCollapse,
    moveSnippet,
    moveFolder,
    togglePinnedSnippet,
    deleteFolder,
    trash,
    loadTrash,
    restoreItem,
    permanentDeleteItem
  } = snippetData

  const viewContext = useView()
  const modalContext = useModal()
  const settingsContext = useSettings()
  const toastContext = useToast()
  const { setTheme, currentThemeId } = themeProps()

  const { activeView, navigateTo, togglePreview, showPreview } = viewContext
  const { settings, updateSetting, getSetting } = settingsContext
  const { showToast } = toastContext
  const { openRenameModal, openDeleteModal, openAIPilot, openSettingsModal, isSettingsOpen } = modalContext

  // --- Core Lifecycle & State ---
  const [autosaveStatus, setAutosaveStatus] = useState(null)
  const [zoomLevel, setZoomLevel] = useZoomLevel()
  const [editorZoom, setEditorZoom] = useEditorZoomLevel()
  
  // Persistence for Compact Mode
  const [isCompact, setIsCompactState] = useState(getSetting('ui.compactMode') || false)
  const setIsCompact = useCallback((val) => {
    setIsCompactState(val)
    updateSetting('ui.compactMode', val)
  }, [updateSetting])

  useEffect(() => {
    const settingValue = getSetting('ui.compactMode')
    if (settingValue !== undefined && settingValue !== isCompact) {
      setIsCompactState(settingValue)
    }
  }, [settings, getSetting, isCompact])

  const [pinPopover, setPinPopover] = useState({ visible: false, x: 0, y: 0, snippetId: null })
  const { overlayMode, setOverlayMode } = useAdvancedSplitPane()

  const operations = useSnippetLibraryOperations({
    snippetData,
    viewContext,
    modalContext,
    settingsContext,
    toastContext
  })

  const {
    setIsCreatingSnippet,
    setDirtySnippetIds,
    dirtySnippetIds,
    saveSnippet,
    handleSelectSnippet,
    handlePing,
    isCreatingSnippet,
    sidebarSearchResults,
    createDraftSnippet
  } = operations

  const {
    selectedFolderId,
    setSelectedFolderId,
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    updateSnippetIndex
  } = useSidebarStore()

  // --- Derived State ---
  const sortedAndFilteredSnippets = useMemo(() => {
    if (searchQuery && searchQuery.trim()) {
      const baseList = sidebarSearchResults || snippets
      const lowerQuery = searchQuery.toLowerCase().trim()
      const queryTerms = lowerQuery.split(/\s+/).filter(Boolean)

      return baseList.filter(({ title, code, tags, language, match_context }) => {
        if (match_context) return true
        const lowerTitle = (title || '').toLowerCase()
        const lowerCode = (code || '').toLowerCase()
        const lowerTags = Array.isArray(tags) ? tags.join(' ').toLowerCase() : (tags || '').toLowerCase()
        const lowerLang = (language || '').toLowerCase()
        return queryTerms.every(term => 
          lowerTitle.includes(term) || lowerCode.includes(term) || lowerTags.includes(term) || lowerLang.includes(term)
        )
      })
    }
    const sorted = [...snippets]
    sorted.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return b.timestamp - a.timestamp
    })
    return sorted
  }, [snippets, searchQuery, sidebarSearchResults])

  // --- Handlers ---
  const handleDirtyStateChange = useCallback((id, isDirty) => {
    setDirtySnippetIds((prev) => {
      const next = new Set(prev)
      if (isDirty) next.add(id)
      else next.delete(id)
      return next
    })
  }, [setDirtySnippetIds])

  const focusEditor = useCallback(() => {
    setTimeout(() => {
      const el = document.querySelector('.cm-content') || document.querySelector('textarea')
      if (el?.focus) el.focus()
    }, 50)
  }, [])

  const handleSearchSnippets = useCallback(async (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      operations.setSidebarSearchResults(null)
      return
    }
    if (searchSnippetList) {
      operations.setIsSearching(true)
      try {
        const results = await searchSnippetList(query)
        operations.setSidebarSearchResults(results)
      } finally {
        operations.setIsSearching(false)
      }
    }
  }, [setSearchQuery, searchSnippetList, operations])

  const toggleFavoriteSnippet = async (id) => {
    const s = snippets.find(t => t.id === id)
    if (!s) return
    const updated = { ...s, is_favorite: s.is_favorite === 1 ? 0 : 1 }
    await saveSnippet(updated)
    setSnippets(prev => prev.map(it => it.id === id ? updated : it))
    if (selectedSnippet?.id === id) setSelectedSnippet(updated)
  }

  const getUniqueTitle = (title, folderId, excludeId) => {
    const base = title.replace(/\.md$/i, '')
    const folderSnippets = snippets.filter(s => s.folder_id === folderId && s.id !== excludeId)
    let final = base
    let counter = 1
    while (folderSnippets.some(s => getBaseTitle(s.title).toLowerCase() === getBaseTitle(final).toLowerCase())) {
      final = `${base} (${counter})`
      counter++
    }
    return final
  }

  const createDailyNote = async () => {
    const now = new Date()
    const dateTitle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const existing = snippets.find(s => getBaseTitle(s.title) === getBaseTitle(dateTitle) && !s.is_deleted)
    if (existing) {
      handleSelectSnippet(existing)
      showToast(`Opening today's log: ${dateTitle}`, 'info')
      return
    }
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const initialCode = `# ${dateTitle}\n\n## Log Started at ${timeStr}\n\n- [ ] \n`
    let targetFolder = folders.find(f => ['inbox', 'daily', 'journal'].some(k => f.name.toLowerCase().includes(k)))
    let folderId = targetFolder ? targetFolder.id : null
    if (!targetFolder) {
      try {
        const folderResult = await saveFolder({ name: '📥 Inbox', parent_id: null })
        folderId = folderResult.id
      } catch (e) {}
    }
    const draft = createDraftSnippet(dateTitle, folderId, { initialCode, skipNavigation: false, isPinned: 0, isDraft: false })
    await saveSnippet({ ...draft, is_draft: false, is_pinned: 0 })
    showToast(`Journal entry "${dateTitle}" created`, 'success')
  }

  // --- Hooks Execution ---
  useFontSettings()
  useThemeManager()
  useFlowMode({ showPreview, togglePreview })
  useSessionRestore({ snippets, selectedSnippet, selectedFolderId, activeView, setSelectedSnippet, setSelectedFolderId, navigateTo, hasLoadedSnippets })
  useSnippetLifecycle({ settings, activeView, isCreatingSnippet, setIsCreatingSnippet, focusEditor, dirtySnippetIds, selectedSnippet, snippets, setSelectedSnippet, navigateTo, setZoomLevel, setEditorZoom, ZOOM_STEP })
  useWikiLinks({ snippets, handleSelectSnippet, createDraftSnippet, saveSnippet, setSelectedSnippet, navigateTo, showToast })

  useGlobalCommands({
    handlers: {
      onCommandNew: () => window.dispatchEvent(new CustomEvent('app:sidebar-start-creation', { detail: { type: 'snippet', parentId: selectedFolderId || selectedSnippet?.folder_id || null } })),
      onBulkDelete: (e) => { if (e.detail?.ids) deleteItem(e.detail.ids) },
      onCommandTheme: () => { const next = currentThemeId === 'polaris' ? 'midnight-pro' : 'polaris'; setTheme(next); showToast(`Theme switched to ${next === 'polaris' ? 'Light' : 'Dark'}`, 'info') },
      onCommandSidebar: () => updateSetting('sidebar.visible', settings?.sidebar?.visible === false),
      onCommandPreview: () => togglePreview(),
      onCommandSettings: (e) => navigateTo('settings', e.detail || {}),
      onCommandJsonEditor: async () => { if (window.api?.readSettingsFile) { const content = await window.api.readSettingsFile(); setSelectedSnippet({ id: 'system:settings', title: 'settings.json', code: content || '{}', language: 'json', timestamp: Date.now(), is_pinned: 0, is_draft: false }); navigateTo('editor'); } },
      onCommandDefaultSettingsEditor: async () => { if (window.api?.readDefaultSettingsFile) { const content = await window.api.readDefaultSettingsFile(); setSelectedSnippet({ id: 'system:default-settings', title: 'defaultSettings.js (Read Only)', code: content || '', language: 'javascript', timestamp: Date.now(), is_pinned: 0, is_draft: false, readOnly: true }); navigateTo('editor'); showToast('Opened default settings (read-only)', 'info') } },
      onCommandSyncCenter: () => openSettingsModal(),
      onCommandActivityBar: () => updateSetting('ui.showActivityBar', settings?.ui?.showActivityBar === false),
      onCommandZen: () => updateSetting('ui.showActivityBar', false),
      onCommandZenFocus: () => updateSetting('ui.zenFocus', !settings?.ui?.zenFocus),
      onCommandReset: () => { updateSetting('ui.showActivityBar', true); updateSetting('ui.showHeader', true); updateSetting('ui.showStatusBar', true); if (window.api?.restoreDefaultSize) window.api.restoreDefaultSize() },
      onCommandCopyImage: () => { if (selectedSnippet) openImageExportModal(selectedSnippet); else showToast('Open a snippet to export as image', 'info') },
      onCommandOverlay: () => setOverlayMode(!overlayMode),
      onCommandExportPDF: () => window.dispatchEvent(new CustomEvent('app:trigger-export-pdf')),
      onCommandStatusBar: () => updateSetting('ui.showStatusBar', settings?.ui?.showStatusBar === false),
      onCommandHeader: () => updateSetting('ui.showHeader', settings?.ui?.showHeader === false),
      onResetWindow: () => { if (window.api?.resetWindow) window.api.resetWindow(); updateSetting('ui.showActivityBar', true); updateSetting('sidebar.visible', true); updateSetting('ui.showHeader', true); updateSetting('ui.showStatusBar', true); showToast('Workspace Reset', 'success') },
      onCommandFavorite: () => { if (selectedSnippet) toggleFavoriteSnippet(selectedSnippet.id) },
      onCommandPing: () => { if (selectedSnippet) handlePing(selectedSnippet.id) },
      onCommandAIPilot: () => openAIPilot(),
      onOpenSnippet: () => {} // Handled by useWikiLinks
    },
    dependencies: [selectedSnippet, snippets, settings, currentThemeId, selectedFolderId, overlayMode]
  })

  // --- Delete/Rename Protections ---
  const isSystemFile = (id) => id === 'system:settings' || id === 'system:default-settings'

  const handleDeleteRequest = useCallback((id) => {
    if (isSystemFile(id)) {
      showToast('System files cannot be deleted', 'error')
      return
    }
    openDeleteModal(id, () => deleteItem(id))
  }, [openDeleteModal, deleteItem, showToast])

  // Split rename into Inline (sidebar) and Modal (shortcuts/menu)
  const handleInlineRename = useCallback((snippet, newName) => {
    if (isSystemFile(snippet.id)) {
      showToast('System files cannot be renamed', 'error')
      return
    }
    handleRenameSnippet({ 
      renameModal: { newName, item: snippet }, 
      saveSnippet, 
      setSelectedSnippet, 
      renameSnippet: (oldId, updated) => setSnippets(prev => [...prev.filter(s => s.id !== oldId), updated]), 
      snippets, 
      showToast 
    }).then(() => focusEditor())
  }, [saveSnippet, setSelectedSnippet, setSnippets, snippets, showToast, focusEditor])

  const handleModalRename = useCallback(() => {
    if (!selectedSnippet) return
    if (isSystemFile(selectedSnippet.id)) {
      showToast('System files cannot be renamed', 'info')
      return
    }
    openRenameModal(selectedSnippet, (newName) => {
      handleInlineRename(selectedSnippet, newName)
    })
  }, [selectedSnippet, openRenameModal, handleInlineRename, showToast])

  const onOpenPinPopover = useCallback((id, coords) => {
    setPinPopover({
      visible: true,
      x: coords.x,
      y: coords.y,
      snippetId: id,
      isCentered: false
    })
  }, [])

  return (
    <div className="workbench-shell h-full flex flex-col relative overflow-hidden bg-[var(--editor-bg)]">
      <Workbench
        snippets={sortedAndFilteredSnippets}
        selectedSnippet={selectedSnippet}
        folders={folders}
        trash={trash}
        hasLoadedSnippets={hasLoadedSnippets}
        activeView={activeView}
        onNavigate={navigateTo}
        onSelectFolder={setSelectedFolderId}
        selectedFolderId={selectedFolderId}
        selectedIds={selectedIds}
        onSelectIds={setSelectedIds}
        searchQuery={searchQuery}
        onSave={async (item) => {
          if (item.title && !isSystemFile(item.id)) { 
            const unique = getUniqueTitle(item.title, item.folder_id, item.id); 
            if (unique !== item.title) { 
              item.title = unique; 
              showToast(`Renamed to "${unique}"`, 'info') 
            } 
          }
          setAutosaveStatus('saving'); await saveSnippet(item); setAutosaveStatus('saved')
        }}
        onDeleteRequest={handleDeleteRequest}
        onNewSnippet={(title, folderId) => createDraftSnippet(getUniqueTitle(title, folderId), folderId, { isDraft: false })}
        onRenameSnippet={handleInlineRename}
        onInlineRename={handleInlineRename}
        onNewFolder={(name, parentId) => saveFolder({ name, parent_id: parentId })}
        onDailyNote={createDailyNote}
        onRenameFolder={(id, newName) => saveFolder({ id, name: newName })}
        onDeleteFolder={(id) => openDeleteModal(id, () => deleteFolder(id))}
        onToggleFolder={toggleFolderCollapse}
        onMoveSnippet={moveSnippet}
        onMoveFolder={moveFolder}
        onTogglePin={(id) => onOpenPinPopover(id, { x: window.innerWidth/2, y: window.innerHeight/2 })}
        onPing={handlePing}
        onToggleFavorite={toggleFavoriteSnippet}
        onSelectSnippet={handleSelectSnippet}
        onSearchSnippets={handleSearchSnippets}
        onOpenSettings={navigateTo}
        isSettingsOpen={isSettingsOpen}
        onCloseSettings={() => navigateTo('snippets')}
        showPreview={showPreview}
        onTogglePreview={togglePreview}
        isCompact={isCompact}
        onToggleCompact={() => setIsCompact(!isCompact)}
        dirtyIds={dirtySnippetIds}
        onDirtyStateChange={handleDirtyStateChange}
        autosaveStatus={autosaveStatus}
        onAutosave={setAutosaveStatus}
        isSearching={operations.isSearching}
        onToggleZenFocus={() => updateSetting('ui.zenFocus', !settings?.ui?.zenFocus)}
        onImageExport={() => { if (selectedSnippet) openImageExportModal(selectedSnippet) }}
        onCancelEditor={() => { if (selectedSnippet?.is_draft && !selectedSnippet.code && (!selectedSnippet.title || selectedSnippet.title.toLowerCase() === 'untitled')) setSnippets(prev => prev.filter(s => s.id !== selectedSnippet.id)); setIsCreatingSnippet(false); setSelectedSnippet(null); navigateTo('snippets') }}
      />
      
      {pinPopover.visible && (
        <PinPopover
          {...pinPopover}
          snippet={snippets.find(s => s.id === pinPopover.snippetId)}
          onClose={() => { setPinPopover(p => ({ ...p, visible: false })); focusEditor() }}
          onPing={handlePing}
          onFavorite={toggleFavoriteSnippet}
        />
      )}
      
      <KeyboardHandler 
        selectedSnippet={selectedSnippet}
        setSelectedSnippet={setSelectedSnippet}
        saveSnippet={saveSnippet}
        deleteSnippet={deleteItem}
        dirtySnippetIds={dirtySnippetIds}
        createDraftSnippet={createDraftSnippet}
        isCreatingSnippet={isCreatingSnippet}
        setIsCreatingSnippet={setIsCreatingSnippet}
        showToast={showToast}
        handleRename={handleModalRename}
        onToggleSidebar={() => updateSetting('sidebar.visible', settings?.sidebar?.visible === false)}
        onTogglePin={handlePing}
        onOpenPinPopover={onOpenPinPopover}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolderId}
        focusEditor={focusEditor}
        onToggleZenFocus={() => updateSetting('ui.zenFocus', !settings?.ui?.zenFocus)}
      />
    </div>
  )
}

export default SnippetLibraryInner
