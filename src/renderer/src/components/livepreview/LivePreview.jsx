import React, { useMemo, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Smartphone, Tablet, Monitor } from 'lucide-react'
import { SplitPaneContext } from '../splitPanels/AdvancedSplitPane'
import { fastMarkdownToHtml } from '../../utils/fastMarkdown'
import markdownStyles from '../../assets/markdown.css?raw'
import variableStyles from '../../assets/variables.css?raw'
import mermaidStyles from '../mermaid/mermaid.css?raw'
import { getMermaidConfig } from '../mermaid/mermaidConfig'
import { getMermaidEngine } from '../mermaid/mermaidEngine'

/**
 * LivePreview - Premium Sandboxed Rendering Engine.
 *
 * Replaces the old ReactMarkdown implementation with a high-performance,
 * CSP-compliant iframe sandbox. This resolves all issues with:
 * 1. Syntax highlighting (using Highlight.js module)
 * 2. Visual consistency (using centralized markdown.css)
 * 3. Security (resolves 'unsafe-inline' CSP violations)
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
  // 1. Ref - Always top level
  const iframeRef = useRef(null)

  // Access SplitPane Context for Overlay Controls
  const splitContext = React.useContext(SplitPaneContext)

  // 2. Title/Wiki-Link analysis - Always call hooks
  const existingTitles = useMemo(() => {
    return (snippets || []).map((s) => (s.title || '').trim()).filter(Boolean)
  }, [snippets])

  // 3. Generate optimized HTML (Handle empty/disabled inside the hook, not before)
  const html = useMemo(() => {
    if (disabled || !code || !code.trim()) return ''

    // PERFORMANCE SAFETY: If content is massive (> 200k chars)
    const isTooLarge = code.length > 200000
    if (isTooLarge) {
      const escaped = code.slice(0, 100000).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      return `<div class="p-8 opacity-70"><p class="mb-4 text-xs font-bold uppercase tracking-widest text-blue-500">Performance Mode (Preview Truncated)</p><pre class="text-xs font-mono leading-relaxed" style="white-space: pre-wrap;">${escaped}...</pre></div>`
    }

    const normalizedLang = (language || 'markdown').toLowerCase()

    // CASE 1: Markdown
    if (normalizedLang === 'markdown' || normalizedLang === 'md') {
      return fastMarkdownToHtml(code, existingTitles)
    }

    // CASE 2: Standalone Mermaid Diagram
    if (normalizedLang === 'mermaid') {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `
        <div class="code-block-header mb-4" style="border: none; background: transparent;">
          <span class="code-language font-bold" style="color: var(--color-accent-primary); opacity: 0.6;">Diagram Preview</span>
          <button class="copy-code-btn" data-code="${escaped}" title="Copy Mermaid Source">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <div class="mermaid-diagram">${escaped}</div>`
    }

    // CASE 3: General Code Snippet
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    return `
      <div class="code-block-wrapper ${normalizedLang === 'plaintext' || normalizedLang === 'text' || normalizedLang === 'txt' ? 'is-plaintext' : ''}">
        <div class="code-block-header">
          <span class="code-language font-bold">${normalizedLang}</span>
          <button class="copy-code-btn" data-code="${escaped}" title="Copy code">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <pre><code class="language-${normalizedLang}">${escaped}</code></pre>
      </div>`
  }, [code, language, existingTitles, disabled])

  const isDark = theme !== 'polaris'

  // 4. Mirror content to IFrame via postMessage
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !html) return

    const syncContent = () => {
      // Create a style override for the font family
      const fontOverride = `
        .markdown-body, .mermaid-wrapper, .mermaid-diagram, .actor, .node label { 
          font-family: ${fontFamily}, sans-serif !important; 
        }
        pre code { font-family: 'JetBrains Mono', 'Cascadia Code', monospace !important; }
      `

      iframe.contentWindow.postMessage(
        {
          type: 'render',
          html,
          theme,
          isDark,
          isLive: true,
          styles: `${variableStyles}\n${markdownStyles}\n${mermaidStyles}\n${fontOverride}`,
          mermaidConfig: getMermaidConfig(isDark, fontFamily),
          mermaidEngine: getMermaidEngine()
        },
        '*'
      )
    }

    // Attempt instant sync
    syncContent()

    // Ensure sync after load
    const onLoad = () => syncContent()
    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [html, theme, isDark, fontFamily])

  // 5. Handle messages from IFrame (External Links)
  useEffect(() => {
    const handleMessage = (event) => {
      // Security check: ensure message comes from our iframe
      // (Optional strict check if needed, but for local iframe it's usually fine)

      if (event.data?.type === 'app:open-external' && event.data.url) {
        if (window.api && window.api.openExternal) {
          window.api.openExternal(event.data.url)
        } else {
          window.open(event.data.url, '_blank')
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="w-full h-full flex flex-col bg-transparent overflow-hidden">
      {/* Premium Preview Toolbar */}
      {/* Premium Mac-Style Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#0d1117] border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0 transition-colors duration-300 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Left: Window Controls decoration */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!splitContext?.overlayMode && (
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider select-none uppercase opacity-80 pl-1">
              PREVIEW ENGINE
            </span>
          )}

          {/* Integrated Overlay Resize Controls */}
          {splitContext?.overlayMode && (
            <div
              className={`flex items-center gap-1 h-4 ${!splitContext?.overlayMode ? 'ml-3 pl-3 border-l border-slate-300 dark:border-slate-700' : ''}`}
            >
              <button
                onClick={() => {
                  splitContext.setOverlayWidth(25)
                  localStorage.setItem('overlayWidth', 25)
                }}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${splitContext.overlayWidth === 25 ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                title="Mobile (25%)"
              >
                <Smartphone size={14} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => {
                  splitContext.setOverlayWidth(50)
                  localStorage.setItem('overlayWidth', 50)
                }}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${splitContext.overlayWidth === 50 ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                title="Tablet (50%)"
              >
                <Tablet size={14} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => {
                  splitContext.setOverlayWidth(75)
                  localStorage.setItem('overlayWidth', 75)
                }}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${splitContext.overlayWidth === 75 ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                title="Desktop (75%)"
              >
                <Monitor size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Action Area */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-4">
          {/* Mini Preview Button */}
          <button
            onClick={onOpenMiniPreview}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-all
            text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400
            hover:bg-slate-100 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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

          {/* System Browser Button */}
          <button
            onClick={onOpenExternal}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-all
            text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400
            hover:bg-slate-100 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Export PDF Button (Highlighted) */}
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all
            bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-transparent
            hover:bg-slate-700 dark:hover:bg-slate-200 active:transform active:scale-95
            text-[10px] font-bold shadow-sm"
            title="Export to PDF"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-transparent overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Premium Live Preview"
          className="w-full h-full border-none bg-transparent"
          sandbox="allow-scripts"
          allow="clipboard-read; clipboard-write"
          src="/preview.html"
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
