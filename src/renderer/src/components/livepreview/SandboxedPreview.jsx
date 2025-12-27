import React, { useMemo, useRef, useEffect } from 'react'
import { fastMarkdownToHtml } from '../../utils/fastMarkdown'
import markdownStyles from '../../assets/markdown.css?raw'
import variableStyles from '../../assets/variables.css?raw'

/**
 * Sandboxed Live Preview using a static /preview.html asset.
 * This resolves CSP issues by avoiding inline scripts.
 */
const SandboxedPreview = ({
  code = '',
  language = 'markdown',
  snippets = [],
  theme = 'midnight-syntax'
}) => {
  const iframeRef = useRef(null)

  // 1. Prepare Content
  const existingTitles = useMemo(() => {
    return snippets.map((s) => (s.title || '').trim()).filter(Boolean)
  }, [snippets])

  const html = useMemo(() => {
    const normalizedLang = (language || 'markdown').toLowerCase()
    if (normalizedLang === 'markdown' || normalizedLang === 'md') {
      return fastMarkdownToHtml(code, existingTitles)
    }
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<div class="code-block-wrapper"><pre><code>${escaped}</code></pre></div>`
  }, [code, language, existingTitles])

  const isDark = theme !== 'polaris'

  // 2. Sync with IFrame
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const syncContent = () => {
      iframe.contentWindow.postMessage(
        {
          type: 'render',
          html,
          theme,
          isDark,
          styles: `${variableStyles}\n${markdownStyles}`
        },
        '*'
      )
    }

    // Attempt sync
    syncContent()

    // Also sync on load in case it wasn't ready
    iframe.addEventListener('load', syncContent)
    return () => iframe.removeEventListener('load', syncContent)
  }, [html, theme, isDark])

  return (
    <div
      className="w-full h-full overflow-hidden rounded-[5px]"
      style={{ backgroundColor: isDark ? 'transparent' : '#ffffff' }}
    >
      <iframe
        ref={iframeRef}
        title="Live Preview Sandbox"
        className="w-full h-full border-none bg-transparent"
        sandbox="allow-scripts"
        src="/preview.html"
      />
    </div>
  )
}

export default SandboxedPreview
