import React, { useMemo, useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSettings } from '../../hook/useSettingsContext'
import { Smartphone, Tablet, Monitor, Layers } from 'lucide-react'
import { SplitPaneContext } from '../splitPanels/SplitPaneContext'
import { markdownToHtml } from '../../utils/markdownParser'
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

/**
 * LivePreview - Premium Sandboxed Rendering Engine.
 * Manages the asynchronous parsing of Markdown/Mermaid and synchronizes
 * the rendered output with a secured iframe sandbox.
 */
const LivePreview = ({
  code = '',
  language = 'markdown',
  snippets = [],
  theme = 'midnight-syntax',
  disabled = false,
  fontFamily = "'Outfit', 'Inter', sans-serif",
  onOpenExternal,
  onOpenMiniPreview,
  onExportPDF,
  showHeader = true,
  enableScrollSync = false
}) => {
  // --- Refs & Context ---
  const lastScrollPercentage = useRef(0)
  const iframeRef = useRef(null)
  const splitContext = React.useContext(SplitPaneContext)
  const { overlayMode: isOverlay, setOverlayMode: setOverlay } = useAdvancedSplitPane()
  const { settings } = useSettings()

  // --- State ---
  const [renderedHtml, setRenderedHtml] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)

  // --- Derived Memos ---
  const existingTitles = useMemo(() => {
    return (snippets || []).map((s) => (s.title || '').trim()).filter(Boolean)
  }, [snippets])

  const isDark = useMemo(() => {
    return !['polaris', 'minimal-gray'].includes(theme)
  }, [theme])

  // --- Specialized Hooks ---
  const { handleQuickCopyMermaid } = useMermaidCapture(fontFamily)
  const { openImageExportModal } = useModal()

  // --- 1. Parsing Engine Engine ---
  useEffect(() => {
    let active = true
    const parse = async () => {
      if (disabled || code === undefined || code === null) {
        setRenderedHtml('')
        return
      }

      // 0. PERFORMANCE GUARD: Skip parsing if the window is currently being dragged
      if (document.body.classList.contains('dragging-active')) {
        setIsParsing(false)
        return
      }

      setIsParsing(true)
      try {
        const normalizedLang = (language || 'markdown').toLowerCase()
        const isTooLarge = (code || '').length > 500000
        const visibleCode = isTooLarge ? code.slice(0, 500000) : code || ''
        let result = ''

        if (normalizedLang === 'markdown' || normalizedLang === 'md') {
          result = await markdownToHtml(visibleCode, {
            renderMetadata: showHeader,
            titles: existingTitles
          })
          if (isTooLarge) {
            result +=
              '<div class="preview-performance-notice">Preview truncated for performance.</div>'
          }
        } else if (normalizedLang === 'mermaid') {
          const escaped = visibleCode
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
          const encoded = encodeURIComponent(visibleCode)
          result = `
            <div class="mermaid-diagram-wrapper" style="display: flex !important; flex-direction: column !important; width: 100% !important; background: transparent !important; border: 1px solid var(--color-border) !important; border-radius: 8px !important; overflow: hidden !important; margin: 1.5rem 0 !important; box-sizing: border-box !important;">
              <div class="code-block-header" style="display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 8px 16px !important; background: var(--color-bg-tertiary) !important; border-bottom: 1px solid var(--color-border) !important; width: 100% !important; box-sizing: border-box !important; flex-shrink: 0 !important; height: 36px !important;">
                <span class="code-language font-bold" style="color: var(--color-accent-primary) !important; opacity: 0.9 !important; font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.12em !important; font-family: 'Outfit', sans-serif !important;">Diagram Preview</span>
                <div class="code-actions" style="display: flex !important; gap: 8px !important; align-items: center !important;">
                  <button class="copy-image-btn" data-code="${encoded}" data-lang="mermaid" title="Export as Image" style="background: transparent !important; border: none !important; cursor: pointer !important; color: var(--color-text-tertiary) !important; padding: 4px !important; display: flex !important; align-items: center !important; transition: all 0.2s ease;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </button>
                  <button class="copy-code-btn" data-code="${encoded}" title="Copy Mermaid Source" style="background: transparent !important; border: none !important; cursor: pointer !important; color: var(--color-text-tertiary) !important; padding: 4px !important; display: flex !important; align-items: center !important; transition: all 0.2s ease;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
              </div>
            <div class="mermaid" style="display: flex !important; justify-content: center !important; width: 100% !important; padding: 32px 10px !important; background: transparent !important; box-sizing: border-box !important;">${escaped}</div>
            <script>
              if (window.mermaid) {
                mermaid.initialize({
                  startOnLoad: false,
                  theme: 'neutral',
                  securityLevel: 'loose',
                  themeVariables: {
                    primaryColor: '#ffffff',
                    primaryTextColor: '#000000',
                    primaryBorderColor: '#333333',
                    lineColor: '#333333',
                    secondaryColor: '#f4f4f4',
                    tertiaryColor: '#fff',
                    nodeBorder: '#333333',
                    clusterBkg: '#ffffff',
                    clusterBorder: '#333333',
                    actorBkg: '#ffffff',
                    actorTextColor: '#000000',
                    actorBorder: '#333333',
                    actorLineColor: '#333333',
                    edgeLabelBackground: '#ffffff',
                    labelBackgroundColor: '#ffffff',
                    fontSize: '16px'
                  },
                  flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true,
                    curve: 'basis'
                  }
                });
                setTimeout(() => mermaid.run(), 100);
              }
            </script>
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

        if (active) setRenderedHtml(result)
      } catch (err) {
        console.error('Markdown parsing error:', err)
      } finally {
        if (active) setIsParsing(false)
      }
    }
    parse()
    return () => {
      active = false
    }
  }, [code, language, showHeader, existingTitles, disabled])

  // --- 1.5 Iframe Reset Logic (On Reload) ---
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      // When the iframe document reloads, it's not ready until it says so via message
      setIframeReady(false)
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [])

  // --- 2. Style Synchronization (Only on Theme Change or Iframe Ready) ---
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !iframeReady) return

    const syncStyles = () => {
      const currentThemeObj = themes.find((t) => t.id === theme) || themes[0]
      const cssVars = Object.entries(currentThemeObj.colors)
        .filter(([key]) => key.startsWith('--'))
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n')

      const themeVars = `:root {
        ${cssVars}
        --editor-font-size: ${((settings.editor?.fontSize || 14) * 1) / 16}rem;
        --font-sans: ${fontFamily}, sans-serif;
      }`

      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'styles',
            theme,
            isDark,
            styles: `${variableStyles}\n${themeVars}\n${previewStyles}\n${mermaidStyles}`,
            mermaidConfig: getMermaidConfig(false, fontFamily),
            mermaidEngine: getMermaidEngine(),
            baseFontSize: settings.editor?.fontSize || 14
          },
          '*'
        )
      }
    }

    syncStyles()
  }, [iframeReady, theme, isDark, fontFamily, settings.editor?.fontSize])

  // --- 3. Content Synchronization ---
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !iframeReady) return

    const syncContent = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'render',
            html: renderedHtml,
            initialScrollPercentage: lastScrollPercentage.current,
            editorZoom: 1
          },
          '*'
        )
      }
    }
    syncContent()
  }, [iframeReady, renderedHtml])

  // --- 3. Event Listeners & Message Handlers ---
  useEffect(() => {
    const handleMessage = (event) => {
      // SECURITY & RELIABILITY: Only handle messages from OUR iframe
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return

      if (event.data?.type === 'app:ready') {
        setIframeReady(true)
      }

      if (event.data?.type === 'app:open-external' && event.data.url) {
        if (window.api && window.api.openExternal) window.api.openExternal(event.data.url)
        else window.open(event.data.url, '_blank')
      }
      if (event.data?.type === 'app:copy-text' && event.data.text) {
        navigator.clipboard.writeText(event.data.text)
      }
      if (event.data?.type === 'app:copy-as-image' && event.data.code) {
        if (event.data.language === 'mermaid') {
          handleQuickCopyMermaid(event.data.code)
        } else {
          openImageExportModal({
            title: 'Code Snippet',
            code: event.data.code,
            language: event.data.language || language || 'text'
          })
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [openImageExportModal, language, handleQuickCopyMermaid])

  // --- 4. Scroll Synchronization Logic ---
  useEffect(() => {
    if (!enableScrollSync) return

    const handleSync = (e) => {
      const percentage = e.detail?.percentage
      if (typeof percentage !== 'number') return

      lastScrollPercentage.current = percentage

      const iframe = iframeRef.current
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'scroll', percentage }, '*')
      }
    }

    window.addEventListener('app:editor-scroll', handleSync)
    return () => window.removeEventListener('app:editor-scroll', handleSync)
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
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${isOverlay ? 'bg-[var(--color-accent-primary)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100'}`}
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
                  className={`p-1 rounded transition-colors ${splitContext.overlayWidth === 25 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                  title="Phone View"
                >
                  <Smartphone size={14} />
                </button>
                <button
                  onClick={() => splitContext.setOverlayWidth(50)}
                  className={`p-1 rounded transition-colors ${splitContext.overlayWidth === 50 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                  title="Tablet View"
                >
                  <Tablet size={14} />
                </button>
                <button
                  onClick={() => splitContext.setOverlayWidth(75)}
                  className={`p-1 rounded transition-colors ${splitContext.overlayWidth === 75 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
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
              className="w-7 h-7 rounded-md hover:bg-[var(--hover-bg)] text-[var(--color-text-primary)] flex items-center justify-center transition-opacity hover:opacity-70"
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
              className="w-7 h-7 rounded-md hover:bg-[var(--hover-bg)] text-[var(--color-text-primary)] flex items-center justify-center transition-opacity hover:opacity-70"
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
              className="px-2 py-1 rounded-md bg-blue-500 text-white text-[10px] font-bold"
            >
              Export
            </button>
          </div>
        </div>
      )}
      <div
        className="flex-1 w-full min-h-0 relative live-preview-scroller-container"
        style={{ backgroundColor: isDark ? 'transparent' : '#ffffff' }}
      >
        <iframe
          ref={iframeRef}
          title="Live Preview"
          className="w-full h-full border-none absolute inset-0 bg-transparent"
          sandbox="allow-scripts allow-modals allow-popups"
          allow="clipboard-write"
          src="preview.html"
          style={{ height: '100%', width: '100%' }}
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
  showHeader: PropTypes.bool
}

export default React.memo(LivePreview)
