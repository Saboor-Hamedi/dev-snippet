import React, { useMemo, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Smartphone, Tablet, Monitor, Layers } from 'lucide-react'
import { SplitPaneContext } from '../splitPanels/SplitPaneContext'
import { fastMarkdownToHtml } from '../../utils/fastMarkdown'
import markdownStyles from '../../assets/markdown.css?raw'
import variableStyles from '../../assets/variables.css?raw'
import mermaidStyles from '../mermaid/mermaid.css?raw'
import { getMermaidConfig } from '../mermaid/mermaidConfig'
import { getMermaidEngine } from '../mermaid/mermaidEngine'

import { themes } from '../preference/theme/themes'
import { useModal } from '../workbench/manager/ModalManager'
import useAdvancedSplitPane from '../splitPanels/useAdvancedSplitPane.js'

/**
 * LivePreview - Premium Sandboxed Rendering Engine.
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
  onExportPDF
}) => {
  const iframeRef = useRef(null)
  const splitContext = React.useContext(SplitPaneContext)
  const { overlayMode: isOverlay, setOverlayMode: setOverlay } = useAdvancedSplitPane()

  const existingTitles = useMemo(() => {
    return (snippets || []).map((s) => (s.title || '').trim()).filter(Boolean)
  }, [snippets])

  const html = useMemo(() => {
    if (disabled || !code || !code.trim()) return ''
    const isTooLarge = code.length > 200000
    if (isTooLarge) {
      const escaped = code.slice(0, 100000).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      return `<div class="p-8 opacity-70"><p class="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">Performance Mode (Preview Truncated)</p><pre class="text-xs font-mono leading-relaxed" style="white-space: pre-wrap;">${escaped}...</pre></div>`
    }

    const normalizedLang = (language || 'markdown').toLowerCase()
    if (normalizedLang === 'markdown' || normalizedLang === 'md') {
      return fastMarkdownToHtml(code, existingTitles)
    }

    if (normalizedLang === 'mermaid') {
      const escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
      return `
        <div class="code-block-header mb-4" style="border: none; background: transparent;">
          <span class="code-language font-bold" style="color: var(--color-accent-primary); opacity: 0.6;">Diagram Preview</span>
          <button class="copy-code-btn" data-code="${escaped}" title="Copy Mermaid Source">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <div class="mermaid-diagram">${escaped}</div>`
    }

    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    return `
      <div class="code-block-wrapper ${normalizedLang === 'plaintext' || normalizedLang === 'text' || normalizedLang === 'txt' ? 'is-plaintext' : ''}">
        <div class="code-block-header">
          <span class="code-language font-bold">${normalizedLang}</span>
          <div class="code-actions">
            <button class="copy-image-btn" data-code="${escaped}" data-lang="${normalizedLang}" title="Copy as Image">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </button>
            <button class="copy-code-btn" data-code="${escaped}" title="Copy code">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
        </div>
        <pre><code class="language-${normalizedLang} hljs">${escaped}</code></pre>
      </div>`
  }, [code, language, existingTitles, disabled])

  const isDark = theme !== 'polaris'
  const { openImageExportModal } = useModal()

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !html) return
    const syncContent = () => {
      // Find current theme definition to extract exact colors
      const currentThemeObj = themes.find((t) => t.id === theme) || themes[0]
      const cssVars = Object.entries(currentThemeObj.colors)
        .filter(([key]) => key.startsWith('--'))
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n')

      const themeVars = `
        :root {
          ${cssVars}
        }
      `

      const fontOverride = `
        .markdown-body, .mermaid-wrapper, .mermaid-diagram, .actor, .node label { 
          font-family: ${fontFamily}, sans-serif !important; 
          color: var(--color-text-primary);
        }
        pre code { 
          font-family: 'JetBrains Mono', 'Cascadia Code', monospace !important; 
          color: inherit;
        }
        .code-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .copy-image-btn {
          background: transparent;
          border: none;
          color: var(--color-text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .copy-image-btn:hover {
          color: var(--color-text-primary);
          background: var(--bg-tertiary);
        }
      `

      iframe.contentWindow.postMessage(
        {
          type: 'render',
          html,
          theme,
          isDark,
          isLive: true,
          styles: `${variableStyles}\n${themeVars}\n${markdownStyles}\n${mermaidStyles}\n${fontOverride}`,
          mermaidConfig: getMermaidConfig(isDark, fontFamily),
          mermaidEngine: getMermaidEngine()
        },
        '*'
      )
    }
    syncContent()
    iframe.addEventListener('load', syncContent)
    return () => iframe.removeEventListener('load', syncContent)
  }, [html, theme, isDark, fontFamily])

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'app:open-external' && event.data.url) {
        if (window.api && window.api.openExternal) window.api.openExternal(event.data.url)
        else window.open(event.data.url, '_blank')
      }
      if (event.data?.type === 'app:copy-as-image' && event.data.code) {
        // Since we are in the preview, we might not have the full snippet context (like title and tags)
        // if this was just a raw code string rendering.
        // However, usually LivePreview is rendering a snippet.
        // We'll try to find the snippet or just use a generic object.
        openImageExportModal({
          title: 'Code Snippet',
          code: event.data.code,
          language: event.data.language || language || 'text'
        })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [openImageExportModal, language])

  return (
    <div className="w-full h-full flex flex-col bg-transparent overflow-hidden">
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
          {isOverlay && (
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
      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Live Preview"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-modals allow-popups"
          src="preview.html"
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
  onExportPDF: PropTypes.func
}

export default React.memo(LivePreview)
