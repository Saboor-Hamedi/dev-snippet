/**
 * Lightweight, lightning-fast Markdown-to-HTML converter.
 *
 * Designed for "Large File Mode" to avoid the overhead of heavy parser components
 * when rendering massive documents (e.g., 10,000+ lines).
 *
 * It follows a "Protect & Replace" strategy:
 * 1. Structural blocks (code, tables, kanban) are converted to unique placeholders (§MDBLOCK...§).
 * 2. Inline styles (bold, links, etc.) are processed for the remaining text.
 * 3. Placeholders are restored at the final stage to ensure structural integrity is never broken.
 */

export const fastMarkdownToHtml = (text, existingTitles = [], renderIntel = true) => {
  if (!text) return ''

  // Normalize line endings to ensure regex anchors ($ and ^) behave consistently across OS platforms
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  /**
   * --- STEP 0: FRONTMATTER & METADATA ---
   * We look for YAML-style metadata at the top of the file to create a styled header card.
   */
  let metadataHtml = ''
  let processed = normalizedText.replace(/^---\n([\s\S]*?)\n---\n/, (match, yaml) => {
    const meta = {}
    yaml.split('\n').forEach((line) => {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase()
        const val = parts.slice(1).join(':').trim()
        meta[key] = val
      }
    })

    if (meta.title || meta.authors || meta.author) {
      metadataHtml = `
        <div class="preview-metadata-card">
          ${meta.title ? `<h1 class="meta-title">${meta.title}</h1>` : ''}
          <div class="meta-details">
            ${meta.authors || meta.author ? `<span class="meta-author">By ${meta.authors || meta.author}</span>` : ''}
            ${meta.date ? `<span class="meta-date">${meta.date}</span>` : ''}
          </div>
          ${meta.theme ? `<div class="meta-theme-pill">Theme: ${meta.theme}</div>` : ''}
        </div>`
    }
    return ''
  })

  // State for block protection
  const placeholders = []
  // Prefix/Suffix that no standard markdown regex will accidentally mutate
  const getPId = (idx) => `§MDBLOCK${idx}§`

  /**
   * --- STEP 1: BLOCK PROTECTION (Structural Components) ---
   * We replace complex UI blocks with placeholders so they don't get mangled
   * by bold/italic/link processing later.
   */

  // 1.1 Admonitions (Callouts) - Support for ::: info Summary \n content \n :::
  processed = processed.replace(
    /^:::\s*(\w+)\s*(.*)\n([\s\S]*?)\n:::/gm,
    (match, type, summary, content) => {
      const id = getPId(placeholders.length)
      const title = (summary.trim() || type.toUpperCase()).replace(/^#{1,6}\s+/, '')
      // Recursively parse inner content to support nested markdown inside the callout
      const renderedContent = fastMarkdownToHtml(content, existingTitles, false)
      placeholders.push({
        id,
        content: `<div class="admonition admonition-${type.toLowerCase()}"><p class="admonition-title">${title}</p><div class="admonition-content">${renderedContent}</div></div>`
      })
      return `\n\n${id}\n\n`
    }
  )

  // 1.2 Fenced Code Blocks (```) - Includes specialized Mermaid support and Language Headers
  processed = processed.replace(
    /(?:^|\n)```(\w+)?\b[^\n]*\n([\s\S]*?)\n```/g,
    (match, lang, code) => {
      const id = getPId(placeholders.length)
      // Standard HTML escaping to prevent XSS and ensure bracket characters display correctly
      const escaped = code
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

      const normalizedLang = (lang || '').toLowerCase()
      const hasSpecificLang =
        normalizedLang &&
        normalizedLang !== 'text' &&
        normalizedLang !== 'plaintext' &&
        normalizedLang !== 'txt'

      let content = ''
      if (normalizedLang === 'mermaid') {
        // Diagram blocks are rendered as raw text containers for the Mermaid runtime to pick up
        content = `<div class="mermaid-diagram-wrapper"><div class="mermaid">${code.trim()}</div></div>`
      } else if (hasSpecificLang) {
        // Language-specific blocks get a premium header with a copy button
        content = `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-language">${normalizedLang}</span><div class="code-actions"><button class="copy-image-btn" data-code="${escaped}" data-lang="${normalizedLang}" title="Copy as Image"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></button><button class="copy-code-btn" data-code="${escaped}" title="Copy code"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button></div></div><pre><code class="language-${normalizedLang}">${escaped}</code></pre></div>`
      } else {
        // Generic code blocks are kept clean and minimalist
        content = `<div class="code-block-wrapper generic-code-block"><pre><code class="language-plaintext">${escaped}</code></pre></div>`
      }
      placeholders.push({ id, content })
      return `\n${id}\n`
    }
  )

  // 1.3 GFM Tables - Robust multi-line table support with alignment detection
  processed = processed.replace(
    /^[ \t]*\|?(.+)\|[ \t]*\n[ \t]*\|?([-| :]+)\|[ \t]*\n((?:[ \t]*\|?.+\|[ \t]*\n?)*)/gm,
    (match, header, separator, rows) => {
      const getCells = (l) =>
        l
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((s) => s.trim())

      // Parse :---: patterns for text alignment
      const aligns = getCells(separator).map((s) => {
        if (s.startsWith(':') && s.endsWith(':')) return 'center'
        if (s.endsWith(':')) return 'right'
        return 'left'
      })

      const headers = getCells(header)
        .map((h, i) => `<th style="text-align: ${aligns[i] || 'left'}">${h}</th>`)
        .join('')

      const bodyRows = rows
        .trim()
        .split('\n')
        .filter((r) => r.trim())
        .map((row) => {
          const cells = getCells(row)
            .map((c, i) => `<td style="text-align: ${aligns[i] || 'left'}">${c}</td>`)
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('')

      const id = getPId(placeholders.length)
      placeholders.push({
        id,
        content: `<div class="table-wrapper"><table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table></div>`
      })
      return `\n${id}\n`
    }
  )

  // 1.4 Details/Collapsible Sections (??? Summary \n content \n ???)
  processed = processed.replace(
    /^(\?{3,})\s*(.*)\n([\s\S]*?)\n\1/gm,
    (match, prefix, summary, content) => {
      const id = getPId(placeholders.length)
      const renderedContent = fastMarkdownToHtml(content, existingTitles, false)
      placeholders.push({
        id,
        content: `<details class="preview-details"><summary>${summary || 'Details'}</summary><div class="details-content">${renderedContent}</div></details>`
      })
      return `\n\n${id}\n\n`
    }
  )

  /**
   * --- STEP 2: CUSTOM UI COMPONENT BLOCKS ---
   * Advanced layout components using specific [tag] notation.
   */

  // 2.1 Kanban Boards [kanban] - Converts ## headers and task lines into a visual board
  processed = processed.replace(/\[kanban\]([\s\S]*?)\[\/kanban\]/gi, (match, content) => {
    const id = getPId(placeholders.length)
    const cols = content
      .split(/^##\s+/m)
      .filter(Boolean)
      .map((c) => {
        const [title, ...items] = c.trim().split('\n')
        return `<div class="kanban-col"><div class="kanban-header">${title}</div><div class="kanban-tasks">${fastMarkdownToHtml(items.join('\n'), existingTitles)}</div></div>`
      })
      .join('')
    placeholders.push({ id, content: `<div class="preview-kanban">${cols}</div>` })
    return `\n${id}\n`
  })

  // 2.2 Tabbed Content [tabs] - Supports multiple tab panes using [tab: Label] notation
  processed = processed.replace(/\[tabs\]([\s\S]*?)\[\/tabs\]/gi, (match, content) => {
    const id = getPId(placeholders.length)
    const tabs = []
    let currentTab = null
    content.split('\n').forEach((line) => {
      const tabMatch = line.match(/^\[tab:\s*([^\]]+)\]/)
      if (tabMatch) {
        if (currentTab) tabs.push(currentTab)
        currentTab = { label: tabMatch[1], content: [] }
      } else if (currentTab) {
        currentTab.content.push(line)
      }
    })
    if (currentTab) tabs.push(currentTab)
    const tabsHtml = `<div class="preview-tabs" data-id="${id}">
      <div class="tabs-header">${tabs.map((t, i) => `<button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="window.switchTab('${id}', ${i})">${t.label}</button>`).join('')}</div>
      <div class="tabs-body">${tabs.map((t, i) => `<div class="tab-pane ${id}-${i} ${i === 0 ? 'active' : ''}">${fastMarkdownToHtml(t.content.join('\n'), existingTitles)}</div>`).join('')}</div>
    </div>`
    placeholders.push({ id, content: tabsHtml })
    return `\n${id}\n`
  })

  // 2.3 Grid Layouts [grid: 2] - Multi-column layouts
  processed = processed.replace(
    /\[grid:\s*(\d+)\]([\s\S]*?)\[\/grid\]/gi,
    (match, cols, content) => {
      const id = getPId(placeholders.length)
      const gridContent = content
        .trim()
        .split('\n\n')
        .map((block) => `<div class="grid-col">${block}</div>`)
        .join('')
      placeholders.push({
        id,
        content: `<div class="preview-grid" style="--grid-cols: ${cols}">${gridContent}</div>`
      })
      return `\n${id}\n`
    }
  )

  // 2.4 Timelines [timeline] - Historical or event tracking view
  processed = processed.replace(/\[timeline\]([\s\S]*?)\[\/timeline\]/gi, (match, content) => {
    const id = getPId(placeholders.length)
    const items = content
      .trim()
      .split('\n')
      .map((line) => {
        const parts = line.split(':')
        const date = parts[0] || ''
        const rest = parts.slice(1).join(':')
        return `<div class="timeline-item"><div class="timeline-date">${date.trim()}</div><div class="timeline-content">${rest.trim()}</div></div>`
      })
      .join('')
    placeholders.push({ id, content: `<div class="preview-timeline">${items}</div>` })
    return `\n${id}\n`
  })

  // 2.5 Quick Bar Charts [bar: 10,20,30]
  processed = processed.replace(/\[bar:\s*([\d,\s]+)\]/gi, (match, valuesStr) => {
    const id = getPId(placeholders.length)
    const values = valuesStr.split(',').map((v) => parseFloat(v.trim()))
    const max = Math.max(...values, 1)
    const barHtml = values
      .map((v) => {
        const height = (v / max) * 100
        return `<div class="bar-container"><div class="bar-fill" style="height: ${height}%" title="${v}"></div></div>`
      })
      .join('')
    placeholders.push({ id, content: `<div class="preview-bar-chart">${barHtml}</div>` })
    return id
  })

  /**
   * --- STEP 3: CORE TEXT FORMATTING (Inline Decorators) ---
   * Standard Markdown syntax processing line-by-line or globally.
   */

  // 3.1 Headings # - Including auto-ID generation for sidebar syncing and deep links
  processed = processed.replace(/^[ \t]*(#{1,6})\s+(.+)$/gm, (match, hashes, title) => {
    const level = hashes.length
    const id = title
      .replace(/\*{1,3}|_{1,3}|`+|\[\[|\]\]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
    return `<h${level} id="${id}">${title.trim()}</h${level}>`
  })

  // 3.2 Bold & Italic (Standard GFM syntax)
  processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
  processed = processed.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>')
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>')
  processed = processed.replace(/_(.*?)_/g, '<em>$1</em>')

  // 3.3 Inline Code Backticks
  processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // 3.4 Media & Links
  processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
  processed = processed.replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  processed = processed.replace(/~~(.*?)~~/g, '<del>$1</del>')
  processed = processed.replace(/==(.*?)==/g, '<mark>$1</mark>')

  // 3.5 WikiLinks [[Linked Note Title]] - Supports ghost state for non-existent notes
  processed = processed.replace(/\[\[(.*?)\]\]/g, (match, title) => {
    const exists = existingTitles.map((t) => t.toLowerCase()).includes(title.toLowerCase().trim())
    const ghostClass = exists ? '' : 'is-ghost'
    return `<span class="preview-quicklink ${ghostClass}" data-title="${title.trim()}">${title}</span>`
  })

  // 3.6 Auto-detection of URLs
  processed = processed.replace(
    /(^|\s)(https?:\/\/[^\s<]+)/g,
    '$1<a href="$2" target="_blank" class="preview-auto-link">$2</a>'
  )

  // 3.7 Social Mentions & Hashtags
  processed = processed.replace(/(^|\s)([#@][a-zA-Z0-9_-]+)/g, (match, space, tag) => {
    const isMention = tag.startsWith('@')
    const type = isMention ? 'mention' : 'tag'
    const dataAttr = isMention ? `data-mention="${tag}"` : `data-hashtag="${tag}"`
    return `${space}<span class="preview-${type}" ${dataAttr}>${tag}</span>`
  })

  // 3.8 Visual Ratings [rating: 4.5] & Badges [badge: label|value|color]
  processed = processed.replace(/\[rating:\s*([\d.]+)\]/gi, (match, score) => {
    const s = parseFloat(score)
    let stars = ''
    for (let i = 1; i <= 5; i++) {
      if (i <= s) stars += '★'
      else if (i - 0.5 <= s) stars += '½'
      else stars += '☆'
    }
    return `<span class="preview-rating" title="${score}/5">${stars}</span>`
  })
  processed = processed.replace(
    /\[badge:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]/gi,
    (match, label, value, color) => {
      return `<span class="preview-badge" style="--badge-color: ${color.trim()}"><span class="badge-label">${label.trim()}</span><span class="badge-value">${value.trim()}</span></span>`
    }
  )

  // 3.9 Footnotes Registry
  const footnotes = []
  processed = processed.replace(/^\[\^([^\]]+)\]:\s(.*)$/gm, (match, id, content) => {
    footnotes.push({ id, content: content.trim() })
    return ''
  })
  processed = processed.replace(/^(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '<hr>')

  // 3.10 List Blocks - Supports mixed nesting and ordered/unordered lists
  const listBlockRegex = /^((?:[\s]*(?:[*\-+]|\d+\.)[\s]+.*(?:\n|$))+)/gm
  processed = processed.replace(listBlockRegex, (match) => {
    const lines = match.split('\n').filter((l) => l.trim())
    let result = ''
    const stack = []
    lines.forEach((line) => {
      const parts = line.match(/^(\s*)([*\-+]|\d+\.)\s+(.*)$/)
      if (!parts) return
      const indent = parts[1].length
      const marker = parts[2]
      const content = parts[3]
      const isOrdered = /^\d/.test(marker)
      const tag = isOrdered ? 'ol' : 'ul'
      if (stack.length === 0 || indent > stack[stack.length - 1].indent) {
        stack.push({ indent, tag })
        result += `<${tag}><li>${content}`
      } else if (indent < stack[stack.length - 1].indent) {
        while (stack.length > 0 && indent < stack[stack.length - 1].indent)
          result += `</li></${stack.pop().tag}>`
        if (stack.length > 0 && stack[stack.length - 1].tag !== tag) {
          result += `</li></${stack.pop().tag}><${tag}><li>${content}`
          stack.push({ indent, tag })
        } else result += `</li><li>${content}`
      } else {
        if (stack[stack.length - 1].tag !== tag) {
          result += `</li></${stack.pop().tag}><${tag}><li>${content}`
          stack.push({ indent, tag })
        } else result += `</li><li>${content}`
      }
    })
    while (stack.length > 0) result += `</li></${stack.pop().tag}>`
    const id = getPId(placeholders.length)
    placeholders.push({ id, content: result })
    return `\n${id}\n`
  })

  /**
   * --- STEP 4: TYPOGRAPHY & WRAPPING ---
   */

  // 4.1 Unicode Symbols for arrows and legal marks
  processed = processed
    .replace(/--&gt;/g, '→')
    .replace(/&lt;--/g, '←')
    .replace(/\(c\)/gi, '©')
    .replace(/\(r\)/gi, '®')
    .replace(/\(tm\)/gi, '™')
    .replace(/\.\.\./g, '…')
    .replace(/:([a-z0-9_+]+):/g, (match, name) => {
      const emojis = {
        check: '✅',
        warning: '⚠️',
        error: '❌',
        info: 'ℹ️',
        rocket: '🚀',
        fire: '🔥',
        bulb: '💡',
        star: '⭐',
        heart: '❤️',
        memo: '📝',
        package: '📦',
        zap: '⚡'
      }
      return emojis[name] || match
    })

  // 4.2 Paragraph Injection - Wraps raw text blocks in <p> tags while skipping HTML blocks
  processed = processed
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return '<br/>'
      if (
        trimmed.startsWith('§MDBLOCK') ||
        trimmed.match(
          /^<(div|section|article|li|h|table|thead|tbody|tfoot|tr|th|td|blockquote|pre|ol|ul|details|p|hr|dl|dt|dd|strong|em|code)/i
        )
      )
        return line
      return `<p>${line}</p>`
    })
    .join('\n')

  /**
   * --- STEP 5: PLACEHOLDER RESTORATION ---
   * We swap placeholders back for the real HTML content in reverse order
   * to ensure structural stability.
   */
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const p = placeholders[i]
    processed = processed.split(p.id).join(p.content)
  }

  if (!renderIntel) return processed

  /**
   * --- STEP 6: INTELLIGENCE HEADER & FOOTNOTES ---
   */
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const readTime = Math.max(1, Math.ceil(words / 200))
  // Basic RTL support detection
  const isRTL = /[\u0600-\u06FF\u0590-\u05FF]/.test(text)
  const directionClass = isRTL ? 'is-rtl' : 'is-ltr'
  const intelHeader = `<div class="preview-intel"><span>${words} words</span> • <span>${readTime} min read</span></div>`

  let footnotesSection = ''
  if (footnotes.length > 0) {
    footnotesSection = `<div class="preview-footnotes"><hr/><ol>${footnotes.map((fn) => `<li id="fn-${fn.id}">${fn.content} <a href="#fnref-${fn.id}">↩</a></li>`).join('')}</ol></div>`
  }

  return `<div class="${directionClass}">${intelHeader}${metadataHtml}${processed}${footnotesSection}</div>`
}
