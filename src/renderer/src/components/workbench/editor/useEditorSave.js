import { useCallback, useRef, useEffect } from 'react'
import { extractTags } from '../../../utils/snippetUtils'

/**
 * useEditorSave - Manages save logic (autosave, manual save, validation)
 * 
 * This hook handles:
 * - Autosave scheduling and cancellation
 * - Manual save (Ctrl+S)
 * - Duplicate title validation
 * - Draft snippet handling
 * - Save status tracking
 */
export const useEditorSave = ({
  code,
  title,
  tags,
  currentTagInput,
  initialSnippet,
  autoSaveEnabled,
  onSave,
  isDuplicate,
  getSetting,
  showToast,
  setIsDirty,
  isDirty,
  onDirtyStateChange,
  onAutosave,
  isReadOnly = false
}) => {
  const isInitialMount = useRef(true)
  const saveTimerRef = useRef(null)
  const lastSavedCode = useRef(initialSnippet?.code || '')
  const lastSavedTitle = useRef(initialSnippet?.title || '')

  const scheduleSave = useCallback(() => {
    if (!autoSaveEnabled || isReadOnly) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(
      async () => {
        const id = initialSnippet?.id
        if (!id) return

        // DISCARD PROTECTION: Don't autosave if it's a brand new untitled snippet with no content
        const isUntitled = !title || title.toLowerCase() === 'untitled'
        const hasNoContent = !code || code.trim() === ''
        if (isUntitled && hasNoContent && initialSnippet?.is_draft) {
          return
        }

        const detectedLang = (() => {
          const safeTitle = typeof title === 'string' ? title : ''
          const ext = safeTitle.includes('.') ? safeTitle.split('.').pop()?.toLowerCase() : null
          let lang = ext || 'plaintext'
          if (!ext && code) {
            const trimmed = code.substring(0, 500).trim()
            if (
              trimmed.startsWith('# ') ||
              trimmed.startsWith('## ') ||
              trimmed.startsWith('### ') ||
              trimmed.startsWith('- ') ||
              trimmed.startsWith('* ') ||
              trimmed.startsWith('```') ||
              trimmed.startsWith('>') ||
              trimmed.includes('**') ||
              trimmed.includes(']]')
            ) {
              lang = 'markdown'
            }
          }
          return lang
        })()

        const updatedSnippet = {
          ...initialSnippet,
          id: id,
          title: title,
          code: code,
          language: detectedLang || 'markdown',
          timestamp: Date.now(),
          type: initialSnippet?.type || 'snippet',
          tags: Array.from(
            new Set([
              ...tags,
              ...currentTagInput
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
              ...extractTags(code)
            ])
          ).filter((t) => typeof t === 'string' && !/^\d+$/.test(t)),
          is_draft: false,
          folder_id: initialSnippet?.folder_id || null,
          is_pinned: initialSnippet?.is_pinned || 0
        }

        if (isDuplicate) {
          return
        }

        try {
          onAutosave && onAutosave('saving')
          window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'saving' } }))

          await onSave(updatedSnippet)

          onAutosave && onAutosave('saved')
          window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'saved' } }))
          setIsDirty(false)
          lastSavedCode.current = code
          lastSavedTitle.current = title
        } catch (err) {
          onAutosave && onAutosave('error')
          window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'error' } }))
        }
      },
      initialSnippet?.id === 'system:settings' ? 800 : getSetting('behavior.autoSaveDelay') || 2000
    )
  }, [code, title, tags, currentTagInput, initialSnippet, autoSaveEnabled, onSave, isDuplicate, getSetting, setIsDirty, onAutosave])

  // NEW: Internal Autosave Controller (Centralized)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (!setIsDirty || !autoSaveEnabled || initialSnippet?.id === 'system:settings') return
    
    // STRICT GUARD: Only schedule if actually dirty.
    if (isDirty) {
      scheduleSave()
    } else {
      // If not dirty (e.g. manually saved or reverted), cancel any pending autosave
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [code, title, isDirty, autoSaveEnabled, scheduleSave, initialSnippet?.id])

  // Register autosave cancel handler
  useEffect(() => {
    const id = initialSnippet?.id
    if (id) {
      if (!window.__autosaveCancel) window.__autosaveCancel = new Map()
      window.__autosaveCancel.set(id, () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      })
    }
    return () => {
      const id2 = initialSnippet?.id
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (id2 && window.__autosaveCancel) window.__autosaveCancel.delete(id2)
    }
  }, [initialSnippet?.id])

  const handleSave = async (forceSave = false, customTitle = null) => {
    if (isReadOnly) return { success: false }
    const finalTitle = customTitle || title

    if ((initialSnippet?.id && !initialSnippet?.is_draft && finalTitle !== '') || forceSave) {
      const unchanged =
        lastSavedCode.current === code && lastSavedTitle.current === (finalTitle || title)

      if (unchanged && !forceSave) {
        showToast?.('No changes to save', 'info')
        return
      }
    }

    if (!finalTitle || finalTitle.toLowerCase() === 'untitled') {
      return { needsName: true }
    }

    if (isDuplicate) {
      showToast?.('Snippet name already exists in this folder', 'error')
      return
    }

    const payload = {
      ...initialSnippet,
      id: initialSnippet?.id || Date.now().toString(),
      title: finalTitle,
      code: code,
      tags: Array.from(
        new Set([
          ...tags,
          ...currentTagInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          ...extractTags(code)
        ])
      ).filter((t) => typeof t === 'string' && !/^\d+$/.test(t)),
      is_draft: false,
      folder_id: initialSnippet?.folder_id || null,
      is_pinned: initialSnippet?.is_pinned || 0
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    try {
      window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'saving' } }))

      await onSave(payload)

      window.dispatchEvent(new CustomEvent('autosave-complete', { detail: { id: payload.id } }))
      window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'saved' } }))

      setIsDirty(false)
      window.__lastSaveTime = Date.now()
      lastSavedCode.current = code
      lastSavedTitle.current = finalTitle

      if (initialSnippet?.id && onDirtyStateChange) {
        onDirtyStateChange(initialSnippet.id, false)
      }

      return { success: true }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: null } }))
      return { error: err }
    }
  }

  return {
    scheduleSave,
    handleSave,
    lastSavedCode,
    lastSavedTitle,
    saveTimerRef
  }
}
