import { useCallback } from 'react'
import { generatePreviewHtml } from '../../../utils/previewGenerator'

/**
 * useEditorExport - Handles all export functionality (PDF, Word, Clipboard, HTML)
 * 
 * This hook manages:
 * - HTML generation for previews and exports
 * - PDF export
 * - Word export
 * - Clipboard copy (rich HTML + plain text)
 */
export const useEditorExport = ({
  code,
  title,
  snippets,
  currentTheme,
  settings,
  showToast
}) => {
  // Helper to generate the complete HTML for external/mini previews
  const generateFullHtml = useCallback(
    (forPrint = false) => {
      const ext = title?.includes('.') ? title.split('.').pop()?.toLowerCase() : null
      const isMarkdown = !ext || ext === 'markdown' || ext === 'md'
      const existingTitles = snippets.map((s) => (s.title || '').trim()).filter(Boolean)

      return generatePreviewHtml({
        code,
        title: title || 'Untitled',
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
      await window.api.invoke('window:openMiniBrowser', fullHtml).catch(() => {
        return window.api.invoke('shell:previewInBrowser', fullHtml)
      })
    }
  }, [generateFullHtml])

  // Helper function to pre-process HTML for export
  const preProcessExportHtml = useCallback(
    async (html) => {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html || ''

      // Remove scripts, styles, and links for clean export
      tempDiv.querySelectorAll('script, style, link').forEach((n) => n.remove())

      return tempDiv.innerHTML
    },
    [settings?.editor?.fontFamily]
  )

  const sanitizeExportHtml = useCallback(
    (html) => {
      try {
        const temp = document.createElement('div')
        temp.innerHTML = html || ''

        temp.querySelectorAll('script, style, link').forEach((n) => n.remove())

        temp
          .querySelectorAll(
            '.preview-intel, .code-actions, .copy-code-btn, .ui-element, .preview-engine-toolbar'
          )
          .forEach((n) => n.remove())

        const contentElement = temp.querySelector('#content') || temp.querySelector('body') || temp
        if (!contentElement) return html

        Array.from(contentElement.querySelectorAll('*')).forEach((el) => {
          if (el === contentElement) return
          el.removeAttribute('class')
          el.removeAttribute('id')
          el.removeAttribute('style')
        })

        const contentHtml = contentElement.innerHTML || ''

        const printCss = `
        @page { margin: 1.2in; size: letter; }
        html, body { background: white; color: #000; font-family: ${settings?.editor?.fontFamily || 'Inter, sans-serif'}; margin: 0; padding: 0; }
        .preview-container { max-width: 6.5in; margin: 0 auto; padding: 20px; box-sizing: border-box; }
        img, svg { max-width: 100%; height: auto; }
        pre { background: #fafafa; border: 1px solid #e1e5e9; padding: 12px; overflow-x: auto; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d1d5db; padding: 8px; }
      `

        const titleSafe = (title || 'snippet').replace(/[^a-z0-9]/gi, '_').toLowerCase()
        return `<!doctype html><html><head><meta charset="utf-8"><title>${titleSafe}</title><style>${printCss}</style></head><body><div id="content" class="preview-container">${contentHtml}</div></body></html>`
      } catch (err) {
        return html
      }
    },
    [settings?.editor?.fontFamily, title]
  )

  const handleCopyToClipboard = useCallback(async () => {
    try {
      let fullHtml = await generateFullHtml(false)
      fullHtml = await preProcessExportHtml(fullHtml)

      fullHtml = sanitizeExportHtml(fullHtml)

      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = fullHtml
      const contentDiv = tempDiv.querySelector('#content') || tempDiv
      if (!contentDiv) throw new Error('No content to copy')

      contentDiv
        .querySelectorAll('.copy-code-btn, .ui-element, .code-actions')
        .forEach((n) => n.remove())

      contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
        const t = (el.textContent || '').trim().toLowerCase()
        if (t.includes('start frontend') || t.includes('untitled')) el.remove()
      })

      const htmlContent = contentDiv.innerHTML
      let textContent = (contentDiv.textContent || contentDiv.innerText || '').trim()

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

      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([htmlContent], { type: 'text/html' }),
              'text/plain': new Blob([textContent], { type: 'text/plain' })
            })
          ])
        } else {
          await navigator.clipboard.writeText(textContent || code)
        }
        showToast?.('Rendered content copied to clipboard!', 'success')
      } catch (err) {
        await navigator.clipboard.writeText(textContent || code)
        showToast?.('Rendered content copied to clipboard (plaintext)', 'info')
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(code)
        showToast?.('Code copied to clipboard!', 'info')
      } catch (fallbackErr) {
        showToast?.('Failed to copy to clipboard', 'error')
      }
    }
  }, [generateFullHtml, preProcessExportHtml, sanitizeExportHtml, code, showToast])

  const handleExportPDF = useCallback(async () => {
    try {
      let fullHtml = await generateFullHtml(true)

      fullHtml = await preProcessExportHtml(fullHtml)

      if (window.api?.invoke) {
        const sanitizedTitle = (title || 'snippet').replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const success = await window.api.invoke('export:pdf', fullHtml, sanitizedTitle)
        if (success) {
          showToast?.('Snippet exported to PDF successfully!', 'success')
        }
      }
    } catch (err) {
      console.error('PDF Export Error:', err)
      showToast?.('Failed to export PDF. Please check the logs.', 'error')
    }
  }, [generateFullHtml, title, showToast, preProcessExportHtml])

  const handleExportWord = useCallback(async () => {
    try {
      let fullHtml = await generateFullHtml(true)

      fullHtml = await preProcessExportHtml(fullHtml)

      const parser = new DOMParser()
      const doc = parser.parseFromString(fullHtml, 'text/html')
      doc.querySelectorAll('script, style, link').forEach((el) => el.remove())
      fullHtml = doc.body.innerHTML || doc.documentElement.innerHTML

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

  return {
    generateFullHtml,
    handleOpenExternalPreview,
    handleOpenMiniPreview,
    handleCopyToClipboard,
    handleExportPDF,
    handleExportWord,
    preProcessExportHtml,
    sanitizeExportHtml
  }
}
