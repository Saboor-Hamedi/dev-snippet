import { useCallback } from 'react'

/**
 * useSnippetOperations - Handles snippet CRUD operations
 * 
 * This hook manages:
 * - Creating new snippets (including daily notes)
 * - Saving snippets
 * - Toggling favorite status
 * - Toggling pin status
 * - Draft snippet creation
 */
export const useSnippetOperations = ({
  snippets,
  folders,
  saveSnippet,
  saveFolder,
  setSnippets,
  setSelectedSnippet,
  setIsCreatingSnippet,
  navigateTo,
  showToast
}) => {
  const createDailyNote = useCallback(async () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateTitle = `${year}-${month}-${day}`

    // Check if a note for today already exists
    const existing = snippets.find((s) => {
      const baseTitle = s.title?.replace(/\.md$/i, '')
      return baseTitle === dateTitle && !s.is_deleted
    })

    if (existing) {
      setSelectedSnippet(existing)
      showToast(`Opening today's log: ${dateTitle}`, 'info')
      return
    }

    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

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

    await saveSnippet({
      ...draft,
      is_draft: false,
      is_pinned: 0
    })

    showToast(`Journal entry "${dateTitle}" created`, 'success')
  }, [snippets, folders, saveFolder, saveSnippet, setSelectedSnippet, showToast])

  const createDraftSnippet = useCallback(
    (initialTitle = '', folderId = null, options = {}) => {
      if (!initialTitle && !folderId) {
        const existingBlank = snippets.find(
          (s) =>
            (!s.title || s.title.trim() === '') &&
            (!s.code || s.code.trim() === '') &&
            !s.folder_id
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
    },
    [snippets, setSnippets, setSelectedSnippet, setIsCreatingSnippet, navigateTo, showToast]
  )

  const toggleFavoriteSnippet = useCallback(
    async (id) => {
      try {
        const s = snippets.find((t) => t.id === id)
        if (!s) return
        const updated = { ...s, is_favorite: s.is_favorite === 1 ? 0 : 1 }
        await saveSnippet(updated)

        setSnippets((prev) => prev.map((it) => (it.id === id ? updated : it)))
        setSelectedSnippet((current) => (current?.id === id ? updated : current))
      } catch (err) {
        console.error('Failed toggle favorite from sidebar/menu', err)
        showToast('Failed to toggle favorite', 'error')
      }
    },
    [snippets, saveSnippet, setSnippets, setSelectedSnippet, showToast]
  )

  const handlePing = useCallback(
    async (id) => {
      try {
        const s = snippets.find((t) => t.id === id)
        if (s) {
          const isCurrentlyPinned = s.is_pinned === 1
          const updated = {
            ...s,
            is_pinned: isCurrentlyPinned ? 0 : 1,
            timestamp: Date.now()
          }

          await saveSnippet(updated)
          setSnippets((prev) => prev.map((it) => (it.id === id ? updated : it)))
          setSelectedSnippet(updated)
          navigateTo('editor')
        }
      } catch (err) {
        console.error('Failed to toggle pin', err)
        showToast('Failed to toggle pin', 'error')
      }
    },
    [snippets, saveSnippet, setSnippets, setSelectedSnippet, navigateTo, showToast]
  )

  return {
    createDailyNote,
    createDraftSnippet,
    toggleFavoriteSnippet,
    handlePing
  }
}
