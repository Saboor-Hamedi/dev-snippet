import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useKeyboardShortcuts } from '../../hook/useKeyboardShortcuts.js'
import { useEditorFocus } from '../../hook/useEditorFocus.js'
import extractTags from '../../hook/extractTags.js'
import { useZoomLevel } from '../../hook/useZoomLevel'
import WelcomePage from '../WelcomePage.jsx'
import StatusBar from '../StatusBar.jsx'
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
  isCompact,
  onToggleCompact,
  showPreview
}) => {
  const [code, setCode] = useState(initialSnippet?.code || '')

  // Language state removed. Implicitly 'markdown' everywhere.

  const [isDirty, setIsDirty] = useState(false)
  const [zoomLevel] = useZoomLevel()
  const { settings, getSetting } = useSettings()

  const [title, setTitle] = useState(initialSnippet?.title || '')

  const [justRenamed, setJustRenamed] = useState(false)

  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false
  const saveTimerRef = useRef(null)
  const [isLargeFile, setIsLargeFile] = useState(false)

  // Debounced code for live preview to reduce re-renders during typing
  const [debouncedCode, setDebouncedCode] = useState(code)
  useEffect(() => {
    // Dynamically adjust debounce based on code length
    // Very large snippets get a longer debounce to keep the editor snappy
    const wait = code.length > 50000 ? 1000 : code.length > 10000 ? 500 : 300
    const timer = setTimeout(() => setDebouncedCode(code), wait)
    return () => clearTimeout(timer)
  }, [code])

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('autoSave')
      return saved ? saved === 'true' : true
    } catch (e) {
      return true
    }
  })

  const lastSavedCode = useRef(initialSnippet?.code || '')
  // lastSavedLanguage removed
  const lastSavedTitle = useRef(initialSnippet?.title || '')

  const isDeletingRef = useRef(false)
  const textareaRef = useRef(null)
  const editorContainerRef = useRef(null)
  const wordWrap = settings?.editor?.wordWrap || 'off'

  // Local compact mode
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

  const controlledCompact = typeof isCompact !== 'undefined'
  const compact = controlledCompact ? isCompact : localCompact
  const onToggleCompactHandler = () => {
    if (typeof onToggleCompact === 'function') {
      onToggleCompact()
    } else {
      setLocalCompact((s) => !s)
    }
  }

  // Focus management
  useEditorFocus({ initialSnippet, isCreateMode, textareaRef })

  const scheduleSave = () => {
    if (!autoSaveEnabled) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      const id = initialSnippet?.id
      if (!id) return
      if (isDeletingRef.current) return
      if (window.__deletedIds && window.__deletedIds.has(id)) return
      if (initialSnippet?.is_draft && (!initialSnippet?.title || !initialSnippet.title.trim()))
        return
      const updatedSnippet = {
        id: id,
        title: title,
        code: code,
        language: 'markdown', // Enforce Markdown
        timestamp: Date.now(),
        type: initialSnippet.type || 'snippet',
        tags: extractTags(code),
        is_draft: initialSnippet?.is_draft || false
      }
      try {
        onAutosave && onAutosave('saving')
      } catch {}
      try {
        await onSave(updatedSnippet)
        onAutosave && onAutosave('saved')
        try {
          setIsDirty(false)
        } catch {}
        lastSavedCode.current = code
        lastSavedTitle.current = title
      } catch (err) {
        onAutosave && onAutosave(null)
      }
    }, 5000)
  }

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
      try {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        if (id2 && window.__autosaveCancel) window.__autosaveCancel.delete(id2)
      } catch {}
    }
  }, [initialSnippet?.id])

  useEffect(() => {
    const onToggle = (e) => {
      try {
        const enabled = !!(e && e.detail && e.detail.enabled)
        setAutoSaveEnabled(enabled)
        if (!enabled) {
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

  const isInitialMount = useRef(true)
  const lastSnippetId = useRef(initialSnippet?.id)

  // Update code if initialSnippet changes
  React.useEffect(() => {
    if (!initialSnippet) return
    if (initialSnippet && initialSnippet.id !== lastSnippetId.current) {
      setCode(initialSnippet.code || '')
      setTitle(initialSnippet.title || '')

      try {
        setIsDirty(false)
      } catch {}
      try {
        isInitialMount.current = true
      } catch {}
      lastSnippetId.current = initialSnippet.id
      return
    }
  }, [initialSnippet?.id, initialSnippet?.title, isDirty])

  const [namePrompt, setNamePrompt] = useState({ isOpen: false, initialName: '' })

  // Trigger debounced save on content change (removed language dep)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (!isDirty) return
    if (!autoSaveEnabled) return
    if (!initialSnippet?.title || initialSnippet?.title.toLowerCase() === 'untitled') return
    scheduleSave()
  }, [code]) // Only code changes trigger autosave now

  useKeyboardShortcuts({
    onSave: () => {
      const title = initialSnippet?.title || ''
      if (!title || title.toLowerCase() === 'untitled') {
        setNamePrompt({ isOpen: true, initialName: '' })
      } else {
        handleSave(true)
      }
    },
    onToggleCompact: onToggleCompactHandler,
    onDelete: () => {
      if (onDelete) onDelete(initialSnippet?.id)
    },
    onCloseEditor: () => {
      if (onCancel) onCancel()
    }
  })

  const handleSave = (forceSave = false) => {
    ;(async () => {
      const localTitle = title
      if (
        (initialSnippet?.id &&
          !initialSnippet?.is_draft &&
          initialSnippet?.title &&
          initialSnippet.title !== '') ||
        forceSave
      ) {
        const prevCode = lastSavedCode.current
        const prevTitle = lastSavedTitle.current
        const unchanged = prevCode === (code || '') && prevTitle === localTitle
        if (unchanged) {
          if (typeof showToast === 'function') showToast('No changes to save', 'info')
          return
        }
      }
      if (!localTitle || localTitle.toLowerCase() === 'untitled') {
        setNamePrompt({ isOpen: true, initialName: '' })
        return
      }

      const payload = {
        id: initialSnippet?.id || Date.now().toString(),
        title: localTitle,
        code: code,
        language: 'markdown', // Enforce Markdown
        timestamp: Date.now(),
        type: 'snippet',
        tags: extractTags(code),
        is_draft: false
      }
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

      try {
        onAutosave && onAutosave('saved')
      } catch {}
      try {
        await onSave(payload)
        try {
          window.dispatchEvent(new CustomEvent('autosave:complete', { detail: { id: payload.id } }))
        } catch {}
        try {
          setIsDirty(false)
        } catch {}
        lastSavedCode.current = code
        lastSavedTitle.current = localTitle
      } catch (err) {
        try {
          onAutosave && onAutosave('error')
          window.dispatchEvent(new CustomEvent('autosave:error', { detail: { id: payload.id } }))
        } catch {}
      }
    })()
  }

  useEffect(() => {
    const fn = (e) => {
      try {
        handleSave()
      } catch {}
    }
    window.addEventListener('force-save', fn)
    return () => window.removeEventListener('force-save', fn)
  }, [code, initialSnippet])

  useEffect(() => {
    if (justRenamed && !namePrompt.isOpen) {
      setTimeout(() => {
        if (typeof document !== 'undefined') {
          const editorElement = document.querySelector('.cm-editor .cm-content')
          if (editorElement) {
            editorElement.focus()
          }
        }
      }, 500)
      setJustRenamed(false)
    }
  }, [justRenamed, namePrompt.isOpen])

  return (
    <>
      {!isCreateMode && (!initialSnippet || !initialSnippet.id) && !hideWelcomePage ? (
        <WelcomePage onNewSnippet={onNew} />
      ) : (
        <div className="h-full overflow-hidden flex flex-col items-stretch bg-slate-50 dark:bg-[#0d1117] relative">
          <div
            className="flex-1 min-h-0 overflow-hidden editor-container relative"
            style={{ backgroundColor: 'var(--editor-bg)', display: 'flex' }}
          >
            <AdvancedSplitPane
              rightHidden={!showPreview || showPreview === false}
              unifiedScroll={true}
              overlayMode={settings?.editor?.overlayMode || false}
              left={
                <div ref={editorContainerRef} className="w-full h-full">
                  <CodeEditor
                    value={code || ''}
                    wordWrap={wordWrap}
                    onChange={useCallback(
                      (val) => {
                        try {
                          // Batch state updates and only if changed
                          if (val !== code) {
                            setCode(val || '')
                            setIsDirty(true)
                          }
                        } catch {}
                      },
                      [code]
                    )}
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
                    // Language prop removed - implied markdown
                    textareaRef={textareaRef}
                    onZoomChange={() => {}}
                    onEditorReady={() => {}}
                    onLargeFileChange={setIsLargeFile}
                  />
                </div>
              }
              right={
                <div className="h-full p-4" style={{ backgroundColor: 'transparent' }}>
                  {useMemo(
                    () => (
                      <LivePreview code={debouncedCode} language="markdown" />
                    ),
                    [debouncedCode]
                  )}
                </div>
              }
            />
          </div>

          <NamePrompt
            open={namePrompt.isOpen}
            value={namePrompt.initialName}
            onChange={(val) => setNamePrompt((prev) => ({ ...prev, initialName: val }))}
            onCancel={() => setNamePrompt({ isOpen: false, initialName: '' })}
            onConfirm={() => {
              const entered = (namePrompt.initialName || '').trim()
              if (!entered) return

              // Force markdown logic
              const ext = 'md'
              const baseName = entered.replace(/\.[a-z0-9]+$/i, '')
              // Always append .md if not present, or replace existing extension with .md
              // User said "save .md not anything else"
              const fullTitle = `${baseName}.${ext}`

              const payload = {
                id: initialSnippet?.id || Date.now().toString(),
                title: fullTitle,
                code: code,
                language: 'markdown',
                timestamp: Date.now(),
                type: 'snippet',
                tags: extractTags(code),
                is_draft: false
              }
              setNamePrompt({ isOpen: false, initialName: '' })
              setJustRenamed(true)
              setTitle(fullTitle)
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
            <div className="flex items-center gap-2"></div>
            <StatusBar
              onSettingsClick={onSettingsClick}
              isCompact={compact}
              onToggleCompact={onToggleCompactHandler}
              // language prop removed
              zoomLevel={zoomLevel}
              title={title}
              isLargeFile={isLargeFile}
            />
          </div>
        </div>
      )}
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

export default React.memo(SnippetEditor)
