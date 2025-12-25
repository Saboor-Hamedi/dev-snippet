import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import { useSnippetData } from '../../hook/useSnippetData'
import { handleRenameSnippet } from '../../hook/handleRenameSnippet'
import Workbench from './Workbench'
import { useSettings } from '../../hook/useSettingsContext'
import useFontSettings from '../../hook/settings/useFontSettings'
import { useZoomLevel, useEditorZoomLevel } from '../../hook/useZoomLevel'
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
    searchSnippetList,
    // Trash props
    trash,
    loadTrash,
    restoreItem,
    permanentDeleteItem
  } = snippetData
  const { activeView, showPreview, togglePreview, navigateTo } = useView()
  const { openRenameModal, openDeleteModal, openImageExportModal } = useModal()
  const { settings, getSetting, updateSetting } = useSettings()
  const { toast, showToast } = useToast()

  const isCompact = getSetting('ui.compactMode') || false
  const setIsCompact = (val) => updateSetting('ui.compactMode', val)

  const [autosaveStatus, setAutosaveStatus] = useState(null)
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)
  const [zoomLevel, setZoomLevel] = useZoomLevel()
  const [editorZoom, setEditorZoom] = useEditorZoomLevel()

  // Lifted Sidebar State - defaults to closed, remembers last state
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => localStorage.getItem('sidebarOpen') === 'true'
  )
  const handleToggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), [])

  useEffect(() => localStorage.setItem('sidebarOpen', isSidebarOpen), [isSidebarOpen])

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
  const createDraftSnippet = (initialTitle = '') => {
    // Singleton Pattern: If an empty draft exists, reuse it instead of creating a new one.
    if (!initialTitle) {
      const existingBlank = snippets.find(
        (s) => (!s.title || s.title.trim() === '') && (!s.code || s.code.trim() === '')
      )

      if (existingBlank) {
        setSelectedSnippet(existingBlank)
        setIsCreatingSnippet(true)
        navigateTo('editor')
        showToast('Resuming empty draft', 'info')
        return existingBlank
      }
    }

    const draft = {
      id: Date.now().toString(),
      title: initialTitle,
      code: '',
      timestamp: Date.now(),
      type: 'snippet',
      is_draft: true
    }
    setSnippets((prev) => [draft, ...prev])
    setSelectedSnippet(draft)
    setIsCreatingSnippet(true)
    navigateTo('editor')
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
    const onCommandNew = () => createDraftSnippet()
    const onCommandTheme = () => {
      const current = themeRef.current
      const next = current === 'polaris' ? 'midnight-pro' : 'polaris'
      setTheme(next)
      showToast(`Theme switched to ${next === 'polaris' ? 'Light' : 'Dark'}`, 'info')
    }
    const onCommandSidebar = () => handleToggleSidebar()
    const onCommandPreview = () => togglePreview()
    const onCommandSettings = () => navigateTo('settings')
    const onCommandCopyImage = () => {
      if (selectedSnippet) {
        openImageExportModal(selectedSnippet)
      } else {
        showToast('Open a snippet to export as image', 'info')
      }
    }

    window.addEventListener('app:command-new-snippet', onCommandNew)
    window.addEventListener('app:toggle-theme', onCommandTheme)
    window.addEventListener('app:toggle-sidebar', onCommandSidebar)
    window.addEventListener('app:toggle-preview', onCommandPreview)
    window.addEventListener('app:open-settings', onCommandSettings)
    window.addEventListener('app:command-copy-image', onCommandCopyImage)

    return () => {
      window.removeEventListener('app:command-new-snippet', onCommandNew)
      window.removeEventListener('app:toggle-theme', onCommandTheme)
      window.removeEventListener('app:toggle-sidebar', onCommandSidebar)
      window.removeEventListener('app:toggle-preview', onCommandPreview)
      window.removeEventListener('app:open-settings', onCommandSettings)
      window.removeEventListener('app:command-copy-image', onCommandCopyImage)
    }
  }, [createDraftSnippet, handleToggleSidebar, togglePreview, navigateTo, setTheme, showToast])

  // --- Handlers for Workbench ---
  const handleDeleteRequest = (id) => {
    openDeleteModal(id, async (targetId) => {
      await deleteItem(targetId)
    })
  }

  const handleSelectSnippet = (s) => {
    setSelectedSnippet(s)
    navigateTo('editor')
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
      />

      <div className="flex-1 flex flex-col items-stretch min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Workbench
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeView={isCreatingSnippet ? 'editor' : activeView}
          currentContext={activeView}
          selectedSnippet={selectedSnippet}
          snippets={snippets}
          trash={trash}
          onRestoreItem={restoreItem}
          onPermanentDeleteItem={permanentDeleteItem}
          onLoadTrash={loadTrash}
          onCloseSnippet={() => {
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

                const duplicate = snippets.find(
                  (s) => normalize(s.title) === targetBase && s.id !== item.id
                )
                if (duplicate) {
                  showToast(`${item.title}: already taken`, 'error')
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
                showToast('⚠️ Title conflict: Name already taken (DB)', 'error')
              } else {
                console.error(e)
              }
            }
          }}
          onDeleteRequest={handleDeleteRequest}
          onNewSnippet={() => createDraftSnippet()}
          onSelectSnippet={handleSelectSnippet}
          onSearchSnippets={searchSnippetList}
          onOpenSettings={() => navigateTo('settings')}
          onCloseSettings={() => navigateTo('snippets')}
          onRename={handleRenameRequest}
        />
      </div>
    </div>
  )
}

// Wrapper Component to inject Providers
const SnippetLibrary = () => {
  useFontSettings() // Global effect
  useThemeManager() // Global theme management
  const snippetData = useSnippetData() // Global data

  return (
    <ViewProvider>
      <ModalProvider
        snippets={snippetData.snippets}
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
