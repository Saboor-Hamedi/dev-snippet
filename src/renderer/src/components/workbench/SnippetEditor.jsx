// SnippetEditor
// - Responsible for editing a single snippet (draft or existing)
// - Provides debounced autosave, forced-save (Ctrl+S) and name/save modal
// - Receives `showToast` from parent to display user-facing toasts
import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useKeyboardShortcuts } from '../../hook/useKeyboardShortcuts.js'
import { useEditorFocus } from '../../hook/useEditorFocus.js'
import extractTags from '../../hook/extractTags.js'
import { getAllLanguages, getLanguageByExtension, EditorLanguages } from '../language/languageRegistry.js'
import { useZoomLevel } from '../../hook/useZoomLevel'
import WelcomePage from '../WelcomePage.jsx'
import StatusBar from '../StatusBar.jsx'
import SplitPane from '../SplitPane/SplitPane.jsx'
import CodeEditor from '../CodeEditor/CodeEditor.jsx'
import LivePreview from '../livepreview/LivePreview.jsx'
import NamePrompt from '../modal/NamePrompt.jsx'
import { useSettings } from '../../hook/useSettingsContext'
import AdvancedSplitPane from '../AdvancedSplitPane/AdvancedSplitPane'

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
  onToggleCompact,
  showPreview
}) => {
  const [code, setCode] = useState(initialSnippet?.code || '')
  const [language, setLanguage] = React.useState(initialSnippet?.language || 'text')
  const [isDirty, setIsDirty] = useState(false)
  const [zoomLevel] = useZoomLevel() // Use useSettingsReact Context for zoom level
  const { settings, getSetting } = useSettings()

  const [title, setTitle] = useState(initialSnippet?.title || '')

  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('autoSave')
      return saved ? saved === 'true' : true // Default to enabled if not set
    } catch (e) {
      return true // Default to enabled
    }
  })

  const saveTimerRef = useRef(null)
  const lastPendingRef = useRef(0)

  const isDeletingRef = useRef(false)
  const textareaRef = useRef(null)
  const editorContainerRef = useRef(null)
  // Line wrapped here from  CodeEditor.jsx
  const wordWrap = settings?.editor?.wordWrap || 'off'
  const overflow = settings?.editor?.overflow || false

  // Modify the title to include the correct extension based on language
  useEffect(() => {
    const baseTitle = title.replace(/\.[a-z]+$/, '') // Remove existing extension
    if (baseTitle) {
      const ext = EditorLanguages[language]?.extensions[0] || 'txt'
      const newTitle = `${baseTitle}.${ext}`
      if (newTitle !== title) {
        setTitle(newTitle)
        // Notify parent of title change for live updates
        if (initialSnippet?.id) {
          window.dispatchEvent(new CustomEvent('title:change', { detail: { id: initialSnippet.id, title: newTitle } }))
        }
      }
    }
  }, [language, title])

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

  // Focus management extracted into a hook
  useEditorFocus({ initialSnippet, isCreateMode, editorContainerRef, textareaRef })

  // CodeMirror is encapsulated in CodeEditor now

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
        title: title, // Include updated title in autosave
        code: code, // Use current editor content
        language: language,
        timestamp: Date.now(),
        type: initialSnippet.type || 'snippet',
        tags: extractTags(code),
        is_draft: initialSnippet?.is_draft || false
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

  // Live update language extension
  // Update language/code if initialSnippet changes (only on ID change to prevent autosave loops)
  React.useEffect(() => {
    if (!initialSnippet) return
    const incomingLang = initialSnippet.language || 'text'
    if (initialSnippet && initialSnippet.id !== lastSnippetId.current) {
      setLanguage(incomingLang)
      setCode(initialSnippet.code || '')
      setTitle(initialSnippet.title || '')

      // Detect language from title extension
      const detected = getLanguageByExtension(initialSnippet.title)
      if (detected) {
        setLanguage(detected)
      } else if (initialSnippet.title && !initialSnippet.title.includes('.')) {
        setLanguage('text')
      }

      // Loading a new snippet is not a user edit — reset dirty and skip autosave once
      try {
        setIsDirty(false)
      } catch {}
      try {
        isInitialMount.current = true
      } catch {}
      lastSnippetId.current = initialSnippet.id
      return
    }
    // Same snippet id but its language changed externally (e.g., rename)
    // Only update editor language if user isn't actively editing and the incoming language differs.
    if (incomingLang !== language && !isDirty) {
      setLanguage(incomingLang)
    }
  }, [initialSnippet?.id, initialSnippet?.language, initialSnippet?.title, language, isDirty])
  // Name prompt state for saving unsaved snippets
  const [namePrompt, setNamePrompt] = useState({ isOpen: false, initialName: '' })

  // Trigger debounced save on content or language change
  useEffect(() => {
    // Skip autosave on initial mount/load
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Only schedule autosave when user actually changed content
    if (!isDirty) return
    if (!autoSaveEnabled) return
    // Only autosave if snippet has a title (not untitled/draft)
    if (!initialSnippet?.title || initialSnippet?.title.toLowerCase() === 'untitled') return
    scheduleSave()
  }, [code, language])

  // Handle keyboard shortcuts (combined into single call)
  useKeyboardShortcuts({
    onSave: () => {
      const title = initialSnippet?.title || ''
      if (!title || title.toLowerCase() === 'untitled') {
        setNamePrompt({ isOpen: true, initialName: '' })
      } else {
        handleSave()
      }
    },
    onToggleCompact: onToggleCompactHandler,
    // confirm delete
    onDelete: () => {
      if (onDelete) onDelete(initialSnippet?.id)
    },

    onCloseEditor: () => {
      if (onCancel) onCancel()
    }
  })

  const handleSave = () => {
    ;(async () => {
      let title = title // Use local title state instead of initialSnippet.title
      // Only show "No changes to save" for saved snippets with actual content
      if (
        initialSnippet?.id &&
        !initialSnippet?.is_draft &&
        initialSnippet?.title &&
        initialSnippet.title !== ''
      ) {
        const prevCode = initialSnippet?.code || ''
        const prevLang = initialSnippet?.language || 'md'
        const prevTitle = initialSnippet?.title || ''
        const unchanged =
          prevCode === (code || '') && prevLang === (language || 'md') && prevTitle === title
        if (unchanged) {
          if (typeof showToast === 'function') showToast('No changes to save', 'info')
          return
        }
      }
      if (!title || title.toLowerCase() === 'untitled') {
        setNamePrompt({ isOpen: true, initialName: '' })
        return
      }
      const payload = {
        id: initialSnippet?.id || Date.now().toString(),
        title,
        code: code,
        language: language,
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
        !isCreateMode && (!initialSnippet || !initialSnippet.id) && !hideWelcomePage ? (
          <WelcomePage onNewSnippet={onNew} />
        ) : (
          <div className="h-full overflow-hidden flex flex-col items-stretch bg-slate-50 dark:bg-[#0d1117] relative">
            {/* Header is rendered at the top-level (SnippetLibrary). Do not render it here to avoid duplicates. */}
            <div
              className="flex-1 min-h-0 overflow-hidden editor-container relative"
              style={{ backgroundColor: 'var(--editor-bg)', display: 'flex' }}
              data-color-mode={
                document.documentElement.classList.contains('dark') ? 'dark' : 'light'
              }
            >
              <AdvancedSplitPane
                rightHidden={!showPreview || showPreview === false}
                unifiedScroll={true} // Add this prop to enable unified scrolling
                overlayMode={settings?.editor?.overlayMode || false} // Use existing settings
                left={
                  <div ref={editorContainerRef} className="w-full h-full">
                    <CodeEditor
                      value={code || ''}
                      wordWrap={wordWrap}
                      onChange={(val) => {
                        try {
                          setCode(val || '')
                          setIsDirty(true)
                        } catch {}
                      }}
                      onKeyDown={(e) => {
                        try {
                          if (e.key === 'Escape') {
                            onCancel && onCancel()
                            return
                          }
                          if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                            e.preventDefault()
                            onToggleCompactHandler()
                            return
                          }
                        } catch {}
                      }}
                      height="100%"
                      className="h-full"
                      style={{ backgroundColor: 'transparent' }}
                      language={language}
                      textareaRef={textareaRef}
                      onZoomChange={() => {}} // No need for callback, using React Context
                    />
                  </div>
                }
                right={
                  <div className="h-full p-4" style={{ backgroundColor: 'transparent' }}>
                    <LivePreview code={code} language={language} />
                  </div>
                }
              />
            </div>

            {false && <div />}

            <NamePrompt
              open={namePrompt.isOpen}
              value={namePrompt.initialName}
              onChange={(val) => setNamePrompt((prev) => ({ ...prev, initialName: val }))}
              onCancel={() => setNamePrompt({ isOpen: false, initialName: '' })}
              onConfirm={() => {
                const entered = (namePrompt.initialName || '').trim()
                if (!entered) return
                const detectedLang = getLanguageByExtension(entered)
                let lang = language
                let ext = EditorLanguages[language]?.extensions[0] || 'txt'
                if (detectedLang) {
                  lang = detectedLang
                  setLanguage(detectedLang)
                  ext = EditorLanguages[detectedLang]?.extensions[0] || 'txt'
                } else {
                  // no extension detected
                  if (!entered.includes('.')) {
                    lang = 'text'
                    setLanguage('text')
                    ext = 'txt'
                  } else {
                    // entered has extension but not recognized, use current language
                    lang = language
                    ext = EditorLanguages[language]?.extensions[0] || 'txt'
                  }
                }
                const baseName = entered.replace(/\.[a-z]+$/, '')
                const fullTitle = baseName ? `${baseName}.${ext}` : `.${ext}`
                const payload = {
                  id: initialSnippet?.id || Date.now().toString(),
                  title: fullTitle,
                  code: code,
                  language: lang,
                  timestamp: Date.now(),
                  type: 'snippet',
                  is_draft: false
                }
                setNamePrompt({ isOpen: false, initialName: '' })
                onSave(payload)
              }}
            />
            <div
              className="flex items-center justify-between px-2 py-1"
              style={{
                backgroundColor: 'var(--header-bg)',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value)
                    setIsDirty(true)
                  }}
                  className="text-xs bg-transparent border-none outline-none px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Select Language"
                >
                  {getAllLanguages().map((lang) => (
                    <option
                      key={lang.key }
                      value={lang.key}
                      className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <StatusBar
                onSettingsClick={onSettingsClick}
                isCompact={compact}
                onToggleCompact={onToggleCompactHandler}
                language={language}
                zoomLevel={zoomLevel}
                title={title}
              />
            </div>
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
