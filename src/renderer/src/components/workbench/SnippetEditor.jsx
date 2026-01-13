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
import CodeEditor from '../../features/editor/ui/CodeEditor.jsx'
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
import WikiLink from '../WikiLink/WikiLink'

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
  const { theme: currentTheme } = useTheme()
  const { settings, getSetting, updateSetting } = useSettings()
  const isSystemSnippet = initialSnippet?.id === 'system:settings'
  const isDocSnippet = initialSnippet?.id?.startsWith('doc:')
  const hideWelcomePage = initialSnippet?.id
  const { zoomLevel } = useZoomLevel()
  
  const editorState = useEditorState({
    initialSnippet,
    isCreateMode,
    isReadOnly,
    showToast,
    onSave,
    snippets,
    onDirtyStateChange
  })

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

  // --- WIKILINK INTEGRATION ---
  const [wikiLinkExtensions, setWikiLinkExtensions] = useState([])

  // --- AUTO-TAGGING & IMMERSIVE SYNC ---
  // Since the Meta Header is removed, we automatically sync hashtags from text to DB
  useEffect(() => {
    if (!code || isReadOnly) return
    const extracted = extractTags(code)
    
    // Low-dependency check to avoid unnecessary state churn
    if (JSON.stringify(extracted) !== JSON.stringify(tags)) {
      internalSetTags(extracted)
    }
  }, [code, tags, internalSetTags, isReadOnly])

  // --- FLOW MODE BOOTSTRAP SYNC ---
  // Ensure Flow Preview gets content immediately, not just on the next keystroke.
  useEffect(() => {
    if (code) {
      window.dispatchEvent(new CustomEvent('app:code-update', { detail: { code } }))
    }
  }, [code, isFlow, settings?.ui?.showFlowMode])

  const handleSetTags = useCallback((val) => {
    const process = (t) => (Array.isArray(t) ? t : []).map(sanitizeTag).filter(Boolean)
    if (typeof val === 'function') {
      internalSetTags(prev => process(val(prev)))
    } else {
      internalSetTags(process(val))
    }
  }, [internalSetTags])

  const handleSetCurrentTagInput = useCallback((val) => {
    const clean = sanitizeTag(val)
    setCurrentTagInput(clean)
  }, [setCurrentTagInput])

  const onCodeChangeWrapper = useCallback((newCode) => {
    handleCodeChange(newCode)
    // ⚡ INSTANT BRIDGE: Ensures Ghost Preview (Flow Mode) is character-perfect
    window.dispatchEvent(new CustomEvent('app:code-update', { detail: { code: newCode } }))
  }, [handleCodeChange])

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

  useEffect(() => {
    const handleError = (e) => {
      if (e.message?.includes('ResizeObserver loop') || e.message?.includes('Measure loop restarted')) {
        if (e.stopImmediatePropagation) e.stopImmediatePropagation()
        return true
      }
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  const debouncedCodeForTags = useDebounce(code, 500)
  useEffect(() => {
    if (!debouncedCodeForTags) return
    const currentExtracted = extractTags(debouncedCodeForTags)
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
  const debouncedCodeForLang = useDebounce(code, 600)
  const detectedLang = useMemo(() => {
    const safeTitle = typeof title === 'string' ? title : ''
    const ext = safeTitle.includes('.') ? safeTitle.split('.').pop()?.toLowerCase() : null
    if (ext === 'md' || ext === 'markdown') return 'markdown'
    let lang = ext || 'markdown'
    const fastTrim = (code || '').substring(0, 10).trim()
    if (
      fastTrim.startsWith('#') || 
      fastTrim.startsWith('@') || 
      fastTrim.startsWith('- ') ||
      fastTrim.startsWith('* ') ||
      fastTrim.startsWith('```') ||
      fastTrim.startsWith('>')
    ) {
      return 'markdown'
    }
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
    onSave: handleOnSave,
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

  const {
    handleExportPDF,
    handleExportWord,
    handleCopyToClipboard,
    handleOpenExternalPreview,
    handleOpenMiniPreview
  } = editorExport

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
  const titleInputRef = useRef(null)
  const [justRenamed, setJustRenamed] = useState(false)
  const [isFloating, setIsFloating] = useState(() => settings?.ui?.modeSwitcher?.isFloating || false)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [selectionCount, setSelectionCount] = useState(0)
  const [activeMode, setActiveMode] = useState('live_preview')
  const [isLargeFile, setIsLargeFile] = useState(false)
  const textareaRef = useRef(null)
  const [pinPopover, setPinPopover] = useState({ visible: false, x: 0, y: 0 })
  const debouncedCode = useDebounce(code, 1000)
  const [namePrompt, setNamePrompt] = useState({ isOpen: false, initialName: '' })

  // --- KEYBOARD SHORTCUTS ---
  const handleEditorKeyDown = useCallback((e) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        e.stopPropagation()
        if (!isReadOnly) handleSave(true)
    }
  }, [handleSave, isReadOnly])

  const wordWrap = getSetting('editor.wordWrap') !== false
  const handleCursorChange = useCallback((pos) => {
    setCursorPos({ line: pos.line, col: pos.col })
    if (typeof pos.selectionCount === 'number') {
      setSelectionCount(pos.selectionCount)
    }
    if (typeof pos.scrollPercentage === 'number') {
      window.dispatchEvent(
        new CustomEvent('app:editor-scroll', {
          detail: { percentage: pos.scrollPercentage }
        })
      )
    }
  }, [])

  const onToggleCompactHandler = useCallback(() => {
    if (onToggleCompact) onToggleCompact()
  }, [onToggleCompact])

  const cycleMode = useCallback(() => {
    const modes = ['source', 'live_preview', 'reading']
    const currentMode = activeMode || 'live_preview'
    const nextMode = modes[(modes.indexOf(currentMode) + 1) % modes.length]
    setActiveMode(nextMode)
    window.dispatchEvent(new CustomEvent('app:mode-changed', { detail: { mode: nextMode } }))
  }, [activeMode])

  useEffect(() => {
    // Focused moved to CodeEditor autoFocus prop for a more "Pure Editor" experience
  }, [isCreateMode])

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

  const isDoc = String(initialSnippet?.id || '').startsWith('doc:') || 
                String(initialSnippet?.title || '').toLowerCase().includes('manual') ||
                String(initialSnippet?.title || '').toLowerCase().includes('documentation')
  const isReadOnlySnippet = !!(isReadOnly || initialSnippet?.readOnly || isDoc)

  useEffect(() => {
    const handleModeChange = (e) => {
      if (!isReadOnlySnippet) setActiveMode(e.detail.mode)
    }
    window.addEventListener('app:mode-changed', handleModeChange)
    return () => window.removeEventListener('app:mode-changed', handleModeChange)
  }, [isReadOnlySnippet])

  const stats = useMemo(() => {
    const chars = (code || '').length
    const words = (code || '').trim().split(/\s+/).filter(Boolean).length
    return { chars, words }
  }, [code])

  const handleGistSync = useCallback(async () => {
    try {
      showToast('☁️ Syncing with GitHub...', 'info')
      await window.api.syncBackup()
      showToast('✅ Gist backup successful', 'success')
    } catch (err) {
      showToast(`❌ Sync failed: ${err.message}`, 'error')
    }
  }, [showToast])

  const handleGistRestore = useCallback(async () => {
    if (!confirm('⚠️ This will OVERWRITE your local data with the GitHub backup. Are you sure?')) return
    try {
      showToast('☁️ Restoring from Gist...', 'info')
      await window.api.syncRestore()
      showToast('✅ Restore completed successfully', 'success')
    } catch (err) {
      showToast(`❌ Restore failed: ${err.message}`, 'error')
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
    const fn = () => { if (!isReadOnly) handleSave(true) }
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
  }, [handleSave, handleExportPDF, handleExportWord, isReadOnly])

  const editorStyle = useMemo(() => ({}), [])

  const memoizedPreview = useMemo(() => (
    <div className="h-full w-full p-0 flex justify-center bg-[var(--color-bg-primary)] overflow-hidden text-left items-stretch relative">
      <div className="w-full max-w-[850px] h-full shadow-sm flex flex-col">
        <LivePreview
          code={code}
          isReadOnly={isReadOnly || initialSnippet?.readOnly}
          initialSnippet={initialSnippet}
          onSettingsClick={onSettingsClick}
          isFlow={isFlow}
          snippets={snippets}
          enableScrollSync={getSetting('editor.scrollSync') !== false}
        />
      </div>
    </div>
  ), [code, isReadOnly, initialSnippet?.id, onSettingsClick, isFlow, snippets, getSetting])

  return (
    <>
      <div 
        className="h-full w-full flex flex-col bg-[var(--color-bg-primary)] overflow-visible relative z-50"
        style={editorStyle}
        data-snippet-id={initialSnippet?.id || 'new'}
      >
        <style>{` 
          .title-input-container { margin-bottom: 0 !important; padding-bottom: 0 !important; } 
          .title-input { padding-top: 0 !important; padding-bottom: 0 !important; margin: 0 !important; line-height: 1.2 !important; } 
          .tags-container { margin-top: 0.25rem !important; padding: 0 !important; min-height: 20px !important; display: flex !important; align-items: center !important; } 
          .editor-container { overflow-anchor: none !important; } 
          .cm-scroller { scrollbar-width: thin; scrollbar-color: var(--color-border) transparent; } 
        `}</style>
        <div className="flex-1 min-h-0 overflow-visible editor-container relative flex flex-col z-10">
          <AdvancedSplitPane
            rightHidden={!showPreview}
            unifiedScroll={false}
            overlayMode={settings?.livePreview?.overlayMode || false}
            left={
              <div className="h-full w-full relative bg-[var(--color-bg-primary)] overflow-visible flex flex-col">
                  {/* For System Settings, we might want to hide the header? 
                      Actually better to keep it consistent OR just hide if !id */}
                  <div className="flex-1 overflow-visible overflow-x-hidden flex flex-col">
                    <div className="w-full max-w-[850px] mx-auto flex flex-col relative text-left h-full">
                        {/* Meta Header Removed for "Pure Editor" experience - User Request */}
                        {/* {initialSnippet?.id && ( ... EditorMetadataHeader ... )} */}
                        
                        <div className="w-full flex flex-col bg-transparent border-none outline-none overflow-hidden min-h-[300px]">
                          <div className="flex-1 w-full flex flex-col min-h-0 bg-transparent relative">
                            <CodeEditor
                              value={code || ''} 
                              language={detectedLang}
                              mode={activeMode}
                              wordWrap={wordWrap}
                              theme={currentTheme}
                              centered={true}
                              autoFocus={true} // Priority focus on editor since title/tags are now inline
                              snippetId={initialSnippet?.id}
                              readOnly={isReadOnly || initialSnippet?.readOnly || false}
                              onChange={onCodeChangeWrapper}
                              onLargeFileChange={setIsLargeFile}
                              onKeyDown={handleEditorKeyDown}
                              snippets={snippets} 
                              extensions={wikiLinkExtensions}
                              style={editorStyle}
                              height="100%"
                              className="flex-1 h-full"
                              textareaRef={textareaRef}
                              zenFocus={settings?.ui?.zenFocus}
                              onCursorChange={handleCursorChange}
                            />
                          </div>
                        </div>
                    </div>
                  </div>
              </div>
            }
            right={memoizedPreview}
          />

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
          words={stats.words}
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

        {/* WikiLink & Smart Preview Manager */}
        <WikiLink 
          snippets={snippets} 
          onSave={onSave} 
          showToast={showToast} 
          handleNav={(id) => window.dispatchEvent(new CustomEvent('app:navigate-to-snippet', { detail: { id } }))}
          onExtensionsReady={setWikiLinkExtensions}
        />
      </div>
    </>
  )
}

SnippetEditor.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialSnippet: PropTypes.object,
  onCancel: PropTypes.func,
  onNew: PropTypes.func,
  onDelete: PropTypes.func,
  isCreateMode: PropTypes.bool,
  activeView: PropTypes.string,
  onSettingsClick: PropTypes.func,
  onAutosave: PropTypes.func,
  showToast: PropTypes.func,
  isCompact: PropTypes.bool,
  onToggleCompact: PropTypes.func,
  showPreview: PropTypes.bool,
  snippets: PropTypes.array,
  onPing: PropTypes.func,
  onFavorite: PropTypes.func,
  isFlow: PropTypes.bool,
  onDirtyStateChange: PropTypes.func,
  isReadOnly: PropTypes.bool
}

export default React.memo(SnippetEditor)
