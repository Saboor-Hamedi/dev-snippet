/**
 * Lightweight, lightning-fast Markdown-to-HTML converter.
 * Designed for "Large File Mode" to avoid the overhead of React components
 * when rendering 10,000+ line documents.
 */

export const fastMarkdownToHtml = (text, existingTitles = []) => {
  if (!text) return ''

  // 1. Protect Code Blocks & Multi-line sections
  const placeholders = []
  let processed = text

  // Fenced Code Blocks (```) - Stricter matching at start of line
  // This prevents inline ` ``` ` from swallowing the whole document
  processed = processed.replace(
    /(?:^|\n)```(\w+)?\b[^\n]*\n([\s\S]*?)```/g,
    (match, lang, code) => {
      const id = `__CODE_BLOCK_${placeholders.length}__`
      const escaped = code.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      let content = ''

      if (lang === 'mermaid') {
        content = `<div class="mermaid-diagram">${escaped}</div>`
      } else {
        content = `
          <div class="code-block-wrapper">
            <div class="code-block-header">
              <span class="code-language">${lang || 'text'}</span>
              <button class="copy-code-btn" data-code="${escaped}" title="Copy code">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
            </div>
            <pre><code class="language-${lang || 'text'}">${escaped}</code></pre>
          </div>`
      }
      placeholders.push({ id, content })
      return `\n${id}`
    }
  )

  // 2. Tables (GFM Style)
  processed = processed.replace(
    /^\|(.+)\|\r?\n\|([-| :]+)\|\r?\n((?:\|.+\|\r?\n?)*)/gm,
    (match, header, separator, rows) => {
      const headers = header
        .split('|')
        .filter((h) => h.trim())
        .map((h) => `<th>${h.trim()}</th>`)
        .join('')
      const bodyRows = rows
        .trim()
        .split('\n')
        .map((row) => {
          const cells = row
            .split('|')
            .filter((c, i, arr) => (i > 0 && i < arr.length - 1) || c.trim())
            .map((c) => `<td>${c.trim()}</td>`)
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('')
      const id = `__TABLE_${placeholders.length}__`
      placeholders.push({
        id,
        content: `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`
      })
      return id
    }
  )

  // Inline Code (`code`)
  processed = processed.replace(/`([^`\n]+)`/g, (match, code) => {
    const id = `__INLINE_CODE_${placeholders.length}__`
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    placeholders.push({ id, content: `<code>${escaped}</code>` })
    return id
  })

  // 2. Structural & Inline formatting on the "Protected" text
  processed = processed
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*\*(.*)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // GitHub Alerts [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
    .replace(
      /(?:^|\n)(?:> )?\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][^\n\S]*(.*)?(\r?\n(?:> ?.*(?:\n> ?.*)*))?(?=\n\n|\n$|$)/gi,
      (match, type, sameLineText, content) => {
        const icon = { NOTE: 'ⓘ', TIP: '💡', IMPORTANT: '❗', WARNING: '⚠️', CAUTION: '🛑' }[
          type.toUpperCase()
        ]
        const currentText = (sameLineText || '').trim()
        const bodyText = content
          ? content
              .trim()
              .split('\n')
              .map((l) => l.replace(/^> ?/, ''))
              .join(' ')
          : ''
        const fullContent = [currentText, bodyText].filter(Boolean).join('<br>')
        return `<div class="markdown-alert markdown-alert-${type.toLowerCase()}"><p class="markdown-alert-title">${icon} ${type.toUpperCase()}</p><p>${fullContent}</p></div>`
      }
    )
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    // WikiLinks [[Title]]
    .replace(/\[\[(.*?)\]\]/g, (match, title) => {
      const exists = existingTitles.map((t) => t.toLowerCase()).includes(title.toLowerCase().trim())
      const ghostClass = exists ? '' : 'is-ghost'
      return `<span class="preview-quicklink ${ghostClass}" data-title="${title}">${title}</span>`
    })
    // Tags #tag and @mention
    .replace(/(^|\s)([#@][a-zA-Z0-9_-]+)/g, (match, space, tag) => {
      const type = tag.startsWith('@') ? 'mention' : 'tag'
      return `${space}<span class="preview-${type}">${tag}</span>`
    })
    // Horizontal Rules (---)
    .replace(/^---$/gm, '<hr>')
    // Checkboxes [ ] and [x]
    .replace(/^[\s]*[-|\*]\s\[\s\]\s(.*)$/gm, '<li><input type="checkbox" disabled> $1</li>')
    .replace(/^[\s]*[-|\*]\s\[x\]\s(.*)$/gm, '<li><input type="checkbox" checked disabled> $1</li>')

  // Lists
  processed = processed.replace(/^[\s]*[\*][\s]+(.*)$/gm, '<li>$1</li>')
  processed = processed.replace(/^[\s]*[-][\s]+(.*)$/gm, '<li>$1</li>')
  processed = processed.replace(/^[\s]*\d+\.[\s]+(.*)$/gm, '<li>$1</li>')

  processed = processed.replace(
    /(?:^|\n)(<li>.*<\/li>(?:\r?\n<li>.*<\/li>)*)/g,
    (match, listItems) => {
      const isOrdered = match.trim().startsWith('1.') || match.trim().match(/^\d+\./)
      const tag = isOrdered ? 'ol' : 'ul'
      return `\n<${tag}>${listItems}</${tag}>`
    }
  )

  // 3. Paragraphs
  processed = processed
    .split('\n')
    .map((line) => {
      if (line.trim().startsWith('__CODE_BLOCK_') || line.trim().startsWith('__TABLE_')) return line
      if (line.match(/^<(h|block|div|pre|ul|ol|li|table)/)) return line
      if (!line.trim()) return '<br/>'
      return `<p>${line}</p>`
    })
    .join('\n')

  // 4. Restore Placeholders
  placeholders.forEach((p) => {
    processed = processed.replace(p.id, p.content)
  })

  return processed
}
