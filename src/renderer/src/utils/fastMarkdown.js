/**
 * Lightweight, lightning-fast Markdown-to-HTML converter.
 * Designed for "Large File Mode" to avoid the overhead of React components
 * when rendering 10,000+ line documents.
 */

export const fastMarkdownToHtml = (text, existingTitles = []) => {
  if (!text) return ''

  // 0. Extract & Render Metadata (YAML Frontmatter style)
  let metadataHtml = ''
  let processed = text.replace(/^---[\r\n]([\s\S]*?)[\r\n]---[\r\n]/, (match, yaml) => {
    const meta = {}
    yaml.split('\n').forEach((line) => {
      const [key, ...val] = line.split(':')
      if (key && val.length) meta[key.trim().toLowerCase()] = val.join(':').trim()
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

  const placeholders = []

  // 1. Kanban Boards [kanban] ... [/kanban]
  processed = processed.replace(/\[kanban\]([\s\S]*?)\[\/kanban\]/gi, (match, content) => {
    const id = `__KANBAN_${placeholders.length}__`
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

  // 2. Tabbed Content [tabs] ... [/tabs]
  processed = processed.replace(/\[tabs\]([\s\S]*?)\[\/tabs\]/gi, (match, content) => {
    const id = `__TABS_${placeholders.length}__`
    const tabs = []
    let currentTab = null
    content.split('\n').forEach((line) => {
      const tabMatch = line.match(/^\[tab:\s*([^\]]+)\]/)
      if (tabMatch) {
        if (currentTab) tabs.push(currentTab)
        currentTab = { label: tabMatch[1], content: [] }
      } else if (currentTab) {
        if (currentTab) currentTab.content.push(line)
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

  // 2. Grid Layouts [grid: 3] ... [/grid]
  processed = processed.replace(
    /\[grid:\s*(\d+)\]([\s\S]*?)\[\/grid\]/gi,
    (match, cols, content) => {
      const id = `__GRID_${placeholders.length}__`
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

  // 2. Star Ratings [rating: 4.5]
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

  // 3. Simple Image Dimensions ![alt](url){w=100}
  processed = processed.replace(
    /!\[([^\]]*)\]\(([^)]+)\)\{w=(\d+)(?:,h=(\d+))?\}/g,
    (match, alt, url, w, h) => {
      const size = `width="${w}" ${h ? `height="${h}"` : ''}`
      return `<img src="${url}" alt="${alt}" ${size} class="preview-img-sized">`
    }
  )

  // 4. File Trees [tree] ... [/tree]
  processed = processed.replace(/\[tree\]([\s\S]*?)\[\/tree\]/gi, (match, content) => {
    const id = `__TREE_${placeholders.length}__`
    const treeLines = content
      .trim()
      .split('\n')
      .map((line) => {
        const indent = line.search(/\S/)
        const text = line.trim()
        const isFolder = text.endsWith('/')
        const icon = isFolder ? '📂' : '📄'
        return `<div class="tree-line" style="padding-left: ${indent * 12}px">${icon} ${text}</div>`
      })
      .join('')
    placeholders.push({ id, content: `<div class="preview-file-tree">${treeLines}</div>` })
    return `\n${id}\n`
  })

  // 2. Sparklines [spark: 10,20,50,30,90]
  processed = processed.replace(/\[spark:\s*([\d,\s]+)\]/gi, (match, valuesStr) => {
    const id = `__SPARK_${placeholders.length}__`
    const values = valuesStr.split(',').map((v) => parseFloat(v.trim()))
    const max = Math.max(...values, 1)
    const width = 100,
      height = 20
    const points = values
      .map((v, i) => `${(i / (values.length - 1)) * width},${height - (v / max) * height}`)
      .join(' ')
    const svg = `<svg width="${width}" height="${height}" class="preview-sparkline"><polyline fill="none" stroke="currentColor" stroke-width="2" points="${points}" /></svg>`
    placeholders.push({ id, content: svg })
    return id
  })

  // 2.5 QR Code Generation [qr: url]
  processed = processed.replace(/\[qr:\s*([^\]]+)\]/gi, (match, url) => {
    const cleanUrl = url.trim()
    const id = `__QR_${placeholders.length}__`
    placeholders.push({
      id,
      content: `
      <div class="preview-qr-wrapper">
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cleanUrl)}" class="preview-qr" />
        </div>
      </div>`
    })
    return id
  })

  // 3. Link References ( [id]: url ) - Scan and store first
  const linkRefs = {}
  processed = processed.replace(
    /^\[([^\]]+)\]:\s*(\S+)(?:\s+"([^"]+)")?$/gm,
    (match, id, url, title) => {
      linkRefs[id.toLowerCase()] = { url, title }
      return ''
    }
  )

  // 2. Table of Contents [TOC] - Scan headings and generate
  if (processed.includes('[TOC]')) {
    const headings = []
    const headingRegex = /^(#{1,3})\s+(.*)$/gm
    let headMatch
    while ((headMatch = headingRegex.exec(processed)) !== null) {
      const level = headMatch[1].length
      const title = headMatch[2].trim()
      const anchor = title.toLowerCase().replace(/\s+/g, '-')
      headings.push({ level, title, anchor })
    }
    const tocHtml =
      `<div class="preview-toc"><p class="toc-title">Table of Contents</p><ul>` +
      headings
        .map((h) => `<li class="toc-level-${h.level}"><a href="#${h.anchor}">${h.title}</a></li>`)
        .join('') +
      `</ul></div>`
    processed = processed.replace('[TOC]', tocHtml)
  }

  // 3. Interactive Timelines [timeline] ... [/timeline]
  processed = processed.replace(/\[timeline\]([\s\S]*?)\[\/timeline\]/gi, (match, content) => {
    const id = `__TIMELINE_${placeholders.length}__`
    const items = content
      .trim()
      .split('\n')
      .map((line) => {
        const [date, ...rest] = line.split(':')
        return `<div class="timeline-item"><div class="timeline-date">${date.trim()}</div><div class="timeline-content">${rest.join(':').trim()}</div></div>`
      })
      .join('')
    placeholders.push({ id, content: `<div class="preview-timeline">${items}</div>` })
    return `\n${id}\n`
  })

  // 4. Shields-style Badges [badge: label | value | color]
  processed = processed.replace(
    /\[badge:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]/gi,
    (match, label, value, color) => {
      return `<span class="preview-badge" style="--badge-color: ${color.trim()}"><span class="badge-label">${label.trim()}</span><span class="badge-value">${value.trim()}</span></span>`
    }
  )

  // 5. SVG Bar Charts [bar: 10, 40, 80, 20]
  processed = processed.replace(/\[bar:\s*([\d,\s]+)\]/gi, (match, valuesStr) => {
    const id = `__BAR_${placeholders.length}__`
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

  // 6. Keyboard arrows [[up]], [[down]], etc.
  const arrows = { up: '↑', down: '↓', left: '←', right: '→', enter: '↵', shift: '⇧', mac: '⌘' }
  processed = processed.replace(/\[\[(up|down|left|right|enter|shift|mac)\]\]/gi, (match, key) => {
    return `<kbd class="preview-kbd arrow-kbd">${arrows[key.toLowerCase()]}</kbd>`
  })

  // 7. Protect Code Blocks & Multi-line sections

  // Admonitions (::: type Summary \n content \n :::)
  const admonitionRegex = /^:::\s*(\w+)\s*(.*)[\r\n]([\s\S]*?)[\r\n]:::/gm
  processed = processed.replace(admonitionRegex, (match, type, summary, content) => {
    const id = `__ADMONITION_${placeholders.length}__`
    const title = summary.trim() || type.toUpperCase()
    placeholders.push({
      id,
      content: `<div class="admonition admonition-${type.toLowerCase()}"><p class="admonition-title">${title}</p><div class="admonition-content">${content}</div></div>`
    })
    return `\n${id}\n`
  })

  // Fenced Code Blocks (```)
  processed = processed.replace(
    /(?:^|\n)```(\w+)?\b[^\n]*\n([\s\S]*?)```/g,
    (match, lang, code) => {
      const id = `__CODE_BLOCK_${placeholders.length}__`
      const escaped = code
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
      let content = ''

      if (lang === 'mermaid') {
        content = `<div class="mermaid">${escaped}</div>`
      } else {
        content = `
          <div class="code-block-wrapper">
            <div class="code-block-header">
              <span class="code-language">${lang || 'text'}</span>
              <div class="code-actions">
                <button class="copy-image-btn" data-code="${escaped}" data-lang="${lang || 'text'}" title="Copy as Image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </button>
                <button class="copy-code-btn" data-code="${escaped}" title="Copy code">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
            </div>
            <pre><code class="language-${lang || 'plaintext'}">${escaped}</code></pre>
          </div>`
      }
      placeholders.push({ id, content })
      return `\n${id}\n`
    }
  )

  // 2. Tables (GFM Style with Alignment)
  processed = processed.replace(
    /^\|(.+)\|\r?\n\|([-| :]+)\|\r?\n((?:\|.+\|\r?\n?)*)/gm,
    (match, header, separator, rows) => {
      const aligns = separator
        .split('|')
        .filter((s) => s.trim())
        .map((s) => {
          if (s.startsWith(':') && s.endsWith(':')) return 'center'
          if (s.endsWith(':')) return 'right'
          return 'left'
        })

      const headers = header
        .split('|')
        .filter((h) => h.trim())
        .map((h, i) => `<th style="text-align: ${aligns[i] || 'left'}">${h.trim()}</th>`)
        .join('')

      const bodyRows = rows
        .trim()
        .split('\n')
        .map((row) => {
          const cells = row
            .split('|')
            .filter((c, i, arr) => (i > 0 && i < arr.length - 1) || c.trim())
            .map((c, i) => `<td style="text-align: ${aligns[i] || 'left'}">${c.trim()}</td>`)
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

  // Math Formatting places (Placeholders to prevent interference)
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    const id = `__MATH_BLOCK_${placeholders.length}__`
    placeholders.push({
      id,
      content: `<div class="preview-math block-math">$$\n${formula}\n$$</div>`
    })
    return id
  })

  // Inline Code (`code`)
  processed = processed.replace(/`([^`\n]+)`/g, (match, code) => {
    const id = `__INLINE_CODE_${placeholders.length}__`
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    placeholders.push({ id, content: `<code>${escaped}</code>` })
    return id
  })

  // 2. Blockquotes (Nested Support)
  const quoteBlockRegex = /(?:^|\n)((?:> ?.*(?:\n|$))+)/g
  processed = processed.replace(quoteBlockRegex, (match) => {
    const lines = match.trim().split('\n')
    let result = ''
    let depth = 0

    // Pro Alerts within quotes
    const alertPattern = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i

    lines.forEach((line) => {
      const quoteMatch = line.match(/^(> ?)+/)
      const newDepth = quoteMatch ? quoteMatch[0].replace(/ /g, '').length : 0
      let content = line.replace(/^(> ?)+/, '').trim()

      const alertMatch = content.match(alertPattern)
      if (alertMatch) {
        const type = alertMatch[1].toUpperCase()
        const icon = { NOTE: 'ⓘ', TIP: '💡', IMPORTANT: '❗', WARNING: '⚠️', CAUTION: '🛑' }[type]
        content = content.replace(alertPattern, '').trim()
        content = `<div class="markdown-alert markdown-alert-${type.toLowerCase()}"><p class="markdown-alert-title">${icon} ${type}</p><p>${content}</p></div>`
      } else {
        content = `<p>${content}</p>`
      }

      if (newDepth > depth) {
        result += '<blockquote>'.repeat(newDepth - depth)
      } else if (newDepth < depth) {
        result += '</blockquote>'.repeat(depth - newDepth)
      }
      depth = newDepth
      result += content
    })

    result += '</blockquote>'.repeat(depth)
    const id = `__QUOTE_${placeholders.length}__`
    placeholders.push({ id, content: result })
    return `\n${id}\n`
  })

  // 2. Comments (%% comment %%) - Remove immediately
  processed = processed.replace(/%%[\s\S]*?%%/g, '')

  // 3. Details/Collapsible (??? Summary \n content \n ???)
  const detailsRegex = /^(\?{3,})\s*(.*)[\r\n]([\s\S]*?)[\r\n]\1/gm
  processed = processed.replace(detailsRegex, (match, prefix, summary, content) => {
    const id = `__DETAILS_${placeholders.length}__`
    placeholders.push({
      id,
      content: `<details class="preview-details"><summary>${summary || 'Details'}</summary><div class="details-content">${content}</div></details>`
    })
    return `\n${id}\n`
  })

  // Typography & Emojis
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

  // Keyboard Keys (++Ctrl++)
  processed = processed.replace(/\+\+([^\+]+)\+\+/g, '<kbd class="preview-kbd">$1</kbd>')

  processed = processed
    .replace(
      /^# (.*$)/gm,
      (match, title) => `<h1 id="${title.toLowerCase().replace(/\s+/g, '-')}">${title}</h1>`
    )
    .replace(
      /^## (.*$)/gm,
      (match, title) => `<h2 id="${title.toLowerCase().replace(/\s+/g, '-')}">${title}</h2>`
    )
    .replace(
      /^### (.*$)/gm,
      (match, title) => `<h3 id="${title.toLowerCase().replace(/\s+/g, '-')}">${title}</h3>`
    )
    .replace(/\*\*\*(.*)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Strikethrough (~~text~~)
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Highlighting (==text==)
    .replace(/==(.*?)==/g, '<mark>$1</mark>')
    // WikiLinks [[Title]]
    .replace(/\[\[(.*?)\]\]/g, (match, title) => {
      const exists = existingTitles.map((t) => t.toLowerCase()).includes(title.toLowerCase().trim())
      const ghostClass = exists ? '' : 'is-ghost'
      return `<span class="preview-quicklink ${ghostClass}" data-title="${title}">${title}</span>`
    })
    // Auto-links (https://...)
    .replace(
      /(^|\s)(https?:\/\/[^\s<]+)/g,
      '$1<a href="$2" target="_blank" class="preview-auto-link">$2</a>'
    )
    // Tags #tag and @mention
    .replace(/(^|\s)([#@][a-zA-Z0-9_-]+)/g, (match, space, tag) => {
      const isMention = tag.startsWith('@')
      const type = isMention ? 'mention' : 'tag'
      const dataAttr = isMention ? `data-mention="${tag}"` : `data-hashtag="${tag}"`
      return `${space}<span class="preview-${type}" ${dataAttr}>${tag}</span>`
    })

  // Critique / Diff Markup ({{+ added +}}, {{- removed -}})
  processed = processed
    .replace(/\{\{\+(.*?)\+\}\}/g, '<ins class="preview-diff-add">$1</ins>')
    .replace(/\{\{-(.*?)-\}\}/g, '<del class="preview-diff-del">$1</del>')

  // Custom Color Tags {red}(text)
  processed = processed.replace(/\{([a-z]+)\}\((.*?)\)/gi, '<span style="color: $1">$2</span>')

  // Smart Hover Tooltips [hover: tip](text)
  processed = processed.replace(
    /\[hover:\s*([^\]]+)\]\(([^)]+)\)/gi,
    '<span class="preview-tooltip-trigger" data-tip="$1">$2</span>'
  )

  // Gradient Text {grad: purple-blue}(text)
  processed = processed.replace(/\{grad:\s*([a-z-]+)\}\((.*?)\)/gi, (match, theme, text) => {
    const gradients = {
      'purple-blue': 'linear-gradient(45deg, #a855f7, #3b82f6)',
      sunset: 'linear-gradient(45deg, #f59e0b, #ef4444)',
      emerald: 'linear-gradient(45deg, #10b981, #3b82f6)',
      fire: 'linear-gradient(45deg, #f97316, #dc2626)',
      ocean: 'linear-gradient(45deg, #0ea5e9, #2563eb)'
    }
    const style = gradients[theme] || 'linear-gradient(45deg, #888, #555)'
    return `<span style="background: ${style}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;">${text}</span>`
  })

  // Mathematical Expressions (MathJax/KaTeX delimiters $[]$)
  processed = processed.replace(
    /\$\[(.*?)\]\$/g,
    '<span class="preview-math-inline">\\($1\\)</span>'
  )
  processed = processed.replace(
    /\$\$\[([\s\S]*?)\]\$\$/g,
    '<div class="preview-math-block">\\[$1\\]</div>'
  )

  // Status Pulse Indicators (pulse: green)
  processed = processed.replace(
    /\(pulse:\s*([a-z]+)\)/gi,
    '<span class="status-pulse" style="--pulse-color: $1"></span>'
  )
  processed = processed.replace(
    /\(dot:\s*([a-z]+)\)/gi,
    '<span class="status-dot" style="background-color: $1"></span>'
  )

  // Collect Footnotes for proper bottom section
  const footnotes = []
  processed = processed
    .replace(/^\[\^([^\]]+)\]:\s(.*)$/gm, (match, id, content) => {
      footnotes.push({ id, content })
      return ''
    })

    // Horizontal Rules (---, ***, ___)
    .replace(/^(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '<hr>')

  // Progress Bars [progress: 70%]
  processed = processed
    .replace(/\[progress:\s*(\d+)%?\]/gi, (match, percent) => {
      return `<div class="preview-progress-wrapper"><div class="preview-progress-bar" style="width: ${percent}%"></div><span class="preview-progress-label">${percent}%</span></div>`
    })

    // Footnotes [^1]
    .replace(/\[\^([^\]]+)\](?!:)/g, '<sup class="footnote-ref"><a href="#fn-$1">$1</a></sup>')
    .replace(
      /^\[\^([^\]]+)\]:\s(.*)$/gm,
      '<div class="footnote-def" id="fn-$1"><span class="footnote-label">$1:</span> $2</div>'
    )
    // Superscript & Subscript (Obsidian style)
    .replace(/\^([^\^]+)\^/g, '<sup>$1</sup>')
    .replace(/~([^~]+)~/g, '<sub>$1</sub>')
    // Link References [text][id]
    .replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (match, text, id) => {
      const ref = linkRefs[id.toLowerCase()]
      return ref
        ? `<a href="${ref.url}" title="${ref.title || ''}" target="_blank">${text}</a>`
        : match
    })
    // Definition Lists (Term \n : Definition)
    .replace(/^([^:\n\r]+)\r?\n:\s+(.*)$/gm, '<dl><dt>$1</dt><dd>$2</dd></dl>')
    .replace(/<\/dl>\r?\n<dl>/g, '') // Merge adjacent lists
    // Checkboxes [ ] and [x]
    .replace(/^[\s]*[-|\*]\s\[\s\]\s(.*)$/gm, '<li><input type="checkbox" disabled> $1</li>')
    .replace(/^[\s]*[-|\*]\s\[x\]\s(.*)$/gm, '<li><input type="checkbox" checked disabled> $1</li>')

  // 3. Lists (Nested Support)
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

      // Open new nested list
      if (stack.length === 0 || indent > stack[stack.length - 1].indent) {
        stack.push({ indent, tag })
        result += `<${tag}><li>${content}`
      }
      // Outdent: Close nested lists
      else if (indent < stack[stack.length - 1].indent) {
        while (stack.length > 0 && indent < stack[stack.length - 1].indent) {
          result += `</li></${stack.pop().tag}>`
        }
        // Handle tag type change at same level after outdent
        if (stack.length > 0 && stack[stack.length - 1].tag !== tag) {
          result += `</li></${stack.pop().tag}><${tag}><li>${content}`
          stack.push({ indent, tag })
        } else {
          result += `</li><li>${content}`
        }
      }
      // Same Level
      else {
        // Handle tag type change at same level
        if (stack[stack.length - 1].tag !== tag) {
          result += `</li></${stack.pop().tag}><${tag}><li>${content}`
          stack.push({ indent, tag })
        } else {
          result += `</li><li>${content}`
        }
      }
    })

    // Close remaining tags
    while (stack.length > 0) {
      result += `</li></${stack.pop().tag}>`
    }

    const id = `__LIST_${placeholders.length}__`
    placeholders.push({ id, content: result })
    return `\n${id}\n`
  })

  // 4. Paragraphs
  processed = processed
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (
        trimmed.startsWith('__CODE_BLOCK_') ||
        trimmed.startsWith('__TABLE_') ||
        trimmed.startsWith('__LIST_')
      )
        return line
      if (line.match(/^<(h|block|div|pre|ul|ol|li|table)/)) return line
      if (!trimmed) return '<br/>'
      return `<p>${line}</p>`
    })
    .join('\n')

  // 5. Restore Placeholders
  placeholders.forEach((p) => {
    processed = processed.replace(p.id, p.content)
  })

  // 6. Snippet Intel (Word Count / Read Time / Tasks)
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const readTime = Math.max(1, Math.ceil(words / 200))

  // Tasks Count
  const totalTasks = (text.match(/^[ \t]*[-*]\s\[[ x]\]/gm) || []).length
  const completedTasks = (text.match(/^[ \t]*[-*]\s\[x\]/gm) || []).length
  const taskText = totalTasks > 0 ? ` • <span>${completedTasks}/${totalTasks} tasks</span>` : ''

  // RTL Detection (Simple Arabic/Hebrew check)
  const isRTL = /[\u0600-\u06FF\u0590-\u05FF]/.test(text)
  const directionClass = isRTL ? 'is-rtl' : 'is-ltr'

  // 7. Append Footnotes Section
  if (footnotes.length > 0) {
    processed +=
      `<div class="preview-footnotes"><hr/><ol>` +
      footnotes
        .map((fn) => `<li id="fn-${fn.id}">${fn.content} <a href="#fnref-${fn.id}">↩</a></li>`)
        .join('') +
      `</ol></div>`
  }

  // 8. Tabs Helper (Global Injection)
  const tabScript = `<script>
    window.switchTab = (id, index) => {
      const container = document.querySelector(\`[data-id="\${id}"]\`);
      if (!container) return;
      container.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
      });
      container.querySelectorAll('.tab-pane').forEach((pane, i) => {
        pane.classList.toggle('active', i === index);
      });
    };
  </script>`

  const intelHeader = `<div class="preview-intel"><span>${words} words</span> • <span>${readTime} min read</span>${taskText}</div>`

  return `<div class="${directionClass}">${intelHeader}${tabScript}${metadataHtml}${processed}</div>`
}
