import { useState, useEffect, useCallback } from 'react'

/**
 * useUniversalModal - A robust hook for managing draggable modals.
 * Supports triggering via standard React state or global events (for CodeMirror integration).
 */
export const useUniversalModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    content: null,
    footer: null,
    resetPosition: false,
    width: '550px',
    height: 'auto',
    isMaximized: false,
    data: null // For passing raw source or other state
  })

  const openModal = useCallback((config) => {
    setModalState({
      isOpen: true,
      title: config.title || 'Modal',
      content: config.content || null,
      footer: config.footer || null,
      resetPosition: !!config.resetPosition,
      width: config.width || '550px',
      height: config.height || 'auto',
      isMaximized: !!config.isMaximized,
      hideHeaderBorder: !!config.hideHeaderBorder,
      noTab: !!config.noTab,
      className: config.className || '',
      data: config.data || null
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  // Global Event Listener for non-React callers (like CodeMirror extensions)
  useEffect(() => {
    const handleGlobalOpen = (e) => {
      const { title, content, data, footer } = e.detail
      openModal({ title, content, data, footer })
    }

    window.addEventListener('app:open-universal-modal', handleGlobalOpen)
    return () => window.removeEventListener('app:open-universal-modal', handleGlobalOpen)
  }, [openModal])

  return {
    ...modalState,
    openModal,
    closeModal,
    setModalState
  }
}

/**
 * triggerUniversalModal - Helper for non-React code (e.g. CodeMirror extensions)
 */
export const triggerUniversalModal = (config) => {
  window.dispatchEvent(new CustomEvent('app:open-universal-modal', { detail: config }))
}
