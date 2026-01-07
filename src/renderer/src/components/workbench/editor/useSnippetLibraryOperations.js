import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { getBaseTitle } from '../../../utils/snippetUtils'

export const useSnippetLibraryOperations = ({
  snippetData,
  viewContext,
  modalContext,
  settingsContext,
  toastContext
}) => {
  const {
    snippets,
    selectedSnippet,
    setSelectedSnippet,
    setSnippets,
    saveSnippet: originalSaveSnippet,
    deleteItem,
    folders,
    saveFolder,
    searchSnippetList
  } = snippetData

  const { activeView, showPreview, togglePreview, navigateTo } = viewContext
  const {
    openRenameModal,
    openDeleteModal,
    openSettingsModal,
    openAIPilot
  } = modalContext

  const { settings, getSetting, updateSetting, updateSettings: contextUpdateSettings } = settingsContext
  const { showToast } = toastContext

  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)
  const [dirtySnippetIds, setDirtySnippetIds] = useState(new Set())
  const [sidebarSearchResults, setSidebarSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  const saveSnippet = useCallback(
    async (s, options = false) => {
      const silent = typeof options === 'object' ? options.silent : options
      if (!s) return

      if (s.id === 'system:settings') {
        try {
          const parsed = JSON.parse(s.code)
          if (contextUpdateSettings) {
            try {
              window.__isSavingSettings = true
              await contextUpdateSettings(parsed)
            } finally {
              setTimeout(() => {
                window.__isSavingSettings = false
              }, 1000)
            }
            showToast('✓ Settings synchronized to disk', 'success')
            return
          }
        } catch (e) {
          if (!silent) {
            showToast('Invalid JSON structure. Please check your syntax.', 'error')
          }
          return
        }
      }

      await originalSaveSnippet(s, options)
    },
    [contextUpdateSettings, originalSaveSnippet, showToast]
  )

  const handleSelectSnippet = useCallback(
    (s) => {
      if (!s) {
        setSelectedSnippet(null)
        return
      }

      if (
        selectedSnippet &&
        selectedSnippet.id !== s.id &&
        dirtySnippetIds.has(selectedSnippet.id)
      ) {
        window.__pendingSnippetSwitch = s
        window.dispatchEvent(new CustomEvent('app:trigger-close-check'))
        return
      }

      setSelectedSnippet(s)
      navigateTo('editor')
    },
    [setSelectedSnippet, navigateTo, selectedSnippet, dirtySnippetIds]
  )

  const createDraftSnippet = useCallback((initialTitle = '', folderId = null, options = {}) => {
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
  }, [snippets, setSelectedSnippet, setSnippets, navigateTo, showToast])

  const handlePing = useCallback(
    async (id) => {
      const s = snippets.find((t) => t.id === id)
      if (s) {
        const updated = {
          ...s,
          is_pinned: s.is_pinned === 1 ? 0 : 1,
          timestamp: Date.now()
        }
        await saveSnippet(updated)
        setSnippets((prev) => prev.map((it) => (it.id === id ? updated : it)))
        setSelectedSnippet(updated)
        navigateTo('editor')
      }
    },
    [snippets, setSelectedSnippet, navigateTo, setSnippets, saveSnippet]
  )

  return {
    isCreatingSnippet,
    setIsCreatingSnippet,
    dirtySnippetIds,
    setDirtySnippetIds,
    sidebarSearchResults,
    setSidebarSearchResults,
    isSearching,
    setIsSearching,
    saveSnippet,
    handleSelectSnippet,
    createDraftSnippet,
    handlePing
  }
}
