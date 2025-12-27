import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useKeyboardShortcuts } from '../../hook/useKeyboardShortcuts.js'
import { useEditorFocus } from '../../hook/useEditorFocus.js'
import { useZoomLevel } from '../../hook/useSettingsContext' // Fixed import source
import WelcomePage from '../WelcomePage.jsx'
import { useStatusBar as StatusBar } from '../layout/StatusBar/useStatusBar'
import CodeEditor from '../CodeEditor/CodeEditor.jsx'
import LivePreview from '../livepreview/LivePreview.jsx'
import Prompt from '../modal/Prompt.jsx'
import { useSettings, useAutoSave } from '../../hook/useSettingsContext'
import { useTheme } from '../../hook/useTheme'
import AdvancedSplitPane from '../splitPanels/AdvancedSplitPane'
import { extractTags } from '../../utils/snippetUtils.js'
import { generatePreviewHtml } from '../../utils/previewGenerator'

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
  const { currentTheme } = useTheme()

  const [title, setTitle] = useState(initialSnippet?.title || '')
  const [justRenamed, setJustRenamed] = useState(false)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })

  // Update title when initialSnippet changes (e.g., after rename)
  useEffect(() => {
    if (initialSnippet?.title && initialSnippet.title !== title) {
      setTitle(initialSnippet.title)
      setJustRenamed(true)
      // Reset justRenamed after a short delay
      setTimeout(() => setJustRenamed(false), 1000)
    }
  }, [initialSnippet?.title, title])

  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false
  const saveTimerRef = useRef(null)
  const [isLargeFile, setIsLargeFile] = useState(false)

  // Debounced code for live preview
  const [debouncedCode, setDebouncedCode] = useState(code)
  // Stabilize language detection so the editor doesn't re-mount on every keystroke
  const detectedLang = useMemo(() => {
    const ext = title?.includes('.') ? title.split('.').pop()?.toLowerCase() : null
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
  }, [title, code.substring(0, 20)]) // Re-detect if title or start of code changes

  useEffect(() => {
    const wait = code.length > 50000 ? 1000 : code.length > 10000 ? 500 : 300
    const timer = setTimeout(() => setDebouncedCode(code), wait)
    // Broadcast live code to Ghost Preview
    window.dispatchEvent(
      new CustomEvent('app:code-update', {
        detail: { code, language: detectedLang }
      })
    )
    return () => clearTimeout(timer)
  }, [code, detectedLang])

  // Unified AutoSave Hook - Source of Truth
  const [autoSaveEnabled] = useAutoSave()

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
    // 1. Explicitly check if enabled first
    if (!autoSaveEnabled) return

    // Clear any pending timer
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    // Schedule new save
    saveTimerRef.current = setTimeout(
      async () => {
        const id = initialSnippet?.id
        if (!id) return

        const updatedSnippet = {
          ...initialSnippet,
          id: id,
          title: title,
          code: code,
          language: detectedLang || 'markdown',
          timestamp: Date.now(),
          type: initialSnippet?.type || 'snippet',
          tags: extractTags(code),
          is_draft: false,
          folder_id: initialSnippet?.folder_id || null,
          is_pinned: initialSnippet?.is_pinned || 0
        }

        try {
          // Direct event dispatch for UI feedback bypassing prop delays
          window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'saving' } }))

          await onSave(updatedSnippet)

          window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'saved' } }))
          setIsDirty(false)
          lastSavedCode.current = code
          lastSavedTitle.current = title
        } catch (err) {
          window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'error' } }))
          console.error('Autosave failed', err)
        }
      },
      getSetting('behavior.autoSaveDelay') || 2000
    )
  }, [code, title, initialSnippet, autoSaveEnabled, onSave])

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

  // Listen for navigation requests from the Sandboxed Preview (iframe bridge)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'app:open-snippet') {
        const { title } = event.data
        window.dispatchEvent(
          new CustomEvent('app:open-snippet', {
            detail: { title }
          })
        )
      }

      // Re-dispatch shortcuts from iframe
      if (event.data?.type === 'app:keydown') {
        const { key, code, ctrlKey, metaKey, shiftKey, altKey } = event.data
        const syntheticEvent = new KeyboardEvent('keydown', {
          key,
          code,
          ctrlKey,
          metaKey,
          shiftKey,
          altKey,
          bubbles: true,
          cancelable: true
        })
        window.dispatchEvent(syntheticEvent)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
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

  // Low-priority stats calculation using debounced code to prevent typing lag
  const stats = useMemo(() => {
    const text = debouncedCode || ''
    const len = text.length

    // Optimized Word Count (O(n) time, O(1) memory) - No array allocation
    let words = 0
    let inWord = false

    // Loop optimized for performance on large strings
    for (let i = 0; i < len; i++) {
      const code = text.charCodeAt(i)
      // Check for whitespace: space (32), tab (9), newline (10), cr (13)
      const isWhitespace = code === 32 || code === 9 || code === 10 || code === 13 || code === 160 // 160 is NBSP

      if (isWhitespace) {
        inWord = false
      } else if (!inWord) {
        inWord = true
        words++
      }
    }

    return {
      chars: len,
      words: words
    }
  }, [debouncedCode])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (!isDirty || !autoSaveEnabled) return
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

      // Only block if unchanged AND NOT a forced save (Ctrl+S)
      if (unchanged && !forceSave) {
        showToast?.('No changes to save', 'info')
        return
      }
    }

    if (!finalTitle || finalTitle.toLowerCase() === 'untitled') {
      setNamePrompt({ isOpen: true, initialName: '' })
      return
    }

    const payload = {
      ...initialSnippet,
      id: initialSnippet?.id || Date.now().toString(),
      title: finalTitle,
      code: code,
      is_draft: false,
      folder_id: initialSnippet?.folder_id || null,
      is_pinned: initialSnippet?.is_pinned || 0
    }
    console.log(`[Editor] Saving snippet payload:`, payload)

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    try {
      onAutosave && onAutosave('saving')
      window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'saving' } }))

      await onSave(payload)

      window.dispatchEvent(new CustomEvent('autosave-complete', { detail: { id: payload.id } }))
      window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: 'saved' } }))

      setIsDirty(false)
      lastSavedCode.current = code
      lastSavedTitle.current = finalTitle
      setTitle(finalTitle) // Sync state
    } catch (err) {
      onAutosave && onAutosave('error')
      window.dispatchEvent(new CustomEvent('autosave-status', { detail: { status: null } }))
    }
  }

  useEffect(() => {
    if (justRenamed && !namePrompt.isOpen) {
      setTimeout(() => {
        const editorElement = document.querySelector('.cm-editor .cm-content')
        if (editorElement) editorElement.focus()
      }, 500)
      setJustRenamed(false)
    }
  }, [justRenamed, namePrompt.isOpen])

  // Helper to generate the complete HTML for external/mini previews
  const generateFullHtml = useCallback(
    (forPrint = false) => {
      const ext = title?.includes('.') ? title.split('.').pop()?.toLowerCase() : null
      const isMarkdown = !ext || ext === 'markdown' || ext === 'md'
      const existingTitles = snippets.map((s) => (s.title || '').trim()).filter(Boolean)

      return generatePreviewHtml({
        code,
        title: title || 'Untitled Snippet',
        theme: currentTheme,
        existingTitles,
        isMarkdown,
        fontFamily: settings?.editor?.fontFamily,
        forPrint
      })
    },
    [code, title, snippets, currentTheme, settings?.editor?.fontFamily]
  )

  const handleOpenExternalPreview = useCallback(async () => {
    const fullHtml = await generateFullHtml()
    if (window.api?.invoke) {
      await window.api.invoke('shell:previewInBrowser', fullHtml)
    }
  }, [generateFullHtml])

  const handleOpenMiniPreview = useCallback(async () => {
    const fullHtml = await generateFullHtml()
    if (window.api?.openMiniBrowser) {
      await window.api.openMiniBrowser(fullHtml)
    }
  }, [generateFullHtml])

  const handleExportPDF = useCallback(async () => {
    try {
      // Generate HTML specifically optimized for PDF (White theme, no UI toolbars)
      const fullHtml = await generateFullHtml(true)
      if (window.api?.invoke) {
        const sanitizedTitle = (title || 'snippet').replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const success = await window.api.invoke('export:pdf', fullHtml, sanitizedTitle)
        if (success) {
          showToast?.('Snippet exported to PDF successfully!', 'success')
        } else {
          // Could be cancelled by user or internal error
          console.log('PDF Export was cancelled or failed internally.')
        }
      }
    } catch (err) {
      console.error('PDF Export Error:', err)
      showToast?.('Failed to export PDF. Please check the logs.', 'error')
    }
  }, [generateFullHtml, title, showToast])

  useEffect(() => {
    const fn = () => handleSave(true) // Force save on manual trigger
    const pdfFn = () => handleExportPDF()
    window.addEventListener('force-save', fn)
    window.addEventListener('app:trigger-export-pdf', pdfFn)
    return () => {
      window.removeEventListener('force-save', fn)
      window.removeEventListener('app:trigger-export-pdf', pdfFn)
    }
  }, [code, title, initialSnippet, handleExportPDF])

  return (
    <>
      {!isCreateMode && (!initialSnippet || !initialSnippet.id) && !hideWelcomePage ? (
        <WelcomePage onNewSnippet={onNew} />
      ) : (
        <div
          className="h-full overflow-hidden flex flex-col items-stretch relative"
          style={{ backgroundColor: 'var(--editor-bg)' }}
        >
          <div
            className="flex-1 min-h-0 overflow-hidden editor-container relative flex"
            style={{ backgroundColor: 'var(--editor-bg)' }}
          >
            <AdvancedSplitPane
              rightHidden={!showPreview}
              unifiedScroll={false}
              overlayMode={settings?.livePreview?.overlayMode || false}
              left={
                <div ref={editorContainerRef} className="w-full h-full">
                  <CodeEditor
                    value={code || ''}
                    language={detectedLang}
                    wordWrap={wordWrap}
                    theme={currentTheme}
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
                    onCursorChange={setCursorPos}
                  />
                </div>
              }
              right={
                <div className="h-full p-0">
                  {useMemo(() => {
                    const ext = title?.includes('.') ? title.split('.').pop()?.toLowerCase() : null

                    // Default detection from extension
                    let detectedLang = ext || 'plaintext'

                    // Heuristic: If untitled/no-extension, check content for Markdown indicators
                    if (!ext && debouncedCode) {
                      const trimmed = debouncedCode.trim()
                      if (
                        trimmed.startsWith('# ') ||
                        trimmed.startsWith('## ') ||
                        trimmed.startsWith('### ') ||
                        trimmed.startsWith('- ') ||
                        trimmed.startsWith('* ') ||
                        trimmed.startsWith('```') ||
                        trimmed.startsWith('>')
                      ) {
                        detectedLang = 'markdown'
                      }
                    }

                    return (
                      <LivePreview
                        code={debouncedCode}
                        language={detectedLang}
                        snippets={snippets}
                        theme={currentTheme}
                        fontFamily={settings?.editor?.fontFamily}
                        onOpenExternal={handleOpenExternalPreview}
                        onOpenMiniPreview={handleOpenMiniPreview}
                        onExportPDF={handleExportPDF}
                      />
                    )
                  }, [debouncedCode, title, snippets, currentTheme, settings?.editor?.fontFamily])}
                </div>
              }
            />
          </div>

          <StatusBar
            title={title}
            isLargeFile={code.length > 50000}
            snippets={snippets}
            stats={stats}
            line={cursorPos.line}
            col={cursorPos.col}
            minimal={settings?.ui?.showFlowMode}
          />

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
