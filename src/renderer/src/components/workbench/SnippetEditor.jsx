  // SnippetEditor
  // - Responsible for editing a single snippet (draft or existing)
  // - Provides debounced autosave, forced-save (Ctrl+S) and name/save modal
  // - Receives `showToast` from parent to display user-facing toasts
  import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useKeyboardShortcuts } from '../../hook/useKeyboardShortcuts.js'
import WelcomePage from '../WelcomePage.jsx'
import StatusBar from '../StatusBar.jsx'
import SplitPane from '../SplitPane.jsx'
import LivePreview from '../LivePreview.jsx'

const SnippetEditor = ({
  onSave,
  initialSnippet,
  onCancel,
  onNew,
  onDelete,
  isCreateMode,
  activeView,
  onSettingsClick,
  onAutosave,
  showToast,
  // layout control forwarded from parent
  isCompact,
  onToggleCompact
  ,
  showPreview = false
}) => {
  const [code, setCode] = useState(initialSnippet?.code || '')
  const [language, setLanguage] = React.useState(initialSnippet?.language || 'md')
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    try {
      return localStorage.getItem('autoSave') === 'true'
    } catch (e) {
      return false
    }
  })

  const saveTimerRef = useRef(null)
  const lastPendingRef = useRef(0)

  const isDeletingRef = useRef(false)
  const textareaRef = useRef(null)
  // Local compact mode (used only if parent doesn't control it)
  const [localCompact, setLocalCompact] = useState(() => {
    try {
      return localStorage.getItem('compactMode') === 'true'
    } catch (e) {
      return false
    }
  })


  
  useEffect(() => {
    try {
      localStorage.setItem('compactMode', localCompact)
    } catch (e) {}
  }, [localCompact])

  // If parent passes `isCompact` and `onToggleCompact`, treat compact as controlled.
  // Otherwise fall back to local compact state `localCompact`.
  const controlledCompact = typeof isCompact !== 'undefined'
  const compact = controlledCompact ? isCompact : localCompact
  const onToggleCompactHandler = () => {
    if (typeof onToggleCompact === 'function') {
      onToggleCompact()
    } else {
      setLocalCompact((s) => !s)
    }
  }

  // Focus the textarea when initialSnippet changes (when opening a snippet)
  useEffect(() => {
    if (initialSnippet && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus()
      }, 50)
    }
  }, [initialSnippet?.id]) // Re-run when snippet ID changes

  // Focus the textarea when in create mode 
  useEffect(() => {
    if (isCreateMode && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isCreateMode])

  const scheduleSave = () => {
    // If autosave is disabled, skip scheduling
    if (!autoSaveEnabled) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    // Debounce autosave: 5000ms to reduce frequent writes for large snippets
    // Emit a rate-limited 'pending' status so header shows "Saving..."
    // without updating on every keystroke. Limit to once per 800ms.
    try {
      const now = Date.now()
      if (!lastPendingRef.current || now - lastPendingRef.current > 800) {
        onAutosave && onAutosave('pending')
        lastPendingRef.current = now
      }
    } catch {}
    saveTimerRef.current = setTimeout(async () => {
      const id = initialSnippet?.id
      if (!id) return
      if (isDeletingRef.current) return
      if (window.__deletedIds && window.__deletedIds.has(id)) return
      if (initialSnippet?.is_draft && (!initialSnippet?.title || !initialSnippet.title.trim()))
        return
      const updatedSnippet = {
        id: id,
        title: initialSnippet.title,
        code: code,
        language: language,
        timestamp: Date.now(),
        type: initialSnippet.type || 'snippet',
        tags: extractTags(code)
      }
      try {
        onAutosave && onAutosave('saving')
      } catch {}
      try {
        // Allow onSave to be async and wait for completion
        await onSave(updatedSnippet)
        onAutosave && onAutosave('saved')
        // Clear dirty flag after a successful autosave
        try {
          setIsDirty(false)
        } catch {}
      } catch (err) {
        onAutosave && onAutosave(null)
      }
    }, 5000)
  }

  useEffect(() => {
    // Register canceler globally keyed by snippet id
    const id = initialSnippet?.id
    if (id) {
      if (!window.__autosaveCancel) window.__autosaveCancel = new Map()
      window.__autosaveCancel.set(id, () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      })
    }
    return () => {
      const id2 = initialSnippet?.id
      try {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        if (id2 && window.__autosaveCancel) window.__autosaveCancel.delete(id2)
      } catch {}
    }
  }, [initialSnippet?.id])

  // Listen for autosave toggle events from SettingsPanel
  useEffect(() => {
    const onToggle = (e) => {
      try {
        const enabled = !!(e && e.detail && e.detail.enabled)
        setAutoSaveEnabled(enabled)
        if (!enabled) {
          // cancel any pending autosave
          if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current)
            saveTimerRef.current = null
          }
        }
      } catch {}
    }
    window.addEventListener('autosave:toggle', onToggle)
    return () => window.removeEventListener('autosave:toggle', onToggle)
  }, [])

  // Track if this is the initial mount to prevent autosave on first render
  const isInitialMount = useRef(true)
  const lastSnippetId = useRef(initialSnippet?.id)

  // Update language/code if initialSnippet changes (only on ID change to prevent autosave loops)
  React.useEffect(() => {
    if (initialSnippet && initialSnippet.id !== lastSnippetId.current) {
      setLanguage(initialSnippet.language || 'md')
      setCode(initialSnippet.code || '')
      // Loading a new snippet is not a user edit — reset dirty and skip autosave once
      try {
        setIsDirty(false)
      } catch {}
      try {
        isInitialMount.current = true
      } catch {}
      lastSnippetId.current = initialSnippet.id
    }
  }, [initialSnippet?.id])

  const [nameOpen, setNameOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')

  // Trigger debounced save on content or language change
  useEffect(() => {
    if (!initialSnippet?.title) return
    // Skip autosave on initial mount/load
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Only schedule autosave when user actually changed content
    if (!isDirty) return
    if (!autoSaveEnabled) return
    scheduleSave()
  }, [code, language])

  // Handle keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: () => {
      onCancel && onCancel()
    },
    onSave: () => {
      // Ctrl+S: Open save prompt if no title, otherwise trigger autosave
      const title = initialSnippet?.title || ''
      if (!title || title.toLowerCase() === 'untitled') {
        setNameInput('')
        setNameOpen(true)
      }
    }
  })

  // Ensure keyboard shortcut for toggle uses parent handler when present
  useKeyboardShortcuts({
    onToggleCompact: onToggleCompactHandler
  })

  const handleSave = () => {
    ;(async () => {
      let title = initialSnippet?.title || ''
      // If nothing changed (title, code, language), do nothing — avoid
      // showing a "Saved" indicator when there are no edits.
      try {
        const prevCode = initialSnippet?.code || ''
        const prevLang = initialSnippet?.language || 'md'
        const prevTitle = initialSnippet?.title || ''
        const unchanged = prevCode === (code || '') && prevLang === (language || 'md') && prevTitle === title
        if (unchanged) {
          // Nothing changed — show subtle feedback and return early.
          try {
            if (typeof showToast === 'function') showToast('No changes to save', 'info')
          } catch {}
          return
        }
      } catch (e) {}
      if (!title || title.toLowerCase() === 'untitled') {
        setNameInput('')
        setNameOpen(true)
        return
      }
      const payload = {
        id: initialSnippet?.id || Date.now().toString(),
        title,
        code: code,
        language: 'md',
        timestamp: Date.now(),
        type: 'snippet',
        tags: extractTags(code),
        is_draft: false
      }
      // If there is a pending autosave timer, cancel it so we don't run
      // the debounced save afterwards (avoid duplicate saves/state flips).
      try {
        const id = initialSnippet?.id
        if (id && window.__autosaveCancel && window.__autosaveCancel.get(id)) {
          try {
            window.__autosaveCancel.get(id)()
          } catch {}
        }
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current)
          saveTimerRef.current = null
        }
      } catch {}

      // Optimistic UI: show 'saved' immediately for a snappier feel when
      // the user presses Ctrl+S. If the async save fails, emit an error
      // state so the UI can show failure.
      try {
        onAutosave && onAutosave('saved')
      } catch {}
      try {
        await onSave(payload)
        // notify parent that a forced save completed so they can show toast
        try {
          window.dispatchEvent(new CustomEvent('autosave:complete', { detail: { id: payload.id } }))
        } catch {}
        // keep 'saved' state; parent may clear it after a short delay
      } catch (err) {
        // indicate failure
        try {
          onAutosave && onAutosave('error')
          window.dispatchEvent(new CustomEvent('autosave:error', { detail: { id: payload.id } }))
        } catch {}
      }
    })()
  }

  // Listen for an external 'force-save' event (e.g., Ctrl+S from global handler)
  useEffect(() => {
    const fn = (e) => {
      try {
        handleSave()
      } catch {}
    }
    window.addEventListener('force-save', fn)
    return () => window.removeEventListener('force-save', fn)
  }, [code, initialSnippet])

  return (
    <>
      {
        // Guard: if not in create mode and there's no valid snippet, show Welcome
        !isCreateMode && (!initialSnippet || !initialSnippet.id) ? (
          <WelcomePage onNewSnippet={onNew} />
        ) : (
          <div className="h-full overflow-hidden flex flex-col items-stretch bg-slate-50 dark:bg-[#0d1117] transition-colors duration-200 relative">
            {/* Header is rendered at the top-level (SnippetLibrary). Do not render it here to avoid duplicates. */}
            <div
              className="flex-1 min-h-0 overflow-hidden editor-container relative"
              style={{ backgroundColor: 'var(--editor-bg)', display: 'flex' }}
              data-color-mode={
                document.documentElement.classList.contains('dark') ? 'dark' : 'light'
              }
            >
              <SplitPane
                rightHidden={!showPreview}
                left={
                  <textarea
                    ref={textareaRef}
                    value={code || ''}
                    onChange={(e) => {
                      setCode(e.target.value || '')
                      setIsDirty(true)
                    }}
                    className="w-full h-full dark:bg-slate-900 dark:text-slate-200 font-mono text-xsmall leading-6"
                    style={{
                      fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                      fontSize: 'var(--xsmall)',
                      color: 'var(--text-main)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      padding: 16,
                      resize: 'none',
                      overflow: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  />
                }
                right={
                  <div className="h-full p-4" style={{ backgroundColor: 'transparent' }}>
                    <LivePreview code={code} />
                  </div>
                }
              />
            </div>

            {false && <div />}

            {nameOpen && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded p-4 w-80">
                  <div className="text-sm mb-2 text-slate-700 dark:text-slate-200">
                    Enter a name (optionally with extension)
                  </div>
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-[#30363d] rounded text-slate-800 dark:text-slate-200"
                    placeholder="e.g. hello.js or notes"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setNameOpen(false)}
                      className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const t = nameInput.trim()
                        if (!t) return
                        const payload = {
                          id: initialSnippet?.id || Date.now().toString(),
                          title: t,
                          code: code,
                          language: 'md',
                          timestamp: Date.now(),
                          type: 'snippet',
                          is_draft: false
                        }
                        setNameOpen(false)
                        onSave(payload)
                      }}
                      className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
            <StatusBar
              onSettingsClick={onSettingsClick}
              isCompact={compact}
              onToggleCompact={onToggleCompactHandler}
            />
          </div>
        )
      }
    </>
  )
}

SnippetEditor.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialSnippet: PropTypes.object,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func,
  isCreateMode: PropTypes.bool,
  activeView: PropTypes.string,
  onAutosave: PropTypes.func,
  showToast: PropTypes.func,
  isCompact: PropTypes.bool,
  onToggleCompact: PropTypes.func
}

export default SnippetEditor
const extractTags = (text) => {
  const t = String(text || '')
  const tags = new Set()
  const re = /(^|\s)#([a-zA-Z0-9_-]+)/g
  let m
  while ((m = re.exec(t))) {
    tags.add(m[2].toLowerCase())
  }
  return Array.from(tags).join(',')
}
