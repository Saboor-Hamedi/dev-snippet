import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useKeyboardShortcuts } from '../../hook/useKeyboardShortcuts.js'
import { useEditorFocus } from '../../hook/useEditorFocus.js'
import { useZoomLevel } from '../../hook/useZoomLevel'
import WelcomePage from '../WelcomePage.jsx'
import StatusBar from '../StatusBar.jsx'
import CodeEditor from '../CodeEditor/CodeEditor.jsx'
import LivePreview from '../livepreview/LivePreview.jsx'
import Prompt from '../modal/Prompt.jsx'
import { useSettings } from '../../hook/useSettingsContext'
import AdvancedSplitPane from '../splitPanels/AdvancedSplitPane'

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
  showPreview,
  snippets = []
}) => {
  const [code, setCode] = useState(initialSnippet?.code || '')
  const [isDirty, setIsDirty] = useState(false)
  const [zoomLevel] = useZoomLevel()
  const { settings, getSetting } = useSettings()

  const [title, setTitle] = useState(initialSnippet?.title || '')
  const [justRenamed, setJustRenamed] = useState(false)

  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false
  const saveTimerRef = useRef(null)
  const [isLargeFile, setIsLargeFile] = useState(false)

  // Debounced code for live preview
  const [debouncedCode, setDebouncedCode] = useState(code)
  useEffect(() => {
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
  const lastSavedTitle = useRef(initialSnippet?.title || '')

  const isDeletingRef = useRef(false)
  const textareaRef = useRef(null)
  const editorContainerRef = useRef(null)
  const wordWrap = settings?.editor?.wordWrap || 'off'

  // Local compact mode fallback
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

  const scheduleSave = useCallback(() => {
    if (!autoSaveEnabled) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      const id = initialSnippet?.id
      if (!id) return
      if (isDeletingRef.current) return
      if (window.__deletedIds && window.__deletedIds.has(id)) return
      if (initialSnippet?.is_draft && (!title || !title.trim())) return

      const updatedSnippet = {
        id: id,
        title: title,
        code: code,
        language: 'markdown',
        timestamp: Date.now(),
        type: initialSnippet.type || 'snippet',
        tags: extractTags(code),
        is_draft: initialSnippet?.is_draft || false
      }

      try {
        onAutosave && onAutosave('saving')
        await onSave(updatedSnippet)
        onAutosave && onAutosave('saved')
        setIsDirty(false)
        lastSavedCode.current = code
        lastSavedTitle.current = title
      } catch (err) {
        onAutosave && onAutosave(null)
      }
    }, 5000)
  }, [code, title, initialSnippet, autoSaveEnabled, onSave, onAutosave])

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

  useEffect(() => {
    const onToggle = (e) => {
      const enabled = !!(e && e.detail && e.detail.enabled)
      setAutoSaveEnabled(enabled)
      if (!enabled && saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
    window.addEventListener('autosave:toggle', onToggle)
    return () => window.removeEventListener('autosave:toggle', onToggle)
  }, [])

  const isInitialMount = useRef(true)
  const lastSnippetId = useRef(initialSnippet?.id)

  useEffect(() => {
    if (!initialSnippet) return
    if (initialSnippet.id !== lastSnippetId.current) {
      setCode(initialSnippet.code || '')
      setTitle(initialSnippet.title || '')
      setIsDirty(false)
      isInitialMount.current = true
      lastSnippetId.current = initialSnippet.id
      return
    }
    if (initialSnippet.code !== undefined && code === '') {
      setCode(initialSnippet.code || '')
    }
  }, [initialSnippet])

  const [namePrompt, setNamePrompt] = useState({ isOpen: false, initialName: '' })

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (!isDirty || !autoSaveEnabled) return
    if (!title || title.toLowerCase() === 'untitled') return
    scheduleSave()
  }, [code, title, isDirty, autoSaveEnabled, scheduleSave])

  useKeyboardShortcuts({
    onSave: () => {
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

  const handleSave = async (forceSave = false, customTitle = null) => {
    const finalTitle = customTitle || title

    if ((initialSnippet?.id && !initialSnippet?.is_draft && finalTitle !== '') || forceSave) {
      const unchanged =
        lastSavedCode.current === code && lastSavedTitle.current === (finalTitle || title)
      if (unchanged) {
        showToast?.('No changes to save', 'info')
        return
      }
    }

    if (!finalTitle || finalTitle.toLowerCase() === 'untitled') {
      setNamePrompt({ isOpen: true, initialName: '' })
      return
    }

    const payload = {
      id: initialSnippet?.id || Date.now().toString(),
      title: finalTitle,
      code: code,
      is_draft: false
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    try {
      onAutosave && onAutosave('saving')
      await onSave(payload)
      window.dispatchEvent(new CustomEvent('autosave:complete', { detail: { id: payload.id } }))
      setIsDirty(false)
      lastSavedCode.current = code
      lastSavedTitle.current = finalTitle
      setTitle(finalTitle) // Sync state
    } catch (err) {
      onAutosave && onAutosave('error')
    }
  }

  useEffect(() => {
    const fn = () => handleSave()
    window.addEventListener('force-save', fn)
    return () => window.removeEventListener('force-save', fn)
  }, [code, title, initialSnippet])

  useEffect(() => {
    if (justRenamed && !namePrompt.isOpen) {
      setTimeout(() => {
        const editorElement = document.querySelector('.cm-editor .cm-content')
        if (editorElement) editorElement.focus()
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
            className="flex-1 min-h-0 overflow-hidden editor-container relative flex"
            style={{ backgroundColor: 'var(--editor-bg)' }}
          >
            <AdvancedSplitPane
              rightHidden={!showPreview}
              unifiedScroll={true}
              overlayMode={settings?.editor?.overlayMode || false}
              left={
                <div ref={editorContainerRef} className="w-full h-full">
                  <CodeEditor
                    value={code || ''}
                    wordWrap={wordWrap}
                    onChange={(val) => {
                      if (val !== code) {
                        setCode(val || '')
                        setIsDirty(true)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') onCancel?.()
                      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                        e.preventDefault()
                        onToggleCompactHandler()
                      }
                    }}
                    height="100%"
                    className="h-full"
                    textareaRef={textareaRef}
                    snippets={snippets}
                  />
                </div>
              }
              right={
                <div className="h-full p-4">
                  {useMemo(() => {
                    const ext = title?.includes('.') ? title.split('.').pop()?.toLowerCase() : null
                    const detectedLang = ext || 'plaintext'
                    return (
                      <LivePreview
                        code={debouncedCode}
                        language={detectedLang}
                        snippets={snippets}
                      />
                    )
                  }, [debouncedCode, title, snippets])}
                </div>
              }
            />
          </div>

          <Prompt
            isOpen={namePrompt.isOpen}
            title="Name Snippet"
            message="Your snippet needs a name before it can be saved."
            confirmLabel="Save"
            showInput={true}
            inputValue={namePrompt.initialName || ''}
            onInputChange={(val) => setNamePrompt((prev) => ({ ...prev, initialName: val }))}
            onClose={() => setNamePrompt({ isOpen: false, initialName: '' })}
            onConfirm={async () => {
              const entered = (namePrompt.initialName || '').trim()
              if (!entered) return

              // Await saving - normalization happens inside the hook
              await handleSave(true, entered)

              setNamePrompt({ isOpen: false, initialName: '' })
              setJustRenamed(true)
            }}
            placeholder="e.g. hello.js or notes"
          />

          <div
            className="flex items-center justify-between px-2 py-1"
            style={{
              backgroundColor: 'var(--header-bg)',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <StatusBar
              onSettingsClick={onSettingsClick}
              isCompact={compact}
              onToggleCompact={onToggleCompactHandler}
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
  onToggleCompact: PropTypes.func,
  showPreview: PropTypes.bool,
  snippets: PropTypes.array
}

export default React.memo(SnippetEditor)
