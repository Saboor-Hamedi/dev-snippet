import { useEffect, useLayoutEffect } from 'react'

export const useSnippetLifecycle = ({
  settings,
  activeView,
  isCreatingSnippet,
  setIsCreatingSnippet,
  focusEditor,
  dirtySnippetIds,
  selectedSnippet,
  snippets,
  setSelectedSnippet,
  navigateTo,
  setZoomLevel,
  setEditorZoom,
  ZOOM_STEP
}) => {
  // Sync Zen Focus class to body
  useLayoutEffect(() => {
    if (settings?.ui?.zenFocus) {
      document.body.classList.add('zen-focus-active')
    } else {
      document.body.classList.remove('zen-focus-active')
    }
  }, [settings?.ui?.zenFocus])

  // Clear creation state on view change
  useEffect(() => {
    if (activeView === 'graph' || activeView === 'settings') {
      setIsCreatingSnippet(false)
    }
  }, [activeView, setIsCreatingSnippet])

  // Global window dirty tracking
  useEffect(() => {
    if (window.api?.setWindowDirty) {
      window.api.setWindowDirty(dirtySnippetIds.size > 0)
    }
  }, [dirtySnippetIds])

  // Window Close Handler
  useEffect(() => {
    let unsubscribe = null
    if (window.api?.onCloseRequest) {
      unsubscribe = window.api.onCloseRequest(() => {
        if (dirtySnippetIds.size > 0) {
          const firstDirtyId = Array.from(dirtySnippetIds)[0]
          if (!selectedSnippet || selectedSnippet.id !== firstDirtyId) {
            const snippet = snippets.find((s) => s.id === firstDirtyId)
            if (snippet) {
              setSelectedSnippet(snippet)
              navigateTo('editor')
            }
          }
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('app:trigger-close-check'))
          }, 50)
        } else {
          if (window.api?.closeWindow) window.api.closeWindow()
        }
      })
    }
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [dirtySnippetIds, selectedSnippet, snippets, setSelectedSnippet, navigateTo])

  // Navigation / Focus helper
  useEffect(() => {
    if (activeView === 'editor' || isCreatingSnippet) {
      focusEditor()
    }
  }, [activeView, isCreatingSnippet, focusEditor])

  // Zoom listeners
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
  }, [setZoomLevel, setEditorZoom, ZOOM_STEP])
}
