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

// Mermaid rendering removed

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
// mermaid initialization removed

  // Initial runs
  renderHighlight()
// renderMermaid() call removed

  // Polling for async content
  ;[100, 500, 1500, 3000, 5000].forEach((delay) => {
    setTimeout(() => {
      renderHighlight()
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
