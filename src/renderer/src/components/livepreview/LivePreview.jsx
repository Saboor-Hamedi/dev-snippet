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
import { useModal } from '../workbench/manager/ModalContext'
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
  onExportPDF,
  showHeader = true,
  enableScrollSync = false
}) => {
  const lastScrollPercentage = useRef(0)
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
        <pre><code class="language-${normalizedLang}">${escaped}</code></pre>
      </div>`
  }, [code, language, existingTitles, disabled])

  const isDark = useMemo(() => {
    return !['polaris', 'minimal-gray'].includes(theme)
  }, [theme])
  const { openImageExportModal } = useModal()

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const syncContent = () => {
      // Find current theme definition
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
          transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .preview-container {
          transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        pre code { 
          font-family: 'JetBrains Mono', 'Cascadia Code', monospace !important; 
          color: inherit;
        }
        hr {
          height: 1px;
          padding: 0;
          margin: 24px 0;
          background-color: var(--color-border);
          border: 0;
          opacity: 0.3;
        }
        .preview-intel {
          display: flex;
          gap: 12px;
          font-size: 10px;
          color: var(--color-text-tertiary);
          margin-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.7;
        }
        .is-rtl {
          direction: rtl;
          text-align: right;
        }
        .preview-diff-add {
          background-color: rgba(46, 160, 67, 0.15);
          color: #3fb950;
          text-decoration: none;
          padding: 0 2px;
          border-radius: 2px;
        }
        .preview-diff-del {
          background-color: rgba(248, 81, 73, 0.15);
          color: #f85149;
          text-decoration: line-through;
          padding: 0 2px;
          border-radius: 2px;
        }
        .preview-progress-wrapper {
          width: 100%;
          height: 8px;
          background: var(--color-bg-tertiary);
          border-radius: 4px;
          margin: 16px 0;
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }
        .preview-progress-bar {
          height: 100%;
          background: var(--color-accent-primary);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .preview-progress-label {
          font-size: 10px;
          color: var(--color-text-secondary);
          min-width: 30px;
        }
        .preview-file-tree {
          background-color: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 12px;
          margin: 16px 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--color-text-secondary);
        }
        .tree-line {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 22px;
          white-space: nowrap;
        }
        .preview-sparkline {
          display: inline-block;
          vertical-align: middle;
          margin: 0 4px;
          color: var(--color-accent-primary);
          overflow: visible;
        }
        .preview-metadata-card {
          padding: 30px;
          background: var(--color-bg-tertiary);
          border-radius: 12px;
          margin-bottom: 30px;
          border: 1px solid var(--color-border);
          text-align: center;
          animation: slideInDown 0.5s ease-out;
        }
        .meta-title {
          font-size: 2.5rem !important;
          margin: 0 0 10px 0 !important;
          font-weight: 800 !important;
          letter-spacing: -0.025em;
          border: none !important;
          padding: 0 !important;
        }
        .meta-details {
          display: flex;
          justify-content: center;
          gap: 20px;
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          margin-bottom: 15px;
        }
        .meta-theme-pill {
          display: inline-block;
          padding: 4px 12px;
          background: var(--color-accent-primary);
          color: #fff;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        @keyframes slideInDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .preview-timeline {
          position: relative;
          padding-left: 24px;
          margin: 24px 0;
          border-left: 2px solid var(--color-border);
        }
        .timeline-item {
          position: relative;
          margin-bottom: 24px;
        }
        .timeline-item::before {
          content: "";
          position: absolute;
          left: -31px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--color-accent-primary);
          border: 3px solid var(--color-bg-primary);
        }
        .timeline-date {
          font-weight: 700;
          font-size: 12px;
          color: var(--color-accent-primary);
          margin-bottom: 4px;
        }
        .timeline-content {
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        .preview-badge {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 700;
          height: 20px;
          border-radius: 4px;
          overflow: hidden;
          margin: 0 4px;
          vertical-align: middle;
        }
        .badge-label {
          background: #555;
          color: #fff;
          padding: 0 8px;
          height: 100%;
          display: flex;
          align-items: center;
        }
        .badge-value {
          background: var(--badge-color, #0366d6);
          color: #fff;
          padding: 0 8px;
          height: 100%;
          display: flex;
          align-items: center;
        }
        .preview-bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 60px;
          margin: 16px 0;
          padding: 8px;
          background: var(--color-bg-tertiary);
          border-radius: 8px;
        }
        .bar-container {
          flex: 1;
          height: 100%;
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
          position: relative;
        }
        .bar-fill {
          position: absolute;
          bottom: 0;
          width: 100%;
          background: var(--color-accent-primary);
          border-radius: 2px;
          transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .preview-tooltip-trigger {
          border-bottom: 1px dashed var(--color-accent-primary);
          cursor: help;
          position: relative;
        }
        .preview-tooltip-trigger::after {
          content: attr(data-tip);
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%) scale(0.8);
          background: #000;
          color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .preview-tooltip-trigger:hover::after {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) scale(1);
        }
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(var(--grid-cols, 1), 1fr);
          gap: 16px;
          margin: 16px 0;
        }
        .grid-col {
          min-width: 0;
        }
        .preview-rating {
          color: #ffb100;
          font-family: serif;
          font-size: 1.2em;
          letter-spacing: 2px;
          cursor: help;
        }
        .preview-img-sized {
          object-fit: contain;
          border-radius: 8px;
        }
        .preview-tabs {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          overflow: hidden;
          margin: 20px 0;
          background: var(--color-bg-secondary);
        }
        .tabs-header {
          display: flex;
          background: var(--color-bg-tertiary);
          border-bottom: 1px solid var(--color-border);
          padding: 0 8px;
        }
        .tab-btn {
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }
        .tab-btn.active {
          color: var(--color-accent-primary);
        }
        .tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-accent-primary);
        }
        .tabs-body {
          padding: 16px;
        }
        .tab-pane {
          display: none;
        }
        .tab-pane.active {
          display: block;
          animation: fadeIn 0.3s ease;
        }
        .status-pulse {
          display: inline-block;
          width: 10px;
          height: 10px;
          background-color: var(--pulse-color, #238636);
          border-radius: 50%;
          margin-right: 8px;
          position: relative;
          vertical-align: middle;
        }
        .status-pulse::after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: inherit;
          animation: pulse 2s infinite;
          opacity: 0.5;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(3); opacity: 0; }
        }
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: middle;
        }
        .preview-footnotes {
          margin-top: 50px;
          font-size: 0.85em;
          color: var(--color-text-tertiary);
        }
        /* ADMONITIONS (CALLOUTS) */
        .preview-admonition {
          padding: 16px 20px;
          margin: 24px 0;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background: var(--color-bg-tertiary);
          position: relative;
          overflow: hidden;
        }
        .preview-admonition::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--admo-color, var(--color-accent-primary));
        }
        .admonition-title {
          font-weight: 800;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          color: var(--admo-color, var(--color-accent-primary));
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admo-info { --admo-color: #58a6ff; }
        .admo-warning { --admo-color: #d29922; }
        .admo-danger { --admo-color: #f85149; }
        .admo-success { --admo-color: #3fb950; }
        .admo-note { --admo-color: #a371f7; }

        /* KANBAN ENHANCEMENT */
        .preview-kanban {
          display: flex;
          gap: 16px;
          margin: 24px 0;
          overflow-x: auto;
          padding-bottom: 12px;
          scroll-behavior: smooth;
        }
        .kanban-col {
          flex: 1;
          min-width: 260px;
          background: var(--color-bg-secondary);
          border-radius: 14px;
          padding: 16px;
          border: 1px solid var(--color-border);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .kanban-header {
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-accent-primary);
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .kanban-tasks ul, .kanban-tasks li {
          list-style: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .kanban-tasks li {
          background: var(--color-bg-tertiary);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 10px;
          border: 1px solid var(--color-border);
          font-size: 13px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .kanban-tasks li:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-color: var(--color-accent-primary);
        }

        /* QR CODE PREMIUM minimalist */
        .preview-qr-wrapper {
          display: inline-flex;
          padding: 12px;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          margin: 16px 0;
          box-shadow: 0 8px 30px rgba(0,0,0,0.25);
          position: relative;
          overflow: hidden;
        }
        .qr-container {
          background: #fff;
          padding: 8px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          flex-shrink: 0;
        }
        .preview-qr {
          width: 86px;
          height: 86px;
          display: block;
        }
        .qr-footer {
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden;
        }
        .qr-caption {
          margin: 0 !important;
          font-size: 9px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.12em !important;
          color: var(--color-accent-primary) !important;
          opacity: 0.8;
        }
        .qr-link {
          font-size: 12px !important;
          font-weight: 700 !important;
          color: var(--color-text-primary) !important;
          text-decoration: none !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
          display: block;
          transition: color 0.2s;
        }
        .qr-link:hover {
          color: var(--color-accent-primary) !important;
        }

        /* TABLE ENHANCEMENT */
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 24px 0;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--color-border);
        }
        th {
          background: var(--color-bg-tertiary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 14px 16px;
          border-bottom: 2px solid var(--color-border);
          text-align: left;
          color: var(--color-accent-primary);
        }
        td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border);
          font-size: 13px;
        }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: var(--color-bg-secondary); }

        .preview-math-block {
          background: var(--color-bg-tertiary);
          padding: 24px;
          border-radius: 16px;
          margin: 24px 0;
          text-align: center;
          font-family: 'Cambria Math', 'serif';
          font-size: 1.4em;
          border: 1px solid var(--color-border);
          box-shadow: inset 0 0 40px rgba(0,0,0,0.1);
        }
        .mermaid {
          display: flex;
          justify-content: center;
          margin: 24px 0;
          background: var(--color-bg-secondary);
          padding: 30px;
          border-radius: 16px;
          border: 1px solid var(--color-border);
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          transition: transform 0.3s ease;
          white-space: pre;
          max-width: 100%;
          overflow-x: auto;
        }
        .mermaid:hover {
          transform: translateY(-4px);
          border-color: var(--color-accent-primary);
        }
        .mermaid svg {
          max-width: 100% !important;
          height: auto !important;
        }
        /* MOBILE RESPONSIVITY */
        @media (max-width: 768px) {
          .preview-kanban {
            flex-direction: column;
          }
          .kanban-col {
            min-width: 100%;
          }
          .preview-grid {
            grid-template-columns: 1fr !important;
          }
          .meta-title {
            font-size: 1.5rem !important;
          }
          .meta-details {
            flex-direction: column;
            gap: 8px;
          }
          .preview-qr-wrapper {
             max-width: 100%;
             width: 100%;
             justify-content: flex-start;
          }
          .qr-link {
            max-width: 120px;
          }
          table {
            display: block;
            overflow-x: auto;
          }
          .preview-tabs .tabs-header {
            flex-wrap: wrap;
          }
          .tab-btn {
            padding: 8px 12px;
            font-size: 12px;
          }
        }

        .code-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .copy-image-btn {
          background: transparent;
          border: none;
          color: var(--color-text-tertiary);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .copy-image-btn:hover {
          color: var(--color-accent-primary);
          background: var(--color-bg-tertiary);
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
          mermaidConfig: getMermaidConfig(false, fontFamily),
          mermaidEngine: getMermaidEngine(),
          initialScrollPercentage: lastScrollPercentage.current
        },
        '*'
      )
    }
    syncContent()
    iframe.addEventListener('load', syncContent)

    const handleReady = (e) => {
      if (e.data?.type === 'app:ready') {
        syncContent()
      }
    }
    window.addEventListener('message', handleReady)

    return () => {
      iframe.removeEventListener('load', syncContent)
      window.removeEventListener('message', handleReady)
    }
  }, [html, theme, isDark, fontFamily])

  useEffect(() => {
    // ... (Lines 181-200 unchanged)
    const handleMessage = (event) => {
      if (event.data?.type === 'app:open-external' && event.data.url) {
        if (window.api && window.api.openExternal) window.api.openExternal(event.data.url)
        else window.open(event.data.url, '_blank')
      }
      if (event.data?.type === 'app:copy-as-image' && event.data.code) {
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

  // Scroll Sync Listener
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

  return (
    <div className="w-full h-full flex flex-col bg-transparent overflow-hidden">
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
  onExportPDF: PropTypes.func,
  enableScrollSync: PropTypes.bool
}

export default React.memo(LivePreview)
