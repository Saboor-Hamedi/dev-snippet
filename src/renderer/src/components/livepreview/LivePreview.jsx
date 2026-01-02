import React, { useMemo, useRef, useEffect, useState, useCallback, useContext } from 'react'
import PropTypes from 'prop-types'
import { useSettings } from '../../hook/useSettingsContext'
import { Smartphone, Tablet, Monitor, Layers } from 'lucide-react'
import { SplitPaneContext } from '../splitPanels/SplitPaneContext'
import { markdownToHtml, codeToHtml } from '../../utils/markdownParser'
import { useMarkdownWorker } from '../../hook/useMarkdownWorker'
import previewStyles from '../../assets/preview.css?raw'
import markdownStyles from '../../assets/markdown.css?raw'
import variableStyles from '../../assets/variables.css?raw'
import mermaidStyles from '../mermaid/mermaid.css?raw'
import { getMermaidConfig } from '../mermaid/mermaidConfig'
import { getMermaidEngine } from '../mermaid/mermaidEngine'
import { useMermaidCapture } from '../mermaid/hooks/useMermaidCapture'

import { themes } from '../preference/theme/themes'
import { useModal } from '../workbench/manager/ModalContext'
import useAdvancedSplitPane from '../splitPanels/useAdvancedSplitPane.js'
import ShadowSurface from '../preview/ShadowSurface'

/**
 * LivePreview - High-Performance Shadow DOM Rendering Engine.
 * Manages the asynchronous parsing of Markdown/Mermaid and synchronizes
 * the rendered output within a secure, isolated Shadow DOM boundary.
 */
const LivePreview = ({
  code = '',
  language = 'markdown',
  snippets = [],
  theme = 'midnight-pro',
  disabled = false,
  fontFamily = "'Outfit', 'Inter', sans-serif",
  onOpenExternal,
  onOpenMiniPreview,
  onExportPDF,
  showHeader = true,
  enableScrollSync = false,
  fontSize = null,
  zenFocus = false
}) => {
  // --- Refs & Context ---
  const lastScrollPercentage = useRef(0)
  const splitContext = useContext(SplitPaneContext)
  const { overlayMode: isOverlay, setOverlayMode: setOverlay } = useAdvancedSplitPane()
  const { settings } = useSettings()

  // --- State ---
  const [renderedHtml, setRenderedHtml] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const shadowContentRef = useRef(null)
  const lastRenderedConfig = useRef('')
  const isRendering = useRef(false)

  // --- Derived Memos ---
  const existingTitles = useMemo(() => {
    return (snippets || []).map((s) => (s.title || '').trim()).filter(Boolean)
  }, [snippets])

  const isDark = useMemo(() => {
    return !['polaris', 'minimal-gray', 'latte', 'solar-dawn', 'quiet-light'].includes(theme)
  }, [theme])

  // --- Specialized Hooks ---
  const { handleQuickCopyMermaid } = useMermaidCapture(fontFamily)
  const { openImageExportModal } = useModal()
  const { parseMarkdown: parseMarkdownWorker, parseCode: parseCodeWorker, isParsing: isWorkerParsing } = useMarkdownWorker()

  // --- 1. Parsing Engine (Smart Conditional: Inline for Small, Worker for Large) ---
  useEffect(() => {
    let active = true
    let timeoutId = null

    const parse = async () => {
      if (disabled || code === undefined || code === null) {
        setRenderedHtml('')
        return
      }

      // PERFORMANCE GUARD: Skip if window is dragging
      if (document.body.classList.contains('dragging-active')) return

      try {
        const normalizedLang = (language || 'markdown').toLowerCase()
        // Aggressive truncation for zero-jank typing
        // 100k chars is roughly 20 pages of text, sufficient for preview context
        const LIMIT = 100000
        const isTooLarge = (code || '').length > LIMIT
        const visibleCode = isTooLarge ? code.slice(0, LIMIT) : code || ''
        let result = ''

        if (normalizedLang === 'markdown' || normalizedLang === 'md') {
          // SMART CONDITIONAL PARSING
          // < 10k: inline (instant feedback, no worker overhead)
          // >= 10k: worker (non-blocking for large files)
          const codeLength = visibleCode.length
          if (codeLength < 10000) {
            result = await markdownToHtml(visibleCode, {
              renderMetadata: showHeader,
              titles: existingTitles
            })
          } else {
            // Use worker for medium/large files
            result = await parseMarkdownWorker(visibleCode, {
              renderMetadata: showHeader,
              titles: existingTitles
            })
          }
          
          if (isTooLarge && result) {
            result +=
              '<div class="preview-performance-notice">Preview truncated for performance.</div>'
          }
        } else {
          // Code blocks: inline for small, worker for large
          const codeLength = visibleCode.length
          if (codeLength < 10000) {
            result = await codeToHtml(visibleCode, normalizedLang)
          } else {
            result = await parseCodeWorker(visibleCode, normalizedLang)
          }
        }

        if (active && result) setRenderedHtml(result)
      } catch (err) {
        console.error('Parsing error:', err)
      }
    }

    // --- DEBOUNCE LOGIC (Size-Aware) ---
    // Small files: 150ms (instant feedback)
    // Medium files (10k-50k): 200ms (balance speed and responsiveness)
    // Large files (50k+): 500ms (prevent CPU saturation)
    const codeLength = (code || '').length
    let debounceMs = 150
    if (codeLength > 50000) {
      debounceMs = 500
    } else if (codeLength > 10000) {
      debounceMs = 200
    }
    
    timeoutId = setTimeout(parse, debounceMs)

    return () => {
      active = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [code, language, showHeader, existingTitles, disabled, parseMarkdownWorker, parseCodeWorker])

  // Sync isParsing state from worker hook
  useEffect(() => {
    setIsParsing(isWorkerParsing)
  }, [isWorkerParsing])

  // --- 2. Style Merging (DRY Token Engine) ---
  const combinedStyles = useMemo(() => {
    const currentThemeObj = themes.find((t) => t.id === theme) || themes[0]
    const cssVars = Object.entries(currentThemeObj.colors)
      .filter(([key]) => key.startsWith('--'))
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n')

    const themeVars = `:root, .shadow-wrapper {
      ${cssVars}
      --editor-font-size: ${((fontSize || settings.editor?.fontSize || 14) * 1) / 16}rem;
      --font-sans: ${fontFamily}, sans-serif;
    }`

    return `${variableStyles}\n${themeVars}\n${previewStyles}\n${markdownStyles}\n${mermaidStyles}\n.markdown-body { padding-bottom: 5rem !important; }`
  }, [theme, fontFamily, settings.editor?.fontSize])

  // --- 3. Shadow DOM Event Pipeline ---
  const handleShadowClick = useCallback(
    (e) => {
      // 0. Shadow DOM Retargeting Fix: use composedPath to find elements inside the shadow root
      const path = e.nativeEvent.composedPath()
      const target = path[0]

      // 1. Copy Code/Image
      const btn = target.closest('.copy-code-btn') || target.closest('.copy-image-btn')
      if (btn) {
        let raw = ''
        try {
          raw = decodeURIComponent(btn.dataset.code)
        } catch {
          raw = btn.dataset.code
        }

        const type = btn.classList.contains('copy-code-btn') ? 'copy-text' : 'copy-image'

        if (type === 'copy-text') {
          navigator.clipboard.writeText(raw)
        } else {
          const lang = btn.dataset.lang || 'text'
          if (lang === 'mermaid') {
            handleQuickCopyMermaid(raw)
          } else {
            openImageExportModal({
              title: 'Code Snippet',
              code: raw,
              language: lang
            })
          }
        }

        // Visual Feedback
        const oldHtml = btn.innerHTML
        btn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
        setTimeout(() => {
          btn.innerHTML = oldHtml
        }, 2000)
        return
      }

      // 2. Open Snippet (QuickLink)
      const quickLink = target.closest('.preview-quicklink')
      if (quickLink) {
        window.dispatchEvent(
          new CustomEvent('app:open-snippet', {
            detail: { title: quickLink.dataset.title }
          })
        )
        return
      }

      // 3. Anchors
      const link = target.closest('a')
      if (link) {
        const href = link.getAttribute('href')
        if (!href) return

        if (href.startsWith('#')) {
          e.preventDefault()
          const targetId = decodeURIComponent(href.substring(1))
          const element = shadowContentRef.current?.querySelector(`[id="${targetId}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        } else if (href.startsWith('http') || href.startsWith('mailto:')) {
          e.preventDefault()
          if (window.api && window.api.openExternal) window.api.openExternal(href)
          else window.open(href, '_blank')
        }
      }
    },
    [handleQuickCopyMermaid, openImageExportModal]
  )

  // --- 4. Shadow Rendering Callback (Mermaid & Logic) ---
  const onShadowRender = useCallback(
    (shadowRoot, contentContainer) => {
      shadowContentRef.current = contentContainer

      // 1. Initial Scroll Preservation
      if (typeof lastScrollPercentage.current === 'number') {
        requestAnimationFrame(() => {
          const scrollTarget =
            (contentContainer.scrollHeight - contentContainer.clientHeight) *
            lastScrollPercentage.current
          contentContainer.scrollTop = scrollTarget
        })
      }

      // 2. Mermaid Diagram Initialization (Robust Shadow DOM Bridge)
      if (renderedHtml.includes('class="mermaid"')) {
        const nodes = contentContainer.querySelectorAll('.mermaid')
        if (nodes.length > 0 && !isRendering.current) {
          isRendering.current = true

          // 0. GLOBAL PERFORMANCE GUARD: Skip rendering if dragging is active
          if (document.body.classList.contains('dragging-active')) {
            isRendering.current = false
            return
          }

          requestAnimationFrame(async () => {
            // Re-check inside RAF just in case
            if (document.body.classList.contains('dragging-active')) {
              isRendering.current = false
              return
            }

            try {
              // 1. Setup Bridge
              let bridge = document.getElementById('mermaid-render-bridge')
              if (!bridge) {
                bridge = document.createElement('div')
                bridge.id = 'mermaid-render-bridge'
                bridge.style.cssText =
                  'position:absolute;left:-9999px;top:-9999px;visibility:hidden;width:1200px;'
                document.body.appendChild(bridge)
              }

              // 2. Load and Refresh Config
              const { default: mermaid } = await import('mermaid')
              mermaid.initialize({
                ...getMermaidConfig(isDark, fontFamily),
                startOnLoad: false,
                securityLevel: 'loose'
              })

              const currentConfig = `${theme}-${fontFamily}`
              const forceReRender = lastRenderedConfig.current !== currentConfig
              lastRenderedConfig.current = currentConfig

              const targetNodes = Array.from(nodes).filter(
                (n) => forceReRender || !n.getAttribute('data-processed')
              )

              // 3. Sequential Render Cycle
              for (const node of targetNodes) {
                const id = `mermaid-sv-${Math.random().toString(36).substring(2, 9)}`
                const encodedSrc = node.getAttribute('data-mermaid-src')
                const rawCode = encodedSrc
                  ? decodeURIComponent(encodedSrc)
                  : node.textContent.trim()

                if (!rawCode) continue

                try {
                  // We use a fresh element for EACH render to avoid bridge collision errors
                  const tempContainer = document.createElement('div')
                  bridge.appendChild(tempContainer)

                  const { svg } = await mermaid.render(id, rawCode, tempContainer)
                  node.innerHTML = svg
                  node.setAttribute('data-processed', 'true')

                  // Entrance animation
                  node.style.opacity = '0'
                  requestAnimationFrame(() => {
                    node.style.transition = 'opacity 0.4s ease'
                    node.style.opacity = '1'
                  })
                } catch (renderErr) {
                  console.error('Mermaid individual render failure:', renderErr)
                  node.setAttribute('data-processed', 'error')
                  node.innerHTML = `<div style="color: #ef4444; font-size: 11px; padding: 12px; border: 1px solid #ef444433; border-radius: 0; background: rgba(239, 68, 68, 0.05);">Mermaid Error: check diagram syntax</div>`
                } finally {
                  // Carefully clear ONLY this render's bridge content
                  bridge.innerHTML = ''
                }
              }
            } catch (globalErr) {
              console.error('Mermaid global render failure:', globalErr)
            } finally {
              isRendering.current = false
            }
          })
        }
      }
    },
    [renderedHtml, isDark, fontFamily, theme]
  )

  // --- 4. Scroll Synchronization Logic ---
  useEffect(() => {
    if (!enableScrollSync) return

    let rafId = null
    const handleSync = (e) => {
      const percentage = e.detail?.percentage
      if (typeof percentage !== 'number') return

      lastScrollPercentage.current = percentage

      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const container = shadowContentRef.current
        if (container) {
          const scrollTarget = (container.scrollHeight - container.clientHeight) * percentage
          container.scrollTo({ top: scrollTarget, behavior: 'instant' })
        }
        rafId = null
      })
    }

    window.addEventListener('app:editor-scroll', handleSync)
    return () => {
      window.removeEventListener('app:editor-scroll', handleSync)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [enableScrollSync])

  // --- 5. Main Render Output ---
  return (
    <div className="w-full h-full flex flex-col bg-transparent overflow-hidden live-preview-container">
      {showHeader && (
        <div
          className="flex items-center justify-between px-3 py-2 z-10 sticky top-0 transition-colors duration-300 overflow-x-auto"
          style={{
            backgroundColor: 'var(--header-bg, var(--color-bg-secondary))',
            color: 'var(--header-text, var(--color-text-primary))',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setOverlay(!isOverlay)}
              className={`w-7 h-7 flex items-center justify-center rounded-none transition-all ${isOverlay ? 'bg-[var(--color-accent-primary)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100'}`}
              title={isOverlay ? 'Switch to Split View' : 'Switch to Overlay Mode'}
            >
              <Layers size={14} />
            </button>

            {!isOverlay && (
              <span className="text-[10px] font-bold tracking-widest select-none uppercase opacity-50 pl-1">
                PREVIEW
              </span>
            )}
            {isOverlay && splitContext && (
              <div className="flex items-center gap-1 h-4 ml-1">
                <button
                  onClick={() => splitContext.setOverlayWidth(25)}
                  className={`p-1 rounded-none transition-colors ${splitContext.overlayWidth === 25 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                  title="Phone View"
                >
                  <Smartphone size={14} />
                </button>
                <button
                  onClick={() => splitContext.setOverlayWidth(50)}
                  className={`p-1 rounded-none transition-colors ${splitContext.overlayWidth === 50 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                  title="Tablet View"
                >
                  <Tablet size={14} />
                </button>
                <button
                  onClick={() => splitContext.setOverlayWidth(75)}
                  className={`p-1 rounded-none transition-colors ${splitContext.overlayWidth === 75 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                  title="Desktop View"
                >
                  <Monitor size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
            <button
              onClick={onOpenMiniPreview}
              className="w-7 h-7 rounded-none hover:bg-[var(--hover-bg)] text-[var(--color-text-primary)] flex items-center justify-center transition-opacity hover:opacity-70"
              title="Pop out Mini Preview"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <line x1="15" x2="15" y1="3" y2="21" />
              </svg>
            </button>
            <button
              onClick={onOpenExternal}
              className="w-7 h-7 rounded-none hover:bg-[var(--hover-bg)] text-[var(--color-text-primary)] flex items-center justify-center transition-opacity hover:opacity-70"
              title="Open in System Browser"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (onExportPDF) onExportPDF()
                else if (window.api?.exportPDF) window.api.exportPDF()
                else window.print()
              }}
              className="px-2 py-1 rounded-none bg-blue-500 text-white text-[10px] font-bold"
            >
              Export
            </button>
          </div>
        </div>
      )}
      <div
        className="flex-1 w-full min-h-0 relative live-preview-scroller-container"
        style={{ backgroundColor: isDark ? 'transparent' : '#ffffff' }}
        onClick={handleShadowClick}
      >
        <ShadowSurface
          html={renderedHtml}
          styles={combinedStyles}
          onRender={onShadowRender}
          isDark={isDark}
          zenFocus={zenFocus}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

LivePreview.propTypes = {
  code: PropTypes.string,
  language: PropTypes.string,
  snippets: PropTypes.array,
  theme: PropTypes.string,
  disabled: PropTypes.bool,
  fontFamily: PropTypes.string,
  onOpenExternal: PropTypes.func,
  onOpenMiniPreview: PropTypes.func,
  onExportPDF: PropTypes.func,
  enableScrollSync: PropTypes.bool,
  showHeader: PropTypes.bool,
  fontSize: PropTypes.number
}

export default React.memo(LivePreview)
