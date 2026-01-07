import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { GripVertical } from 'lucide-react'
import { useKeyboardShortcuts } from '../../features/keyboard/useKeyboardShortcuts'
import { useEditorFocus } from '../../hook/useEditorFocus.js'
import { useZoomLevel, useEditorZoomLevel } from '../../hook/useSettingsContext'
import { ZOOM_STEP } from '../../hook/useZoomLevel.js'
import WelcomePage from '../WelcomePage.jsx'
import { StatusBar } from '../layout/StatusBar/useStatusBar'
import CodeEditor from '../CodeEditor/CodeEditor.jsx'
import LivePreview from '../livepreview/LivePreview.jsx'
import Prompt from '../mermaid/modal/Prompt.jsx'
import { useSettings, useAutoSave } from '../../hook/useSettingsContext'
import { useTheme } from '../../hook/useTheme'
import AdvancedSplitPane from '../splitPanels/AdvancedSplitPane'
import { makeDraggable } from '../../utils/draggable.js'
import UniversalModal from '../universal/UniversalModal'
import { useUniversalModal } from '../universal/useUniversalModal'
import DiagramEditorModal from '../mermaid/modal/DiagramEditorModal'
import TableEditorModal from '../table/TableEditorModal'
import PerformanceBarrier from '../universal/PerformanceBarrier/PerformanceBarrier'

// Extracted Editor Hooks & Components
import { useEditorState } from './editor/useEditorState'
import { useWikiLinks } from './editor/useWikiLinks'
import { useEditorExport } from './editor/useEditorExport'
import { useEditorSave } from './editor/useEditorSave'
import EditorMetadataHeader from './editor/EditorMetadataHeader'
import EditorModeSwitcher from './editor/EditorModeSwitcher'
import { useEditorCloseCheck } from './editor/useEditorCloseCheck.jsx'
import { useSnippetOperations } from './editor/useSnippetOperations'
import '../universal/universalStyle.css'
import './editor/EditorMetadata.css'

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                          SNIPPET EDITOR                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * FILE LOCATION:
 *   src/renderer/src/components/workbench/SnippetEditor.jsx
 *
 * PARENT COMPONENTS:
 *   - Workbench.jsx (src/renderer/src/components/workbench/Workbench.jsx)
 *     └─> Renders this when activeView === 'editor'
 *
 * CORE RESPONSIBILITY:
 *   The main workspace for editing snippets. It provides a localized environment
 *   for modifying code/markdown with real-time preview (Split View).
 *
 *   CRITICAL: This component holds the "Draft" state. Changes here are NOT
 *   persisted to the main database until internal save logic triggers `onSave`.
 *
 * COMPONENT STRUCTURE:
 *   [CodeEditor (CodeMirror)]  <-- Split Pane -->  [LivePreview (Markdown)]
 *          |                                            |
 *          └─────────────────[Status Bar]───────────────┘
 *
 * FEATURES:
 *   - Advanced Split Pane (draggable resizer)
 *   - Auto-Save integration
 *   - Real-time Markdown rendering
 *   - Diagram/Table visual editing (via Modals)
 *   - Zoom controls
 *
 * AUTO-SAVE LOGIC:
 *   - Uses `useAutoSave` hook.
 *   - Triggers `onSave` prop after N seconds of inactivity.
 *   - Shows status (Saving... -> Saved) in Status Bar.
 *
 * RELATED FILES:
 *   - CodeEditor.jsx - The actual CodeMirror wrapper.
 *   - LivePreview.jsx - HTML renderer.
 *   - AdvancedSplitPane.jsx - Resizable layout container.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
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
  snippets = [],
  onPing,
  onFavorite,
  isFlow = false,
  onDirtyStateChange
}) => {
  const [zoomLevel, setZoom] = useZoomLevel()
  const [editorZoom, setEditorZoom] = useEditorZoomLevel()
  const { settings, getSetting, updateSetting } = useSettings()
  const { currentTheme } = useTheme()

  // --- NEW SPECIALIZED HOOKS ---
  const editorState = useEditorState({
    initialSnippet,
    snippets,
    onDirtyStateChange
  })

  // Destructure for easier access
  const {
    code,
    setCode,
    handleCodeChange,
    codeRef,
    isDirty,
    setIsDirty,
    isDirtyRef,
    isDiscardingRef,
    skipAutosaveRef,
    title,
    setTitle,
    tags,
    setTags,
    currentTagInput,
    setCurrentTagInput,
    isDuplicate
  } = editorState

  const autoSaveEnabled = settings?.behavior?.autoSave !== false

  const editorSave = useEditorSave({
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
    onAutosave
  })

  const { handleSave, scheduleSave, lastSavedTitle } = editorSave

  const {
    isOpen: isUniOpen,
    title: uniTitle,
    content: uniContent,
    footer: uniFooter,
    width: uniWidth,
    height: uniHeight,
    resetPosition: uniResetPosition,
    isMaximized: uniMaximized,
    hideHeaderBorder: uniHideHeaderBorder,
    noTab: uniNoTab,
    className: uniClassName,
    closeModal: closeUni,
    openModal,
    setModalState: setUniState
  } = useUniversalModal()

  const editorExport = useEditorExport({
    code,
    title,
    initialSnippet,
    currentTheme,
    showToast
  })

  // Destructure export handlers
  const {
    handleExportPDF,
    handleExportWord,
    handleCopyToClipboard,
    handleOpenExternalPreview,
    handleOpenMiniPreview
  } = editorExport

  // WikiLink Logic Hook
  useWikiLinks({
    snippets,
    handleSelectSnippet: (s) => window.dispatchEvent(new CustomEvent('app:open-snippet', { detail: { title: s.title } })),
    createDraftSnippet: (title, folderId) => ({ title, folder_id: folderId, code: '', tags: [], is_draft: true }),
    saveSnippet: onSave,
    setSelectedSnippet: () => {}, // Handled by library
    navigateTo: () => {}, // Handled by library
    showToast
  })

  const { handleTriggerCloseCheck } = useEditorCloseCheck({
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
  })

  const { handleSplitSnippet } = useSnippetOperations({
    title,
    code,
    setCode,
    setIsDirty,
    initialSnippet,
    snippets,
    onSave,
    onNew,
    showToast
  })

  const [justRenamed, setJustRenamed] = useState(false)
  const [isFloating, setIsFloating] = useState(
    () => settings?.ui?.modeSwitcher?.isFloating || false
  )
  const switcherRef = useRef(null)
  const dragHandleRef = useRef(null)

  // Ref for title input auto-focus
  const titleInputRef = useRef(null)

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const handleCursorChange = useCallback((pos) => {
    setCursorPos(pos)
  }, [])
  const [activeMode, setActiveMode] = useState('live_preview')
  const editorContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const [pinPopover, setPinPopover] = useState({ visible: false, x: 0, y: 0 })

  // Header scroll logic
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(120) // Default estimate

  // Measure header height dynamically
  useEffect(() => {
    if (!headerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Add a little buffer or exact height
        setHeaderHeight(entry.contentRect.height)
      }
    })
    resizeObserver.observe(headerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  const wordWrap = getSetting('editor.wordWrap') !== false

  const onToggleCompactHandler = useCallback(() => {
    if (onToggleCompact) onToggleCompact()
  }, [onToggleCompact])

  const onEditorScroll = useCallback((scrollTop) => {
    if (headerRef.current) {
      headerRef.current.style.transform = `translateY(-${scrollTop}px)`
    }
  }, [])

  // Auto-focus title input when creating new snippet
  useEffect(() => {
    if (isCreateMode && titleInputRef.current) {
      const enforceTitleFocus = () => {
        // Aggressively blur editor to prevent focus stealing
        const cm = document.querySelector('.cm-content')
        if (cm) cm.blur()
        
        if (titleInputRef.current) {
          titleInputRef.current.focus({ preventScroll: true })
          titleInputRef.current.select()
        }
      }

      // 1. Immediate
      enforceTitleFocus()
      
      // 2. Post-Render/Layout
      setTimeout(enforceTitleFocus, 50)
      
      // 3. Post-Animation/Mount
      setTimeout(enforceTitleFocus, 300)
    }
  }, [isCreateMode])



  // Apply stored position on mount or when going floating
  useEffect(() => {
    if (isFloating && switcherRef.current) {
      const pos = settings?.ui?.modeSwitcher?.pos
      if (pos && pos.x !== null && pos.y !== null) {
        switcherRef.current.style.left = `${pos.x}px`
        switcherRef.current.style.top = `${pos.y}px`
        switcherRef.current.style.bottom = 'auto'
        switcherRef.current.style.right = 'auto'
      }
    }
  }, [isFloating])

  // Listen for mode changes from CM instance
  useEffect(() => {
    const handleModeChange = (e) => setActiveMode(e.detail.mode)
    window.addEventListener('app:mode-changed', handleModeChange)
    return () => window.removeEventListener('app:mode-changed', handleModeChange)
  }, [])

  // Listen for Source Modal requests from richMarkdown extension
  useEffect(() => {
    const handleSourceModal = (e) => {
      const { view, from, to, initialCode } = e.detail
      const oldSlice = view.state.doc.sliceString(from, to).trim()

      const previousSelection = view.state.selection
      const handleClose = () => {
        closeUni()
        // Restore focus and selection to main editor
        requestAnimationFrame(() => {
          try {
            view.focus()
            if (previousSelection) {
              view.dispatch({ selection: previousSelection })
            }
          } catch (e) {
            console.warn('Failed to restore focus/selection:', e)
          }
        })
      }

      const onApplyChanges = (newCode) => {
        let finalCode = newCode.trim()

        // Persistent detection: Check if we are editing a fenced block
        const hasMermaidFences =
          oldSlice.startsWith('```mermaid') || initialCode.startsWith('```mermaid')
        const hasStandardFences = oldSlice.startsWith('```') || initialCode.startsWith('```')

        if (hasMermaidFences) {
          // If the modal already returned it wrapped, don't double wrap
          if (!finalCode.startsWith('```mermaid')) {
            finalCode = '```mermaid\n' + finalCode + '\n```'
          }
        } else if (hasStandardFences) {
          if (!finalCode.startsWith('```')) {
            const match = (oldSlice || initialCode).match(/^```(\w*)/)
            const lang = match ? match[1] : ''
            finalCode = '```' + lang + '\n' + finalCode + '\n```'
          }
        }

        window.__suppressNextSourceModal = true
        view.dispatch({
          changes: { from, to, insert: finalCode },
          userEvent: 'input.source.modal'
        })
        handleClose()
      }

      // 1. Detect Mermaid Block
      const isMermaid = oldSlice.startsWith('```mermaid') || initialCode.startsWith('```mermaid')
      if (isMermaid) {
        const innerCode = initialCode.replace(/^```mermaid\n?/, '').replace(/\n?```$/, '')
        openModal({
          title: 'Edit Mermaid Diagram',
          width: '90vw',
          height: '80vh',
          resetPosition: true,
          className: 'no-padding',
          hideHeaderBorder: true,
          noTab: true,
          content: (
            <DiagramEditorModal
              initialCode={innerCode}
              onSave={onApplyChanges}
              onCancel={handleClose}
            />
          ),
          footer: null
        })
        return
      }

      // 2. Detect Table Block
      const isTable =
        (oldSlice.includes('|') && oldSlice.includes('---')) ||
        (initialCode.includes('|') && initialCode.includes('---'))
      if (isTable) {
        openModal({
          title: 'Visual Table Editor',
          width: '90vw',
          height: '80vh',
          resetPosition: true,
          className: 'no-padding',
          hideHeaderBorder: true,
          noTab: true,
          content: (
            <TableEditorModal
              initialCode={initialCode}
              onSave={onApplyChanges}
              onCancel={handleClose}
            />
          ),
          footer: null
        })
        return
      }

      // 3. Fallback: Standard Text/Code Block Modal
      let currentInput = initialCode
      openModal({
        title: 'Edit Raw Source',
        content: (
          <div className="source-editor-container">
            <textarea
              className="cm-md-source-modal-input"
              style={{
                width: '100%',
                minHeight: '300px',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                outline: 'none',
                resize: 'none',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.6'
              }}
              defaultValue={initialCode}
              onChange={(evt) => {
                currentInput = evt.target.value
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleClose()
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  onApplyChanges(currentInput)
                }
              }}
              autoFocus
            />
          </div>
        ),
        footer: (
          <div className="flex gap-2">
            <button className="cm-md-modal-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button className="cm-md-modal-save" onClick={() => onApplyChanges(currentInput)}>
              Apply Changes
            </button>
          </div>
        )
      })
    }

    window.addEventListener('app:open-source-modal', handleSourceModal)
    return () => window.removeEventListener('app:open-source-modal', handleSourceModal)
  }, [openModal, closeUni])

  useEffect(() => {
    // Check Universal Lock (Master Switch)
    const isLocked = settings?.ui?.universalLock?.modal

    if (isLocked) {
      if (isFloating) {
        setIsFloating(false)
        updateSetting('ui.modeSwitcher.isFloating', false)
      }

      // FORCE RESET POSITION STYLES if locked
      if (switcherRef.current) {
        switcherRef.current.style.top = ''
        switcherRef.current.style.left = ''
        switcherRef.current.style.bottom = ''
        switcherRef.current.style.right = ''
        switcherRef.current.style.transform = ''
        switcherRef.current.style.margin = ''
      }
      return
    }

    if (settings?.ui?.modeSwitcher?.disableDraggable) {
      // Legacy/Local switch support if we kept it, but Universal Lock overrides all
      if (isFloating) setIsFloating(false)
      return
    }

    if (isFloating && switcherRef.current && dragHandleRef.current) {
      return makeDraggable(switcherRef.current, dragHandleRef.current, (pos) => {
        updateSetting('ui.modeSwitcher.pos', pos)
      })
    }
  }, [
    isFloating,
    updateSetting,
    settings?.ui?.modeSwitcher?.disableDraggable,
    settings?.ui?.universalLock?.modal
  ])

  const cycleMode = useCallback(() => {
    const modes = ['source', 'live_preview', 'reading']
    const nextIndex = (modes.indexOf(activeMode) + 1) % modes.length
    window.dispatchEvent(
      new CustomEvent('app:set-editor-mode', { detail: { mode: modes[nextIndex] } })
    )
  }, [activeMode])

  // Update title when initialSnippet changes (e.g., after rename)
  useEffect(() => {
    // Only update if the ID matches (same snippet) but title is different externally
    // AND we are not currently editing it (handled by not having 'title' in deps)
    if (initialSnippet?.title && initialSnippet.title.replace(/\.md$/i, '') !== title) {
      // AUTO-ECHO PROTECTION:
      // If the incoming title matches what we JUST saved, ignore it to prevent cursor jumps.
      // This happens because autosave completes -> updates parent -> parent pushes new prop -> we re-render.
      if (initialSnippet.title.replace(/\.md$/i, '') === lastSavedTitle.current) {
        return
      }

      // Check if this is a genuine external update (e.g. sidebar rename)
      setTitle(initialSnippet.title.replace(/\.md$/i, ''))
      // Removed focus stealing to prevent scroll jumps on save
    }
  }, [initialSnippet?.title])


  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false
  const saveTimerRef = useRef(null)
  const [isLargeFile, setIsLargeFile] = useState(false)

  // Debounced code for live preview
  const [debouncedCode, setDebouncedCode] = useState(code)
  // Stabilize language detection so the editor doesn't re-mount on every keystroke
  const detectedLang = useMemo(() => {
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
  }, [title, code.substring(0, 20)]) // Re-detect if title or start of code changes

  useEffect(() => {
    // TWEAK: Slightly more aggressive update for better "Live" feel
    // while still protecting the thread for massive documents.
    const wait = code.length > 150000 ? 1200 : code.length > 50000 ? 600 : 300
    const timer = setTimeout(() => {
      setDebouncedCode(code)
      // Broadcast live code to Ghost Preview only after debounce
      window.dispatchEvent(
        new CustomEvent('app:code-update', {
          detail: { code, language: detectedLang }
        })
      )
    }, wait)
    return () => clearTimeout(timer)
  }, [code, detectedLang, initialSnippet?.id, isDirty])




  const [namePrompt, setNamePrompt] = useState({ isOpen: false, initialName: '' })

  // Word count is computationally expensive for large files, so we compute it against debouncedCode
  const words = useMemo(() => {
    const text = debouncedCode || ''
    const len = text.length
    if (len === 0) return 0
    // Fast path for massive files: Use regex for word count if over 50k chars
    if (len > 50000) {
      return (text.match(/\S+/g) || []).length
    }
    let count = 0
    let inWord = false
    for (let i = 0; i < len; i++) {
      const charCode = text.charCodeAt(i)
      const isWhitespace =
        charCode === 32 || charCode === 9 || charCode === 10 || charCode === 13 || charCode === 160
      if (isWhitespace) {
        inWord = false
      } else if (!inWord) {
        inWord = true
        count++
      }
    }
    return count
  }, [debouncedCode])

  // Chars/Stats are stabilized to prevent Status Bar flickering on every keystroke
  const stats = useMemo(
    () => ({
      chars: (debouncedCode || '').length,
      words: words
    }),
    [debouncedCode.length, words]
  )







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
      // Silently ignore delete for system files to avoid modal popup
      if (
        initialSnippet?.id === 'system:settings' ||
        initialSnippet?.id === 'system:default-settings'
      )
        return

      if (onDelete) onDelete(initialSnippet?.id)
    },
    onCloseEditor: handleTriggerCloseCheck,
    onToggleMode: cycleMode,
    onCopyToClipboard: handleCopyToClipboard,
    onEscapeMenusOnly: (e) => {
      // 1. Close Pin Popover if open
      if (pinPopover?.visible) {
        setPinPopover?.({ ...pinPopover, visible: false })
        return true
      }
      // 2. Close Universal Modal if open
      if (isUniOpen && closeUni) {
        closeUni()
        return true
      }

      // 3. Dispatch to CodeEditor to close internal tooltips (link preview, autocomplete)
      window.dispatchEvent(new CustomEvent('app:close-tooltips'))

      // Return false so we don't block other Escape behaviors (like clearing selection)
      return false
    }
  })

  useEffect(() => {
    if (justRenamed && !namePrompt.isOpen) {
      setTimeout(() => {
        const editorElement = document.querySelector('.cm-editor .cm-content')
        if (editorElement) editorElement.focus()
      }, 500)
      setJustRenamed(false)
    }
  }, [justRenamed, namePrompt.isOpen])

  useEffect(() => {
    const fn = () => handleSave(true) // Force save on manual trigger
    const pdfFn = () => handleExportPDF()
    const wordFn = () => handleExportWord()

    window.addEventListener('force-save', fn)
    window.addEventListener('app:trigger-export-pdf', pdfFn)
    window.addEventListener('app:trigger-export-word', wordFn)

    return () => {
      window.removeEventListener('force-save', fn)
      window.removeEventListener('app:trigger-export-pdf', pdfFn)
      window.removeEventListener('app:trigger-export-word', wordFn)
    }
  }, [handleSave, handleExportPDF, handleExportWord])

  return (
    <>
      {!isCreateMode && (!initialSnippet || !initialSnippet.id) && !hideWelcomePage ? (
        <WelcomePage onNewSnippet={onNew} />
      ) : (
        <div
          className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative SnippetEditor_root"
          style={{ backgroundColor: 'var(--editor-bg)' }}
        >
          <div className="flex-1 min-h-0 overflow-hidden editor-container relative flex flex-col">
            <AdvancedSplitPane
              rightHidden={!showPreview}
              unifiedScroll={false}
              overlayMode={settings?.livePreview?.overlayMode || false}
              left={
                <div className="flex flex-col h-full w-full relative">
                  {/* SEAMLESS METADATA HEADER (Obsidian Style) - Absolute & Scrollable */}
                  <div 
                    ref={headerRef} 
                    className="absolute top-0 left-0 right-4 z-10 transition-transform will-change-transform bg-[var(--editor-bg)] pointer-events-none"
                  >
                    <div className="pointer-events-auto">
                      <EditorMetadataHeader
                        title={title}
                        setTitle={setTitle}
                        tags={tags}
                        setTags={setTags}
                        currentTagInput={currentTagInput}
                        setCurrentTagInput={setCurrentTagInput}
                        isDuplicate={isDuplicate}
                        initialSnippet={initialSnippet}
                        onSave={onSave}
                        code={code}
                        setIsDirty={setIsDirty}
                        titleInputRef={titleInputRef}
                      />
                    </div>
                  </div>

                  <div ref={editorContainerRef} className="flex-1 w-full relative flex justify-center min-h-0">
                    <div className="w-full h-full relative">
                      <CodeEditor
                        value={code || ''}
                        language={detectedLang}
                        wordWrap={wordWrap}
                        theme={currentTheme}
                        centered={true}
                        autoFocus={!isCreateMode && initialSnippet?.id !== 'system:settings'}
                        snippetId={initialSnippet?.id}
                        readOnly={initialSnippet?.readOnly || false}
                        onChange={handleCodeChange}
                        onLargeFileChange={setIsLargeFile}
                        onScroll={onEditorScroll}
                        style={{
                          '--editor-content-padding-top': `${headerHeight}px`
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            // Trigger the close logic which now handles the warning
                            handleTriggerCloseCheck()
                          }
                          if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                            e.preventDefault()
                            onToggleCompactHandler()
                          }
                          // Ctrl + / to cycle modes
                          if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                            e.preventDefault()
                            cycleMode()
                          }
                        }}
                        height="100%"
                        className="h-full"
                        textareaRef={textareaRef}
                        snippets={snippets}
                        zenFocus={settings?.ui?.zenFocus}
                        onCursorChange={handleCursorChange}
                      />
                    </div>
                  </div>
                </div>
              }
              right={
                <div className="h-full w-full p-0 flex justify-center bg-[var(--color-bg-primary)] overflow-hidden text-left items-stretch relative">
                  <div className="w-full max-w-[850px] h-full shadow-sm flex flex-col">
                    {useMemo(() => {
                      const safeTitle = typeof title === 'string' ? title : ''
                      const ext = safeTitle.includes('.')
                        ? safeTitle.split('.').pop()?.toLowerCase()
                        : null

                      let detectedLang = ext || 'plaintext'

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
                        // Live Preview
                        <div className="flex-1 w-full min-h-0 relative">
                          <LivePreview
                            code={debouncedCode}
                            language={detectedLang}
                            snippets={snippets}
                            theme={currentTheme}
                            fontFamily={settings?.editor?.fontFamily}
                            onOpenExternal={handleOpenExternalPreview}
                            onOpenMiniPreview={handleOpenMiniPreview}
                            onExportPDF={handleExportPDF}
                            zenFocus={settings?.ui?.zenFocus}
                          />
                        </div>
                      )
                    }, [
                      debouncedCode,
                      title,
                      snippets,
                      currentTheme,
                      settings?.editor?.fontFamily
                    ])}
                  </div>
                </div>
              }
            />

            <EditorModeSwitcher
              isFloating={isFloating}
              setIsFloating={setIsFloating}
              switcherRef={switcherRef}
              dragHandleRef={dragHandleRef}
              activeMode={activeMode}
              updateSetting={updateSetting}
              settings={settings}
              initialSnippet={initialSnippet}
              onFavorite={onFavorite}
              onPing={onPing}
              isFlow={isFlow}
            />
          </div>

          <StatusBar
            title={title}
            isFavorited={initialSnippet?.is_favorite === 1}
            isLargeFile={isLargeFile || code.length > 120000}
            stats={stats}
            line={cursorPos.line}
            col={cursorPos.col}
            minimal={isFlow || settings?.ui?.showFlowMode}
          />

          <PerformanceBarrier
            words={words}
            onSplit={handleSplitSnippet}
            triggerReset={debouncedCode}
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
            placeholder="e.g. document.js or document.md"
          />

          <UniversalModal
            key={settings?.ui?.universalModal?.disableDrag ? 'locked' : 'draggable'}
            isOpen={isUniOpen}
            onClose={closeUni}
            title={uniTitle}
            footer={uniFooter}
            width={uniWidth}
            height={uniHeight}
            resetPosition={uniResetPosition}
            isMaximized={uniMaximized}
            onMaximize={(val) => setUniState((prev) => ({ ...prev, isMaximized: val }))}
            customKey="snippet_editor_universal_modal"
            hideHeaderBorder={uniHideHeaderBorder}
            noTab={uniNoTab}
            className={uniClassName}
          >
            {uniContent}
          </UniversalModal>
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
