import { useCallback, useEffect } from 'react'

/**
 * useEditorCloseCheck - Manages the "Unsaved Changes" protection logic
 * 
 * This hook:
 * - Provides handleTriggerCloseCheck function
 * - Manages the "Discard/Save" modal when closing editor or window
 * - Listens for global close requests
 */
export const useEditorCloseCheck = ({
  isDirty,
  setIsDirty,
  codeRef,
  setCode,
  title,
  initialSnippet,
  onSave,
  onCancel,
  onDirtyStateChange,
  openModal,
  closeUni,
  handleSave,
  isDiscardingRef,
  skipAutosaveRef,
  isDirtyRef
}) => {
  const handleTriggerCloseCheck = useCallback(
    (isWindowClose = false) => {
      if (isDirty) {
        openModal({
          title: 'Unsaved Changes',
          width: '320px',
          content: (
            <div className="p-4 text-[var(--color-text-secondary)] text-sm">
              <p>
                Save changes to "
                <span className="text-[var(--color-text-primary)] font-semibold">
                  {title || 'Untitled'}
                </span>
                "?
              </p>
            </div>
          ),
          footer: (
            <div className="flex justify-end gap-2 w-full px-4 pb-3">
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white/10 text-[var(--color-text-secondary)] transition-colors"
                onClick={() => closeUni()}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                onClick={async () => {
                  if (isDiscardingRef) isDiscardingRef.current = true
                  if (skipAutosaveRef) skipAutosaveRef.current = true

                  const originalCode = initialSnippet?.code || ''
                  setCode(originalCode)
                  if (codeRef) codeRef.current = originalCode
                  setIsDirty(false)
                  if (isDirtyRef) isDirtyRef.current = false
                  
                  if (initialSnippet?.id && onDirtyStateChange) {
                    onDirtyStateChange(initialSnippet.id, false)
                  }

                  if (window.api?.setWindowDirty) {
                    await window.api.setWindowDirty(false)
                  }

                  closeUni()

                  if (isWindowClose) {
                    if (window.api?.closeWindow) window.api.closeWindow()
                  } else {
                    if (onCancel) onCancel(true)
                  }
                }}
              >
                Discard
              </button>
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--color-accent-primary)] text-white hover:opacity-90 transition-colors shadow-sm"
                onClick={() => {
                  handleSave(false).then(async () => {
                    closeUni()
                    if (window.api?.setWindowDirty) {
                      await window.api.setWindowDirty(false)
                    }
                    if (isWindowClose) {
                      if (window.api?.closeWindow) window.api.closeWindow()
                    } else {
                      if (onCancel) onCancel(true)
                    }
                  })
                }}
              >
                Save
              </button>
            </div>
          )
        })
        return
      }

      if (isWindowClose) {
        if (window.api?.closeWindow) window.api.closeWindow()
      } else if (onCancel) {
        onCancel()
      }
    },
    [isDirty, title, openModal, closeUni, onCancel, handleSave, initialSnippet, onDirtyStateChange, setIsDirty, setCode, codeRef, isDiscardingRef, skipAutosaveRef, isDirtyRef]
  )

  useEffect(() => {
    const handleCloseCheck = () => handleTriggerCloseCheck()
    window.addEventListener('app:trigger-close-check', handleCloseCheck)

    let unsubscribeClose = null
    if (window.api?.onCloseRequest) {
      unsubscribeClose = window.api.onCloseRequest(() => handleTriggerCloseCheck(true))
    }

    return () => {
      window.removeEventListener('app:trigger-close-check', handleCloseCheck)
      if (unsubscribeClose) unsubscribeClose()
    }
  }, [handleTriggerCloseCheck])

  return { handleTriggerCloseCheck }
}
