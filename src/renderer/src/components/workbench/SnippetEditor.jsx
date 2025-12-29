import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { GripVertical } from 'lucide-react'
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
import { makeDraggable } from '../../utils/draggable.js'
import UniversalModal from '../universal/UniversalModal'
import { useUniversalModal } from '../universal/useUniversalModal'
import '../universal/universalStyle.css'

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
  const { settings, getSetting, updateSetting } = useSettings()
  const { currentTheme } = useTheme()

  const [title, setTitle] = useState(initialSnippet?.title || '')
  const [justRenamed, setJustRenamed] = useState(false)
  const [isFloating, setIsFloating] = useState(
    () => settings?.ui?.modeSwitcher?.isFloating || false
  )
  const switcherRef = useRef(null)
  const dragHandleRef = useRef(null)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [activeMode, setActiveMode] = useState('live_preview')

  const {
    isOpen: isUniOpen,
    title: uniTitle,
    content: uniContent,
    footer: uniFooter,
    closeModal: closeUni,
    openModal
  } = useUniversalModal()

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
  }, [activeMode])

  // Listen for Source Modal requests from richMarkdown extension
  useEffect(() => {
    const handleSourceModal = (e) => {
      const { view, from, to, initialCode } = e.detail
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
              autoFocus
            />
          </div>
        ),
        footer: (
          <button
            className="cm-md-modal-save"
            onClick={() => {
              const newCode = currentInput
              let finalCode = newCode
              const oldSlice = view.state.doc.sliceString(from, to)

              if (oldSlice.startsWith('```mermaid')) {
                finalCode = '```mermaid\n' + newCode.trim() + '\n```'
              } else if (oldSlice.startsWith('```')) {
                const match = oldSlice.match(/^```(\w*)/)
                const lang = match ? match[1] : ''
                finalCode = '```' + lang + '\n' + newCode.trim() + '\n```'
              }

              // Suppress any immediate re-opening of the source modal that
              // could be triggered by the editor re-render or focus handlers
              // after applying changes.
              window.__suppressNextSourceModal = true

              view.dispatch({
                changes: { from, to, insert: finalCode },
                userEvent: 'input.source.modal'
              })

              closeUni()
            }}
          >
            Apply Changes
          </button>
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
    if (window.api?.invoke) {
      // Assuming there's a mini preview API, fallback to external if not
      await window.api.invoke('shell:previewInMiniBrowser', fullHtml).catch(() => {
        // Fallback to external preview
        return window.api.invoke('shell:previewInBrowser', fullHtml)
      })
    }
  }, [generateFullHtml])

  // Helper function to pre-render Mermaid diagrams for Word export
  const preRenderMermaidDiagrams = useCallback(async (html) => {
    // Defensive mermaid rendering pipeline.
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html || ''

    // Remove any embedded scripts/styles to avoid executing app code here
    tempDiv.querySelectorAll('script, style, link').forEach((n) => n.remove())

    // Find mermaid containers produced by markdown or direct mermaid blocks
    const mermaidDivs = tempDiv.querySelectorAll('div.mermaid, div.mermaid-diagram')
    if (!mermaidDivs || mermaidDivs.length === 0) return tempDiv.innerHTML

    // Lazy-init mermaid instance and cache it on window to avoid re-init
    let mermaidInstance = window.__mermaidExportInstance || window.mermaid
    if (!mermaidInstance) {
      try {
        mermaidInstance = (await import('mermaid')).default
        mermaidInstance.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: settings?.editor?.fontFamily || 'Inter, sans-serif',
          themeVariables: { fontFamily: settings?.editor?.fontFamily || 'Inter, sans-serif', fontSize: '14px' }
        })
        window.__mermaidExportInstance = mermaidInstance
      } catch (err) {
        console.warn('Mermaid import failed:', err)
        return tempDiv.innerHTML
      }
    }

    // Helper to decode HTML entities produced by escaped content
    const decodeEntities = (str) => {
      const txt = document.createElement('textarea')
      txt.innerHTML = str
      return txt.value
    }

    for (const div of Array.from(mermaidDivs)) {
      try {
        // Prefer innerHTML decoding, fall back to textContent
        const raw = div.innerHTML && div.innerHTML.trim() ? div.innerHTML : div.textContent || ''
        const mermaidCode = decodeEntities(raw).trim()
        if (!mermaidCode) continue

        const id = `mermaid-export-${Math.random().toString(36).slice(2, 9)}`
        // mermaid.render sometimes returns svg string or object depending on version
        const renderResult = await mermaidInstance.render(id, mermaidCode)
        const svg = (renderResult && renderResult.svg) || renderResult || ''
        if (!svg || svg.length < 20) throw new Error('empty svg')

        const svgContainer = document.createElement('div')
        svgContainer.innerHTML = svg
        const svgElement = svgContainer.querySelector('svg')
        if (!svgElement) throw new Error('no svg element')

        // Apply safe inline sizing and color resets
        svgElement.setAttribute('role', 'img')
        svgElement.style.maxWidth = '100%'
        svgElement.style.height = 'auto'
        svgElement.style.display = 'block'
        svgElement.style.margin = '1.2em auto'
        svgElement.style.background = 'white'
        svgElement.querySelectorAll('text').forEach((t) => (t.style.fill = '#000'))

        div.replaceWith(svgElement)
      } catch (err) {
        console.warn('Mermaid render failed for a diagram, leaving source as code block', err)
        // Replace with a safe code block to preserve readability
        const pre = document.createElement('pre')
        pre.textContent = div.textContent || div.innerText || ''
        div.replaceWith(pre)
      }
    }

    return tempDiv.innerHTML
  }, [settings?.editor?.fontFamily])

  // Sanitize and rebuild a minimal, print-ready HTML wrapper to avoid app CSS leakage
  const sanitizeExportHtml = useCallback((html) => {
    try {
      const temp = document.createElement('div')
      temp.innerHTML = html || ''

      // Remove scripts/styles and external links
      temp.querySelectorAll('script, style, link').forEach((n) => n.remove())

      // Remove UI artifacts from preview
      temp.querySelectorAll('.preview-intel, .code-actions, .copy-code-btn, .ui-element, .preview-engine-toolbar').forEach((n) => n.remove())

      // Extract main content element
      const contentElement = temp.querySelector('#content') || temp.querySelector('body') || temp
      if (!contentElement) return html

      // Strip classes/ids/styles to avoid accidental styling inheritance
      Array.from(contentElement.querySelectorAll('*')).forEach((el) => {
        if (el === contentElement) return
        el.removeAttribute('class')
        el.removeAttribute('id')
        el.removeAttribute('style')
      })

      const contentHtml = contentElement.innerHTML || ''

      const printCss = `
        @page { margin: 1.2in; size: letter; }
        html, body { background: white; color: #000; font-family: ${settings?.editor?.fontFamily || "Inter, sans-serif"}; margin: 0; padding: 0; }
        .preview-container { max-width: 6.5in; margin: 0 auto; padding: 20px; box-sizing: border-box; }
        img, svg { max-width: 100%; height: auto; }
        pre { background: #fafafa; border: 1px solid #e1e5e9; padding: 12px; overflow-x: auto; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d1d5db; padding: 8px; }
      `

      const titleSafe = (title || 'snippet').replace(/[^a-z0-9]/gi, '_').toLowerCase()
      return `<!doctype html><html><head><meta charset="utf-8"><title>${titleSafe}</title><style>${printCss}</style></head><body><div id="content" class="preview-container">${contentHtml}</div></body></html>`
    } catch (err) {
      console.warn('Sanitize export HTML failed, falling back to original HTML', err)
      return html
    }
  }, [settings?.editor?.fontFamily, title])

  const handleCopyToClipboard = useCallback(async () => {
    try {
      // Generate HTML and pre-render diagrams first
      let fullHtml = await generateFullHtml(false)
      if (fullHtml && (fullHtml.includes('class="mermaid"') || fullHtml.includes('class="mermaid-diagram"'))) {
        fullHtml = await preRenderMermaidDiagrams(fullHtml)
      }

      // Sanitize to remove scripts/styles/UI chrome
      fullHtml = sanitizeExportHtml(fullHtml)

      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = fullHtml
      const contentDiv = tempDiv.querySelector('#content') || tempDiv
      if (!contentDiv) throw new Error('No content to copy')

      // Remove remaining interactive elements
      contentDiv.querySelectorAll('.copy-code-btn, .ui-element, .code-actions').forEach((n) => n.remove())

      // Remove specific headings we don't want copied
      contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
        const t = (el.textContent || '').trim().toLowerCase()
        if (t.includes('start frontend') || t.includes('untitled')) el.remove()
      })

      const htmlContent = contentDiv.innerHTML
      let textContent = (contentDiv.textContent || contentDiv.innerText || '').trim()

      // Clean markdown-like artifacts from plaintext
      textContent = textContent
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/^\s*#{1,6}\s+/gm, '')
        .trim()

      // Try rich clipboard API first, fallback to plain text
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([htmlContent], { type: 'text/html' }),
              'text/plain': new Blob([textContent], { type: 'text/plain' })
            })
          ])
        } else {
          // Older fallback: write plain text only
          await navigator.clipboard.writeText(textContent || code)
        }
        showToast?.('Rendered content copied to clipboard!', 'success')
      } catch (err) {
        // Best-effort fallback
        await navigator.clipboard.writeText(textContent || code)
        showToast?.('Rendered content copied to clipboard (plaintext)', 'info')
      }
    } catch (err) {
      console.error('Copy to clipboard failed:', err)
      try {
        await navigator.clipboard.writeText(code)
        showToast?.('Code copied to clipboard!', 'info')
      } catch (fallbackErr) {
        showToast?.('Failed to copy to clipboard', 'error')
      }
    }
  }, [generateFullHtml, preRenderMermaidDiagrams, sanitizeExportHtml, code, showToast])

  const handleExportPDF = useCallback(async () => {
    try {
      // Generate HTML specifically optimized for PDF (rendered markdown)
      let fullHtml = await generateFullHtml(true) // true for print
      
      // Pre-render Mermaid diagrams to SVG for PDF export
      if (fullHtml.includes('class="mermaid"')) {
        fullHtml = await preRenderMermaidDiagrams(fullHtml)
      }
      
      if (window.api?.invoke) {
        const sanitizedTitle = (title || 'snippet').replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const success = await window.api.invoke('export:pdf', fullHtml, sanitizedTitle)
        if (success) {
          showToast?.('Snippet exported to PDF successfully!', 'success')
        } else {
          console.log('PDF Export was cancelled or failed internally.')
        }
      }
    } catch (err) {
      console.error('PDF Export Error:', err)
      showToast?.('Failed to export PDF. Please check the logs.', 'error')
    }
  }, [generateFullHtml, title, showToast, preRenderMermaidDiagrams])

  const handleExportWord = useCallback(async () => {
    try {
      // Generate HTML optimized for Word (rendered markdown)
      // Use print-optimized HTML for Word export to avoid including app CSS
      let fullHtml = await generateFullHtml(true) // true for print/export
      
      // For Word export, handle Mermaid diagrams differently
      if (fullHtml.includes('class="mermaid"')) {
        // For Word, we'll keep Mermaid as code blocks since html-to-docx may not handle SVG well
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = fullHtml
        
        const mermaidDivs = tempDiv.querySelectorAll('div.mermaid, div.mermaid-diagram')
        mermaidDivs.forEach(div => {
          // Try to extract Mermaid code from the original source
          const extractMermaidCode = (code) => {
            const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g
            const matches = []
            let match
            while ((match = mermaidRegex.exec(code)) !== null) {
              matches.push(match[1].trim())
            }
            return matches
          }
          
          const mermaidBlocks = extractMermaidCode(code)
          let mermaidIndex = 0
          
          const mermaidCode = div.textContent.trim()
          if (mermaidCode) {
            // Replace with a formatted code block that preserves Mermaid formatting
            const codeBlock = document.createElement('pre')
            codeBlock.style.cssText = `
              background: #f6f8fa;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 1em;
              margin: 1em 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              white-space: pre-wrap;
              word-wrap: break-word;
              color: #24292f;
              overflow-x: auto;
            `
            
            // Format the Mermaid code properly
            const formattedCode = mermaidCode
              .split('\n')
              .map(line => line.trimEnd()) // Remove trailing spaces but keep indentation
              .join('\n')
              .trim()
            
            codeBlock.textContent = `mermaid\n${formattedCode}`
            div.parentNode.replaceChild(codeBlock, div)
          }
        })
        
        fullHtml = tempDiv.innerHTML
      }
      
      if (window.api?.invoke) {
        const sanitizedTitle = (title || 'snippet').replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const success = await window.api.invoke('export:word', fullHtml, sanitizedTitle)
        if (success) {
          showToast?.('Snippet exported to Word successfully!', 'success')
        } else {
          showToast?.('Word export was cancelled or failed.', 'error')
        }
      }
    } catch (err) {
      console.error('Word Export Error:', err)
      showToast?.('Failed to export Word. Please check the logs.', 'error')
    }
  }, [generateFullHtml, code, title, showToast])

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
    },
    onToggleMode: cycleMode,
    onCopyToClipboard: handleCopyToClipboard
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
  }, [code, title, initialSnippet, handleExportPDF, handleExportWord, handleCopyToClipboard])

  return (
    <>
      {!isCreateMode && (!initialSnippet || !initialSnippet.id) && !hideWelcomePage ? (
        <WelcomePage onNewSnippet={onNew} />
      ) : (
        <div className="h-full overflow-hidden flex flex-col items-stretch relative fade-in">
          <div className="flex-1 min-h-0 overflow-hidden editor-container relative flex">
            <AdvancedSplitPane
              rightHidden={!showPreview}
              unifiedScroll={false}
              overlayMode={settings?.livePreview?.overlayMode || false}
              left={
                <div ref={editorContainerRef} className="w-full h-full flex justify-center">
                  <div className="w-full h-full relative">
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
                      onCursorChange={setCursorPos}
                    />
                  </div>
                </div>
              }
              right={
                <div
                  className="h-full w-full p-0 flex justify-center bg-[var(--color-bg-primary)] cursor-text overflow-y-auto text-left items-start"
                  onDoubleClick={() => {
                    // Disable "Double click to edit" in strictly Reading Mode
                    if (activeMode === 'reading') return

                    // "Double click to edit" behavior for Live Preview
                    // Dispatching the toggle event to revert/switch state.
                    window.dispatchEvent(new CustomEvent('app:toggle-preview'))
                  }}
                >
                  <div className="w-full max-w-[850px] min-h-full shadow-sm py-8 px-8">
                    {useMemo(() => {
                      const safeTitle = typeof title === 'string' ? title : ''
                      const ext = safeTitle.includes('.')
                        ? safeTitle.split('.').pop()?.toLowerCase()
                        : null

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

            <div
              ref={switcherRef}
              className={`cm-editor-mode-switcher ${
                isFloating ? 'is-floating' : ''
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {/* Drag Handle - Only show if draggable is enabled AND currently floating */}
              {isFloating &&
                !settings?.ui?.modeSwitcher?.disableDraggable &&
                !settings?.ui?.universalLock?.modal && (
                  <div
                    ref={dragHandleRef}
                    className="cm-mode-item"
                    title="Drag to move"
                    onClick={(e) => {
                      // Prevent click propagation to avoid triggering adjacent logic if any
                      e.stopPropagation()
                    }}
                    onMouseDown={(e) => {
                      // Prevent focus stealing for smoother drag start
                      e.preventDefault()
                    }}
                    style={{
                      cursor: isFloating ? 'move' : 'default',
                      opacity: isFloating ? 1 : 0.3
                    }}
                  >
                    <GripVertical size={14} />
                  </div>
                )}

              {/* Pin/Float Toggle - Only show if draggable is enabled */}
              {!settings?.ui?.modeSwitcher?.disableDraggable &&
                !settings?.ui?.universalLock?.modal && (
                  <button
                    className="cm-mode-item"
                    onClick={(e) => {
                      e.currentTarget.blur() // Remove focus ring to avoid confusion with active state
                      if (switcherRef.current) {
                        switcherRef.current.style.top = ''
                        switcherRef.current.style.left = ''
                        switcherRef.current.style.bottom = ''
                        switcherRef.current.style.right = ''
                        switcherRef.current.style.margin = ''
                      }
                      const newState = !isFloating
                      setIsFloating(newState)
                      updateSetting('ui.modeSwitcher.isFloating', newState)
                    }}
                  >
                    {isFloating ? (
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10V4a2 2 0 0 0-2-2h-6"></path>
                        <path d="M3 14v6a2 2 0 0 0 2 2h6"></path>
                        <path d="M16 2l6 6"></path>
                        <path d="M2 16l6 6"></path>
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"></path>
                      </svg>
                    )}
                  </button>
                )}
              <div className="cm-mode-divider"></div>

              {[
                {
                  id: 'source',
                  label: 'Source',
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                  )
                },
                {
                  id: 'live_preview',
                  label: 'Live',
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )
                },
                {
                  id: 'reading',
                  label: 'Read',
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  )
                }
              ].map((m) => (
                <button
                  key={m.id}
                  className={`cm-mode-btn ${activeMode === m.id ? 'is-active' : ''}`}
                  title={`${m.label} Mode`}
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('app:set-editor-mode', { detail: { mode: m.id } })
                    )
                  }}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <StatusBar
            title={title}
            isFavorited={initialSnippet?.is_favorite === 1}
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

          <UniversalModal
            key={settings?.ui?.universalModal?.disableDrag ? 'locked' : 'draggable'}
            isOpen={isUniOpen}
            onClose={closeUni}
            title={uniTitle}
            footer={uniFooter}
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
