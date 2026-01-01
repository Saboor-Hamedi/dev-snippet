import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'dev-snippet:workspace-session'

/**
 * useSessionRestore
 * Automatically persists and restores the user's workspace state (active snippet, folder, view).
 *
 * @param {Object} props
 * @param {Array} props.snippets - List of available snippets (needed for validation)
 * @param {Object} props.selectedSnippet - Currently active snippet object
 * @param {String} props.selectedFolderId - Currently selected folder ID
 * @param {String} props.activeView - Current view ('editor', 'snippets', etc)
 * @param {Function} props.setSelectedSnippet - State setter for snippet
 * @param {Function} props.setSelectedFolderId - State setter for folder
 * @param {Function} props.navigateTo - View navigation function
 */
export const useSessionRestore = ({
  snippets,
  selectedSnippet,
  selectedFolderId,
  activeView,
  setSelectedSnippet,
  setSelectedFolderId,
  navigateTo,
  hasLoadedSnippets
}) => {
  const [isRestoring, setIsRestoring] = useState(true)

  // 1. Session Saver
  useEffect(() => {
    // CRITICAL: Do not save state until we have finished attempting to restore the previous one.
    if (isRestoring) return

    const session = {
      snippetId: selectedSnippet?.id || null,
      folderId: selectedFolderId || null,
      view: activeView,
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch (e) {
      console.warn('[Session] Failed to save state:', e)
    }
  }, [selectedSnippet, selectedFolderId, activeView, snippets, isRestoring])

  // 2. Session Restorer
  useEffect(() => {
    // Only run once when snippets are actually loaded
    if (!isRestoring) return

    if (!hasLoadedSnippets) return

    // Safety check: if there is no session stored, we are done immediately
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setIsRestoring(false)
      return
    }

    try {
      const session = JSON.parse(raw)
      console.debug('[Session] Restoring session:', session)

      let restoredSomething = false

      // Restore Active Snippet
      if (session.snippetId) {
        const found = snippets.find((s) => s.id === session.snippetId)
        if (found) {
          setSelectedSnippet(found)
          if (session.view === 'editor') {
            navigateTo('editor')
            restoredSomething = true
          }
        }
      }

      // Restore Active Folder
      if (session.folderId && !restoredSomething) {
        if (!session.snippetId) {
          setSelectedFolderId(session.folderId)
          restoredSomething = true
        }
      }

      // Restore View (if generic)
      if (!restoredSomething && session.view && session.view !== 'editor') {
        navigateTo(session.view)
      }

      setIsRestoring(false)
    } catch (e) {
      console.error('[Session] Failed to restore:', e)
      setIsRestoring(false)
    }
  }, [
    snippets,
    setSelectedSnippet,
    setSelectedFolderId,
    navigateTo,
    isRestoring,
    hasLoadedSnippets
  ])

  return { isRestoring }
}
