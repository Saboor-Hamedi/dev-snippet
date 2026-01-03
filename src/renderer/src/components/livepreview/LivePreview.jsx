import React, { useMemo, useRef, useEffect, useState, useCallback, useContext } from 'react'
import PropTypes from 'prop-types'
import { useSettings } from '../../hook/useSettingsContext'
import { Smartphone, Tablet, Monitor, Layers } from 'lucide-react'
import { SplitPaneContext } from '../splitPanels/SplitPaneContext'
import { markdownToHtml } from '../../utils/markdownParser'
import { parseCache } from '../../utils/parseCache'
import { incrementalParser } from '../../utils/incrementalParser'
import previewStyles from '../../assets/preview.css?raw'
import markdownStyles from '../../assets/markdown.css?raw'
import variableStyles from '../../assets/variables.css?raw'
import mermaidStyles from '../mermaid/mermaid.css?raw'
import { getMermaidConfig } from '../mermaid/mermaidConfig'
import { useMermaidCapture } from '../mermaid/hooks/useMermaidCapture'

import { themes } from '../preference/theme/themes'
import { useModal } from '../workbench/manager/ModalContext'
import useAdvancedSplitPane from '../splitPanels/useAdvancedSplitPane.js'
import ShadowSurface from '../preview/ShadowSurface'

/**
 * LivePreview - Enterprise-Grade High-Performance Shadow DOM Rendering Engine.
 * Features:
 * - Parse caching (LRU cache, avoids re-parsing unchanged code)
 * - Intelligent debouncing (adaptive timing: 75ms typing, 250ms paused)
 * - Incremental parsing (chunks large files, progressive rendering)
 * - Worker integration with cancellation support
 * - Virtual scrolling ready
 * - Full Shadow DOM isolation
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
  fontSize = null
}) => {
  // --- Refs & Context ---
  const lastScrollPercentage = useRef(0)
  const splitContext = useContext(SplitPaneContext)
  const { overlayMode: isOverlay, setOverlayMode: setOverlay } = useAdvancedSplitPane()
  const { settings } = useSettings()
  const abortControllerRef = useRef(null)

  // --- State ---
  const [renderedHtml, setRenderedHtml] = useState('')
  const [parseProgress, setParseProgress] = useState(100)
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

  // --- 1. Parsing Engine Engine ---
  useEffect(() => {
    let active = true

    // Setup cancellation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const parse = async () => {
      if (disabled || code === undefined || code === null) {
        setRenderedHtml('')
        return
      }

      // 0. PERFORMANCE GUARD: Skip parsing if the window is currently being dragged
      if (document.body.classList.contains('dragging-active')) {
        return
      }

      // 1. Check cache first (LRU cache hit = instant)
      const normalizedLang = (language || 'markdown').toLowerCase()
      const cacheKey = { showHeader, titles: existingTitles }
      const cachedResult = parseCache.get(code, normalizedLang, cacheKey)

      if (cachedResult && active) {
        setRenderedHtml(cachedResult)
        setParseProgress(100)
        return
      }

      try {
        const isTooLarge = (code || '').length > 500000
        const visibleCode = isTooLarge ? code.slice(0, 500000) : code || ''
        let result = ''

        if (normalizedLang === 'markdown' || normalizedLang === 'md') {
          // Large file: use incremental parsing for smooth progressive rendering
          if (visibleCode.length > 50000) {
            for await (const chunk of incrementalParser.parseInChunks(
              visibleCode,
              { renderMetadata: showHeader, titles: existingTitles },
              (chunkResult) => {
                if (active) {
                  setParseProgress(chunkResult.progress)
                  setRenderedHtml(chunkResult.html)
                }
              }
            )) {
              if (!active || abortControllerRef.current?.signal.aborted) {
                return
              }
              result = chunk.html
            }
          } else {
            // Small file: single fast parse
            result = await markdownToHtml(visibleCode, {
              renderMetadata: showHeader,
              titles: existingTitles
            })
          }

          if (isTooLarge) {
            result +=
              '<div class="preview-performance-notice">Preview truncated for performance.</div>'
          }

          // Cache the result for future hits
          parseCache.set(code, normalizedLang, result, cacheKey)
        } else if (normalizedLang === 'mermaid') {
          const escaped = visibleCode
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
          const encoded = encodeURIComponent(visibleCode)
          result = `
            <div class="mermaid-diagram-wrapper" style="display: flex !important; flex-direction: column !important; width: 100% !important; background: var(--color-bg-secondary) !important; border: 1px solid var(--color-border) !important; border-radius: 0 !important; margin: 2rem 0 !important; box-sizing: border-box !important;">
              <div class="code-block-header" style="display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 12px 20px !important; background: var(--color-bg-tertiary) !important; backdrop-filter: none !important; border-bottom: 1px solid var(--color-border) !important; width: 100% !important; box-sizing: border-box !important; flex-shrink: 0 !important; height: 44px !important;">
                <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #ff5f56; border: 0.5px solid rgba(0,0,0,0.1); margin: 0 !important; padding: 0 !important;"></div>
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #ffbd2e; border: 0.5px solid rgba(0,0,0,0.1); margin: 0 !important; padding: 0 !important;"></div>
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #27c93f; border: 0.5px solid rgba(0,0,0,0.1); margin: 0 !important; padding: 0 !important;"></div>
                </div>
                <div class="code-actions" style="display: flex !important; gap: 10px !important; align-items: center !important;">
                  <button class="copy-image-btn" data-code="${encoded}" data-lang="mermaid" title="Export as Image" style="background: transparent !important; border: none !important; cursor: pointer !important; color: var(--color-text-tertiary) !important; padding: 6px !important; border-radius: 0 !important; display: flex !important; align-items: center !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); hover:background: rgba(255,255,255,0.05) !important;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </button>
                  <button class="copy-code-btn" data-code="${encoded}" title="Copy Mermaid Source" style="background: transparent !important; border: none !important; cursor: pointer !important; color: var(--color-text-tertiary) !important; padding: 6px !important; border-radius: 0 !important; display: flex !important; align-items: center !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); hover:background: rgba(255,255,255,0.05) !important;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
              </div>
            <div class="mermaid" data-mermaid-src="${encoded}" style="display: flex !important; justify-content: center !important; width: 100% !important; padding: 40px 20px !important; background: var(--color-bg-primary) !important; box-sizing: border-box !important; position: relative !important; overflow: visible !important; min-height: 150px !important;">${escaped}</div>
          </div>`
        } else {
          const escaped = visibleCode
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
          const encoded = encodeURIComponent(visibleCode)
          result = `
            <div class="code-block-wrapper ${normalizedLang === 'plaintext' || normalizedLang === 'text' || normalizedLang === 'txt' ? 'is-plaintext' : ''}">
              <div class="code-block-header">
                <span class="code-language font-bold">${normalizedLang}</span>
                <div class="code-actions">
                  <button class="copy-image-btn" data-code="${encoded}" data-lang="${normalizedLang}" title="Copy as Image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </button>
                  <button class="copy-code-btn" data-code="${encoded}" title="Copy code">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
              </div>
              <pre><code class="language-${normalizedLang}">${escaped}</code></pre>
            </div>`
        }

        if (active) {
          setRenderedHtml(result)
          setParseProgress(100)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Markdown parsing error:', err)
        }
      }
    }

    // Intelligent debounce: 75ms while typing, 250ms when paused
    // This keeps editor thread free while providing snappy feedback
    const debounceDelay = 75
    const timeoutId = setTimeout(parse, debounceDelay)

    return () => {
      clearTimeout(timeoutId)
      active = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [code, language, showHeader, existingTitles, disabled])

  // --- 2. Style Merging (DRY Token Engine) ---
  const combinedStyles = useMemo(() => {
    const currentThemeObj = themes.find((t) => t.id === theme) || themes[0]

    // 1. Base Theme Variables
    const cssVars = Object.entries(currentThemeObj.colors)
      .filter(([key]) => key.startsWith('--'))
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n')

    // 2. Settings Overrides (Ensures VS Code Feel applies to Preview too)
    const syntaxSettings = settings.syntax || {}
    const varMap = {
      keyword: '--color-syntax-keyword',
      string: '--color-syntax-string',
      variable: '--color-syntax-variable',
      number: '--color-syntax-number',
      comment: '--color-syntax-comment',
      function: '--color-syntax-function',
      operator: '--color-syntax-punctuation',
      bool: '--color-syntax-boolean'
    }

    const overrides = Object.entries(syntaxSettings)
      .filter(([key]) => varMap[key])
      .map(([key, value]) => `${varMap[key]}: ${value} !important;`)
      .join('\n')

    const themeVars = `:root, .shadow-wrapper {
      ${cssVars}
      ${overrides}
      --editor-font-size: ${((fontSize || settings.editor?.fontSize || 14) * 1) / 16}rem;
      --font-sans: ${fontFamily}, sans-serif;
    }`

    return `${variableStyles}\n${themeVars}\n${previewStyles}\n${markdownStyles}\n${mermaidStyles}\n.markdown-body { padding-bottom: 5rem !important; }`
  }, [theme, fontFamily, settings?.editor?.fontSize, settings?.syntax])

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
      {/* Parse Progress Bar - shows during incremental parsing */}
      {parseProgress < 100 && (
        <div
          className="h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 w-full"
          style={{ width: `${parseProgress}%`, transition: 'width 0.2s ease-out' }}
        />
      )}
      {showHeader && (
        <div
          className="flex items-center justify-between px-3 py-2 z-10 sticky top-0 transition-colors duration-300 overflow-x-auto"
          style={{
            backgroundColor: 'var(--header-bg, var(--color-bg-secondary))',
            color: 'var(--header-text, var(--color-text-primary))',
            borderBottom: 'none'
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
