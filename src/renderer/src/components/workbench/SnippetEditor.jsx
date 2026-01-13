import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import { GripVertical } from 'lucide-react'
import { useKeyboardShortcuts } from '../../features/keyboard/useKeyboardShortcuts'
import { useEditorFocus } from '../../hook/useEditorFocus.js'
import { useZoomLevel, useEditorZoomLevel } from '../../hook/useSettingsContext'
import useDebounce from '../../hook/useDebounce'
import { ZOOM_STEP } from '../../hook/useZoomLevel.js'
import WelcomePage from '../WelcomePage.jsx'
import { StatusBar } from '../layout/StatusBar/useStatusBar'
import CodeEditor from '../CodeEditor/CodeEditor.jsx'
import LivePreview from '../livepreview/LivePreview.jsx'
import LivePreviewErrorBoundary from '../livepreview/LivePreviewErrorBoundary.jsx'
import { useSettings, useAutoSave } from '../../hook/useSettingsContext'
import { useTheme } from '../../hook/useTheme'
import AdvancedSplitPane from '../splitPanels/AdvancedSplitPane'
import { makeDraggable } from '../../utils/draggable.js'
import UniversalModal from '../universal/UniversalModal'
import { useUniversalModal } from '../universal/useUniversalModal'
import TableEditorModal from '../table/TableEditorModal'
import PerformanceBarrier from '../universal/PerformanceBarrier/PerformanceBarrier'
import Prompt from '../universal/Prompt'

// Extracted Editor Hooks & Components
import { useEditorState } from './editor/useEditorState'  
// import { useWikiLinks } from './editor/useWikiLinks' // REMOVED: Redundant
import { useEditorExport } from './editor/useEditorExport'
import { useEditorSave } from './editor/useEditorSave'
import EditorMetadataHeader from './editor/EditorMetadataHeader'
import EditorModeSwitcher from './editor/EditorModeSwitcher'
import { sanitizeTitle, getDisplayTitle, sanitizeTag } from '../../utils/editorUtils'
import { useEditorCloseCheck } from './editor/useEditorCloseCheck.jsx'
import { useSnippetOperations } from './editor/useSnippetOperations'
import { extractTags } from '../../utils/snippetUtils'
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
  onDirtyStateChange,
  isReadOnly
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
    currentTagInput,
    setCurrentTagInput,
    isDuplicate,
    setTags: internalSetTags 
  } = editorState

  // --- CLEAN TAG GUARD ---
  // Automatically strips # and , from tags for a robust organization.
  const handleSetTags = useCallback((val) => {
    const process = (t) => (Array.isArray(t) ? t : []).map(sanitizeTag).filter(Boolean)
    if (typeof val === 'function') {
      internalSetTags(prev => process(val(prev)))
    } else {
      internalSetTags(process(val))
    }
  }, [internalSetTags])

  // --- LIVE TAG INPUT SANITIZER ---
  // Strips #, @, and , in real-time as the user types in the tag input.
  const handleSetCurrentTagInput = useCallback((val) => {
    const clean = sanitizeTag(val)
    setCurrentTagInput(clean)
  }, [setCurrentTagInput])

  useEffect(() => {
    if (
      initialSnippet?.id === 'system:settings' && 
      !isDirty && 
      !window.__isSavingSettings && 
      initialSnippet.code !== code
    ) {
      setCode(initialSnippet.code)
    }
  }, [initialSnippet?.code, isDirty, setCode])

  // --- RESIZE OBSERVER STABILITY ---
  // Suppresses the "Measure loop restarted" error which is often benign in complex flexbox layouts
  useEffect(() => {
    const handleError = (e) => {
      if (e.message?.includes('ResizeObserver loop') || e.message?.includes('Measure loop restarted')) {
        const resizeObserverErrGuid = 'document.querySelector(".editor-container")'
        if (e.stopImmediatePropagation) e.stopImmediatePropagation()
        return true
      }
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // --- LIVE TAG SYNCHRONIZER (DEBOUNCED & STABLE) ---
  // Ensures that when you delete a #tag from the editor, it vanishes from the header.
  const debouncedCodeForTags = useDebounce(code, 500)
  useEffect(() => {
    if (!debouncedCodeForTags) return
    const currentExtracted = extractTags(debouncedCodeForTags)
    
    // Safety check: Only update if the tags have actually changed to avoid render loops
    const tagsChanged = (prev) => {
      if (prev.length !== currentExtracted.length) return true
      return !currentExtracted.every(t => prev.includes(t))
    }

    handleSetTags(prev => {
      if (!tagsChanged(prev)) return prev
      return Array.from(new Set([...currentExtracted]))
    })
  }, [debouncedCodeForTags, handleSetTags])

  const autoSaveEnabled = settings?.behavior?.autoSave !== false


 
  // --- DETECT LANGUAGE (THROTTLED) ---
  // --- DETECT LANGUAGE (FAST & HYBRID) ---
  // 1. Raw code check for instant header/list detection
  // 2. Debounced code for deeper pattern matching (performance)
  const debouncedCodeForLang = useDebounce(code, 600)
  const detectedLang = useMemo(() => {
    const safeTitle = typeof title === 'string' ? title : ''
    const ext = safeTitle.includes('.') ? safeTitle.split('.').pop()?.toLowerCase() : null
    
    // 0. ENSURE: .md always maps to 'markdown' engine (Instant)
    if (ext === 'md' || ext === 'markdown') return 'markdown'
    
    // Default to markdown as the project standard to avoid "Language Flips"
    // that cause the caret to jump on the first character.
    let lang = ext || 'markdown'
    
    // 1. FAST CHECK (Synchronous on raw code)
    // Checks only the first few bytes. Extremely cheap and ensures instant # -> H1
    const fastTrim = (code || '').substring(0, 10).trim()
    if (
      fastTrim.startsWith('#') || // Instant: Headings (# ) and Tags (#tag)
      fastTrim.startsWith('@') || // Instant: Mentions (@user)
      fastTrim.startsWith('- ') ||
      fastTrim.startsWith('* ') ||
      fastTrim.startsWith('```') ||
      fastTrim.startsWith('>')
    ) {
      return 'markdown'
    }

    // 2. DEEP CHECK (Debounced for performance on large files)
    if (!ext && debouncedCodeForLang) {
      const trimmed = debouncedCodeForLang.substring(0, 500).trim()
      if (
        trimmed.includes('**') ||
        trimmed.includes(']]') ||
        trimmed.includes('|') ||
        trimmed.includes('# ') || 
        trimmed.includes('- ')
      ) {
        lang = 'markdown'
      }
    }
    return lang
  }, [title, code?.substring(0, 10), debouncedCodeForLang, initialSnippet?.language])

  // --- HIGH-INTEGRITY SAVING (SANITIZED) ---
  const handleOnSave = useCallback((item) => {
    const finalItem = {
      ...item,
      title: sanitizeTitle(item.title),
      language: detectedLang 
    }
    onSave(finalItem)
  }, [onSave, detectedLang])

  const editorSave = useEditorSave({
    code,
    title,
    tags,
    currentTagInput,
    initialSnippet,
    autoSaveEnabled,
    onSave: handleOnSave, // Use the wrapper
    isDuplicate,
    getSetting,
    showToast,
    setIsDirty,
    isDirty,
    onDirtyStateChange,
    onAutosave,
    isReadOnly
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
    snippets,
    currentTheme,
    settings,
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

  // WikiLink Logic: Handled entirely by SnippetLibraryInner (global listener)
  // Removing redundant listener here to prevent recursive loop 'Maximum call stack size exceeded'
  

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

  const switcherRef = useRef(null)
  const dragHandleRef = useRef(null)

  // Ref for title input auto-focus
  const titleInputRef = useRef(null)

  // --- CORE UI STATE (HOISTED FOR INITIALIZATION SAFETY) ---
  const [justRenamed, setJustRenamed] = useState(false)
  const [isFloating, setIsFloating] = useState(
    () => settings?.ui?.modeSwitcher?.isFloating || false
  )
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [selectionCount, setSelectionCount] = useState(0)
  const [activeMode, setActiveMode] = useState('live_preview')
  const [isLargeFile, setIsLargeFile] = useState(false)
  const editorContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const [pinPopover, setPinPopover] = useState({ visible: false, x: 0, y: 0 })
  const debouncedCodeForPreview = useDebounce(code, code.length > 20000 ? 500 : 0)

  // 1. PRIMARY SETTINGS & HANDLERS
  const wordWrap = getSetting('editor.wordWrap') !== false

  const handleCursorChange = useCallback((pos) => {
    setCursorPos({ line: pos.line, col: pos.col })
    if (typeof pos.selectionCount === 'number') {
      setSelectionCount(pos.selectionCount)
    }
  }, [])

  const onToggleCompactHandler = useCallback(() => {
    if (onToggleCompact) onToggleCompact()
  }, [onToggleCompact])

  const cycleMode = useCallback(() => {
    const modes = ['source', 'live_preview', 'reading']
    const currentMode = activeMode || 'live_preview'
    const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length
    window.dispatchEvent(
      new CustomEvent('app:set-editor-mode', { detail: { mode: modes[nextIndex] } })
    )
  }, [activeMode])

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

  // 2. KEYBOARD ENGINE
  const handleEditorKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleTriggerCloseCheck()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault()
      onToggleCompactHandler()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault()
      cycleMode()
    }
  }, [handleTriggerCloseCheck, onToggleCompactHandler, cycleMode])

  // Header visibility logic - Polished for clarity
  const isSystemSnippet = initialSnippet?.id === 'system:settings' || initialSnippet?.id === 'system:default-settings'
  const isSnippetEditable = !isReadOnly && !initialSnippet?.readOnly && !isSystemSnippet
  const isHeaderVisible = !isFlow && (isSnippetEditable || isCreateMode)

  const headerRef = useRef(null)

  // STABLE STYLE: Clean empty object to prevent any React style-diffing.
  const editorStyle = useMemo(() => ({}), []) 

  // --- MEMOIZED COMPONENT SHIELDS (Maximum Typing Speed) ---
  
  // 1. Surgical Header Shield
  const memoizedHeader = useMemo(() => {
    if (!isHeaderVisible) return null
    return (
      <div className="w-full shrink-0 relative z-30 bg-transparent">
        <EditorMetadataHeader
          title={title}
          setTitle={setTitle}
          tags={tags}
          setTags={handleSetTags}
          currentTagInput={currentTagInput}
          setCurrentTagInput={handleSetCurrentTagInput}
          isDuplicate={isDuplicate}
          initialSnippet={initialSnippet}
          onSave={onSave}
          code={code} // Still needed for save handling, but update is throttled by parent
          setIsDirty={setIsDirty}
          titleInputRef={titleInputRef}
          readOnly={isReadOnly}
        />
      </div>
    )
  }, [isHeaderVisible, title, tags, currentTagInput, isDuplicate, initialSnippet?.id, isReadOnly])

  // 2. Surgical Editor Shield
  const memoizedEditor = useMemo(() => {
    return (
      <div className="flex-1 w-full flex flex-col min-h-0 bg-transparent relative">
        <CodeEditor
          value={code || ''}
          language={detectedLang}
          mode={activeMode} // CRITICAL: Restored mode for Advanced System (Live/Source/Reading)
          wordWrap={wordWrap}
          theme={currentTheme}
          centered={true}
          autoFocus={!isCreateMode && initialSnippet?.id !== 'system:settings'}
          snippetId={initialSnippet?.id}
          readOnly={isReadOnly || initialSnippet?.readOnly || false}
          onChange={handleCodeChange}
          onLargeFileChange={setIsLargeFile}
          style={editorStyle}
          onKeyDown={handleEditorKeyDown}
          height="100%"
          className="flex-1 h-full"
          textareaRef={textareaRef}
          snippets={snippets}
          zenFocus={settings?.ui?.zenFocus}
          onCursorChange={handleCursorChange}
        />
      </div>
    )
  }, [detectedLang, activeMode, wordWrap, currentTheme, isCreateMode, initialSnippet?.id, isReadOnly, handleCodeChange, editorStyle, handleEditorKeyDown, snippets, settings?.ui?.zenFocus, handleCursorChange])

  // 3. Surgical Preview Shield
  const memoizedPreview = useMemo(() => {
    return (
      <div className="h-full w-full p-0 flex justify-center bg-[var(--color-bg-primary)] overflow-hidden text-left items-stretch relative">
        <div className="w-full max-w-[850px] h-full shadow-sm flex flex-col">
          <LivePreview
            code={debouncedCodeForPreview}
            isReadOnly={isReadOnly || initialSnippet?.readOnly}
            initialSnippet={initialSnippet}
            onSettingsClick={onSettingsClick}
            isFlow={isFlow}
            snippets={snippets}
            enableScrollSync={getSetting('editor.scrollSync') !== false}
          />
        </div>
      </div>
    )
  }, [debouncedCodeForPreview, isReadOnly, initialSnippet?.id, onSettingsClick, isFlow, snippets, getSetting])

  // 4. Final Unified Workspace Frame
  const memoizedSplitPane = useMemo(() => {
    return (
      <AdvancedSplitPane
        rightHidden={!showPreview}
        unifiedScroll={false}
        overlayMode={settings?.livePreview?.overlayMode || false}
        left={
          <div className="h-full w-full relative bg-[var(--color-bg-primary)] overflow-hidden flex flex-col">
             {/* THE UNIFIED DOCUMENT FLOW: Non-collapsing flex chain for full-height coverage */}
             <div 
               className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
             >
                <div className="w-full max-w-[850px] mx-auto flex flex-col relative">
                   {memoizedHeader}
                   {/* Editor workspace: seamless and integrated */}
                   <div className="w-full flex flex-col bg-transparent border-none outline-none overflow-hidden min-h-[300px]">
                      {memoizedEditor}
                   </div>
                </div>
             </div>
          </div>
        }
        right={memoizedPreview}
      />
    )
  }, [showPreview, settings?.livePreview?.overlayMode, memoizedHeader, memoizedEditor, memoizedPreview])


  // Auto-focus title input when creating new snippet
  useEffect(() => {
    let timers = []
    if (isCreateMode && titleInputRef.current) {
      const enforceTitleFocus = () => {
        // Aggressively blur editor to prevent focus stealing
        const cm = document.querySelector('.cm-content')
        if (cm) cm.blur()
        
        if (titleInputRef.current) {
          titleInputRef.current.focus({ preventScroll: true })
        }
      }

      // 1. Immediate
      enforceTitleFocus()
      
      // 2. Post-Render/Layout
      timers.push(setTimeout(enforceTitleFocus, 50))
      
      // 3. Post-Animation/Mount
      timers.push(setTimeout(enforceTitleFocus, 300))
    }
    return () => timers.forEach(clearTimeout)
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

  // Mode management: Documentation/Read-only snippets should ALWAYS use 'reading' mode
  // while preserving the user's preferred mode for editable snippets.
  const isDoc = String(initialSnippet?.id || '').startsWith('doc:') || 
                String(initialSnippet?.title || '').toLowerCase().includes('manual') ||
                String(initialSnippet?.title || '').toLowerCase().includes('documentation') ||
                String(initialSnippet?.id || '').includes('content.js')
  const isReadOnlySnippet = !!(isReadOnly || initialSnippet?.readOnly || isDoc)

  // Listen for mode changes from CM instance
  useEffect(() => {
    const handleModeChange = (e) => {
      // If we are in a read-only snippet, we don't let mode changes stay persistent
      if (!isReadOnlySnippet) {
        setActiveMode(e.detail.mode)
      }
    }
    window.addEventListener('app:mode-changed', handleModeChange)
    return () => window.removeEventListener('app:mode-changed', handleModeChange)
  }, [isReadOnlySnippet])

  // Sync mode with engine when snippet or preferred mode changes
  useEffect(() => {
    const targetMode = isReadOnlySnippet ? 'reading' : activeMode
    window.dispatchEvent(
      new CustomEvent('app:set-editor-mode', { detail: { mode: targetMode } })
    )
  }, [isReadOnlySnippet, activeMode, initialSnippet?.id])

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
        const hasStandardFences = oldSlice.startsWith('```') || initialCode.startsWith('```')

        if (hasStandardFences) {
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

      // Detect Table Block
      const isTable =
        (oldSlice.includes('|') && oldSlice.includes('---')) ||
        (initialCode.includes('|') && initialCode.includes('---'))
      if (isTable && initialSnippet?.id !== 'system:settings' && initialSnippet?.id !== 'system:default-settings') {
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

  // cycleMode was moved up to hoist it before handleEditorKeyDown usage
  // <--- REMOVED DUPLICATE DEFINITION

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

  // Debounced code for live preview
  const [debouncedCode, setDebouncedCode] = useState(code)



  const lastSnippetIdRef = useRef(initialSnippet?.id)

  useEffect(() => {
    // TWEAK: Significantly more aggressive update for an "Instant" feel
    // while still protecting the thread for document complexity.
    
    // DETECT SNIPPET SWITCH: If the ID changed, we want an immediate update
    const isSwitchingSnippet = initialSnippet?.id !== lastSnippetIdRef.current
    if (isSwitchingSnippet) {
      lastSnippetIdRef.current = initialSnippet?.id
      // Immediate sync for switch to avoid seeing old preview content
      setDebouncedCode(code)
      return
    }

    // IF opening preview for the first time or switch happened, skip debounce
    const isOpeningPreview = showPreview && !debouncedCode && code
    
    // Standard debounce mapping:
    // Small (<10k): 75ms (Perceived as instant)
    // Medium (<50k): 150ms 
    // Large (<150k): 400ms
    // Massive (>150k): 800ms
    const wait = isOpeningPreview ? 0 : (
      code.length > 150000 ? 800 : 
      code.length > 50000 ? 400 : 
      code.length > 10000 ? 150 : 75
    )
    
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
  }, [code, detectedLang, initialSnippet?.id, showPreview])




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







  // Stabilize the preview component to prevent unnecessary remounts
  const previewContent = useMemo(() => {
    const safeTitle = typeof title === 'string' ? title : ''
    const ext = safeTitle.includes('.') ? safeTitle.split('.').pop()?.toLowerCase() : null

    let previewLang = ext || 'plaintext'

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
        previewLang = 'markdown'
      }
    }

    return (
      <div className="flex-1 w-full min-h-0 relative">
        <LivePreviewErrorBoundary>
          <LivePreview
            code={debouncedCode}
            language={previewLang}
            snippets={snippets}
            theme={currentTheme}
            fontFamily={settings?.editor?.fontFamily}
            onOpenExternal={handleOpenExternalPreview}
            onOpenMiniPreview={handleOpenMiniPreview}
            onExportPDF={handleExportPDF}
            zenFocus={settings?.ui?.zenFocus}
          />
        </LivePreviewErrorBoundary>
      </div>
    )
  }, [
    debouncedCode,
    title,
    snippets,
    currentTheme,
    settings?.editor?.fontFamily,
    handleOpenExternalPreview,
    handleOpenMiniPreview,
    handleExportPDF
  ])

  useKeyboardShortcuts({
    onSave: () => {
      if (isReadOnly) return
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

  // --- GIST SYNC HANDLER ---
  const handleGistSync = useCallback(async () => {
    try {
      showToast('☁️ Starting Gist backup...', 'info')
      await window.api.syncBackup()
      showToast('✅ Backup completed successfully', 'success')
    } catch (err) {
      console.error('Backup failed:', err)
      const errorMsg = err.message || 'Unknown error'
      if (errorMsg.includes('401') || errorMsg.includes('Invalid Token')) {
        showToast('❌ Backup failed: Invalid or expired token', 'error')
      } else if (errorMsg.includes('403')) {
        showToast('❌ Backup failed: Token lacks gist permissions', 'error')
      } else if (errorMsg.includes('No GitHub Token')) {
        showToast('❌ Backup failed: No token configured', 'error')
      } else {
        showToast(`❌ Backup failed: ${errorMsg}`, 'error')
      }
    }
  }, [showToast])

  const handleGistRestore = useCallback(async () => {
    if (!confirm('⚠️ This will OVERWRITE your local data with the GitHub backup. Are you sure?')) {
      return
    }

    try {
      showToast('☁️ Restoring from Gist...', 'info')
      await window.api.syncRestore()
      showToast('✅ Restore completed successfully', 'success')
    } catch (err) {
      console.error('Restore failed:', err)
      const errorMsg = err.message || 'Unknown error'
      if (errorMsg.includes('401') || errorMsg.includes('Invalid Token')) {
        showToast('❌ Restore failed: Invalid or expired token', 'error')
      } else if (errorMsg.includes('403')) {
        showToast('❌ Restore failed: Token lacks gist permissions', 'error')
      } else if (errorMsg.includes('No GitHub Token')) {
        showToast('❌ Restore failed: No token configured', 'error')
      } else if (errorMsg.includes('No backup found')) {
        showToast('❌ Restore failed: No backup found on GitHub', 'error')
      } else {
        showToast(`❌ Restore failed: ${errorMsg}`, 'error')
      }
    }
  }, [showToast])

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
    const fn = () => {
      if (isReadOnly) return
      handleSave(true)
    }
    const pdfFn = () => handleExportPDF()
    const wordFn = () => handleExportWord()

    window.addEventListener('force-save', fn)
    window.addEventListener('app:trigger-export-pdf', pdfFn)
    window.addEventListener('app:trigger-export-word', wordFn)

    // Listen for AI Insert requests
    const handleInsertText = (e) => {
      const textToInsert = e.detail?.text
      if (!textToInsert) return

      // Calculate insertion index from cursorPos (line/col)
      // Note: cursorPos is 1-based for line and col
      const currentLines = code.split('\n')
      let charIndex = 0
      for (let i = 0; i < Math.min(cursorPos.line - 1, currentLines.length); i++) {
        charIndex += currentLines[i].length + 1 // +1 for newline
      }
      charIndex += Math.min(cursorPos.col - 1, (currentLines[cursorPos.line - 1] || '').length)

      const newCode = code.slice(0, charIndex) + textToInsert + code.slice(charIndex)
      
      setCode(newCode)
      setIsDirty(true)
      showToast('Code inserted at cursor', 'success')
      
      // Attempt to refocus editor
      setTimeout(() => {
          const editorElement = document.querySelector('.cm-editor .cm-content')
          if (editorElement) editorElement.focus()
      }, 100)
    }
    window.addEventListener('app:insert-text', handleInsertText)

    return () => {
      window.removeEventListener('force-save', fn)
      window.removeEventListener('app:trigger-export-pdf', pdfFn)
      window.removeEventListener('app:trigger-export-word', wordFn)
      window.removeEventListener('app:insert-text', handleInsertText)
    }
  }, [handleSave, handleExportPDF, handleExportWord, isReadOnly, code, cursorPos, setCode, setIsDirty, showToast])

  return (
    <>
      {!isCreateMode && (!initialSnippet || !initialSnippet.id) && !hideWelcomePage ? (
        <WelcomePage onNewSnippet={onNew} />
      ) : (
        <div
          className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative SnippetEditor_root"
          style={{ backgroundColor: 'var(--editor-bg)' }}
        >
          {/* UI Compactness Overrides: Hyper-tightening the header for maximum code visibility */}
          <style>{`
            .EditorMetadataHeader_root {
              padding-top: 0.75rem !important;
              padding-bottom: 0.25rem !important;
              gap: 0.25rem !important;
              min-height: auto !important;
            }
            .title-input-container {
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            .title-input {
              padding-top: 0 !important;
              padding-bottom: 0 !important;
              margin: 0 !important;
              line-height: 1.2 !important;
            }
            .tags-container {
              margin-top: 0.25rem !important;
              padding: 0 !important;
              min-height: 20px !important;
              display: flex !important;
              align-items: center !important;
            }
            .cm-content {
              padding-bottom: 100px !important;
            }
            .cm-cursor {
              border-left-width: 2px !important;
            }
            .editor-container {
              contain: content !important;
              overflow-anchor: none !important;
            }
          `}</style>

          <div className="flex-1 min-h-0 overflow-hidden editor-container relative flex flex-col">
            {memoizedSplitPane}

            {!isReadOnlySnippet && !isDoc && (
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
                onGistSync={handleGistSync}
                onGistRestore={handleGistRestore}
                isFlow={isFlow}
              />
            )}
          </div>

          <StatusBar
            title={title}
            isFavorited={initialSnippet?.is_favorite === 1}
            isLargeFile={isLargeFile || code.length > 120000}
            stats={stats}
            line={cursorPos.line}
            col={cursorPos.col}
            selectionCount={selectionCount}
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
