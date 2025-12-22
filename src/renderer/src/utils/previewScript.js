/**
 * previewScript.js
 * External script for handles Mermaid rendering, Syntax Highlighting,
 * and Copy functionality in the preview iframe.
 * Avoids CSP 'unsafe-inline' violations.
 */

export const initPreview = (config = {}) => {
  const { isDark = true } = config

  /* --- 1. Syntax Highlighting --- */
  const renderHighlight = () => {
    if (window.hljs) {
      document.querySelectorAll('pre code').forEach((block) => {
        if (!block.classList.contains('hljs')) {
          hljs.highlightElement(block)
        }
      })
    }
  }

  /* --- 2. Mermaid Rendering --- */
  const renderMermaid = () => {
    if (window.mermaid) {
      try {
        const nodes = document.querySelectorAll('.mermaid')
        if (nodes.length > 0) {
          const unprocessed = Array.from(nodes).filter((n) => !n.getAttribute('data-processed'))
          if (unprocessed.length > 0) {
            mermaid.run({ nodes: unprocessed, suppressErrors: true })
          }
        }
      } catch (e) {}
    }
  }

  /* --- 3. Copy to Clipboard --- */
  const copyToClipboard = (btn) => {
    const code = btn.getAttribute('data-code')
    if (!code) return

    const rawCode = code
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")

    navigator.clipboard.writeText(rawCode).then(() => {
      const originalContent = btn.innerHTML
      btn.classList.add('success')
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-check"><path d="M20 6 9 17l-5-5"/></svg>'
      setTimeout(() => {
        btn.classList.remove('success')
        btn.innerHTML = originalContent
      }, 2000)
    })
  }

  // --- Initial Execution ---
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      themeVariables: {
        primaryColor: '#58a6ff',
        primaryTextColor: isDark ? '#e6edf3' : '#1f2328',
        lineColor: isDark ? '#8b949e' : '#656d76',
        secondaryColor: isDark ? '#161b22' : '#f6f8fa',
        mainBkg: isDark ? '#161b22' : '#ffffff',
        pie1: '#58a6ff',
        pie2: '#3fb950',
        pie3: '#ab7df8',
        pie4: '#d29922',
        pie5: '#f85149',
        pieTitleTextColor: isDark ? '#e6edf3' : '#1f2328',
        pieSectionTextColor: '#ffffff',
        pieLegendTextColor: isDark ? '#8b949e' : '#656d76'
      },
      securityLevel: 'loose',
      fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif"
    })
  }

  // Initial runs
  renderHighlight()
  renderMermaid()

  // Polling for async content
  ;[100, 500, 1500, 3000, 5000].forEach((delay) => {
    setTimeout(() => {
      renderHighlight()
      renderMermaid()
    }, delay)
  })

  // Global Event Delegation
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-code-btn')
    if (copyBtn) {
      copyToClipboard(copyBtn)
      return
    }

    const link = e.target.closest('.preview-quicklink')
    if (link) {
      window.parent.postMessage(
        {
          type: 'app:open-snippet',
          title: link.dataset.title
        },
        '*'
      )
    }
  })
}
