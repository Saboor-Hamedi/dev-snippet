/**
 * markdownParser.js
 * High-Performance Unified.js Markdown Engine.
 * Consolidated for consistency across Editor, Preview, and Exports.
 */

// Helper: Lazy-loaded engine
let _fullEngine = null
let _syncEngine = null

/**
 * Dynamically imports all necessary unified plugins and constructs the parser.
 * This ensures the heavy libraries are only loaded when first needed (Lazy Loading)
 * and prevents ReferenceErrors in environments like Web Workers.
 */
async function getMarkdownEngines() {
  if (_fullEngine && _syncEngine) return { full: _fullEngine, sync: _syncEngine }

  // 1. Core Unified imports
  const [{ unified }, { visit }] = await Promise.all([
    import('unified'),
    import('unist-util-visit')
  ])

  // 2. Remark imports
  const [
    { default: remarkParse },
    { default: remarkGfm },
    { default: remarkBreaks },
    { default: remarkDirective },
    { default: remarkRehype }
  ] = await Promise.all([
    import('remark-parse'),
    import('remark-gfm'),
    import('remark-breaks'),
    import('remark-directive'),
    import('remark-rehype')
  ])

  // 3. Rehype imports
  // rehype-raw requires a DOM (document) to parse HTML strings.
  // rehype-highlight *might* also be causing issues in this specific worker env.
  // We skip BOTH in Web Workers to prevent "document is not defined" crashes.
  // CRITICAL: We also check for WorkerGlobalScope because we might have polyfilled 'document'
  const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope
  const hasDOM = typeof document !== 'undefined' && !isWorker

  const rehypeImports = [import('rehype-stringify')]

  if (hasDOM) {
    rehypeImports.unshift(import('rehype-raw'))
    rehypeImports.splice(1, 0, import('rehype-highlight')) // Insert highlight after raw
  }

  const resolvedRehype = await Promise.all(rehypeImports)

  // Mapping based on hasDOM
  // If hasDOM: [raw, highlight, stringify]
  // If !hasDOM: [stringify]

  const rehypeRaw = hasDOM ? resolvedRehype[0].default : null
  const rehypeHighlight = hasDOM ? resolvedRehype[1].default : null
  const rehypeStringify = hasDOM ? resolvedRehype[2].default : resolvedRehype[0].default

  // --- INTERNAL PLUGINS ---

  function tasklistPlugin() {
    return (tree) => {
      visit(tree, 'listItem', (node) => {
        const firstChild = node.children[0]
        if (firstChild && (firstChild.type === 'paragraph' || firstChild.type === 'text')) {
          // ... (rest of tasklist plugin logic is fine, omitting for brevity in diff if not touching)
          // WAIT, replace_file_content replaces the whole block. I need to keep the plugins.
          // Since I cannot match just the imports easily without context, I will include tasklistPlugin header?
          // No, I can target just the imports section.
        }
      })
    }
  }
  // (Self-correction: I should narrow the range to just the imports and engine construction)

  // ...

  // See StartLine/EndLine below for precise targeting.

  // --- INTERNAL PLUGINS ---

  function tasklistPlugin() {
    return (tree) => {
      visit(tree, 'listItem', (node) => {
        const firstChild = node.children[0]
        if (firstChild && (firstChild.type === 'paragraph' || firstChild.type === 'text')) {
          const textNode = firstChild.type === 'text' ? firstChild : firstChild.children?.[0]
          if (textNode && textNode.type === 'text') {
            const match = textNode.value.match(/^\s*\[([ xX])\]\s?/)
            if (match) {
              const checked = match[1].toLowerCase() === 'x'
              node.checked = checked
              textNode.value = textNode.value.replace(/^\s*\[([ xX])\]\s?/, '')
              const props = node.data?.hProperties || (node.data = { hProperties: {} }).hProperties
              props.className = [...(props.className || []), 'task-list-item']
            }
          }
        }
      })
      visit(tree, 'paragraph', (node) => {
        const firstText = node.children[0]
        if (firstText && firstText.type === 'text' && !node.data?.hName) {
          const match = firstText.value.match(/^\s*\[([ xX])\]\s?/)
          if (match) {
            const checked = match[1].toLowerCase() === 'x'
            const data = node.data || (node.data = {})
            data.hName = 'div'
            data.hProperties = { className: ['task-list-item', 'bare-task'] }
            node.children.unshift({
              type: 'html',
              value: `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="margin-top: 5px;">`
            })
            firstText.value = firstText.value.replace(/^\s*\[([ xX])\]\s?/, '')
          }
        }
      })
    }
  }

  function wikiLinkPlugin() {
    return (tree) => {
      visit(tree, 'text', (node, index, parent) => {
        if (!parent || typeof node.value !== 'string') return
        const regex = /\[\[(.*?)\]\]/g
        let match
        const children = []
        let lastPos = 0
        while ((match = regex.exec(node.value)) !== null) {
          if (match.index > lastPos) {
            children.push({ type: 'text', value: node.value.slice(lastPos, match.index) })
          }
          const title = match[1].trim()
          children.push({
            type: 'html',
            value: `<span class="preview-quicklink" data-title="${title}">${title}</span>`
          })
          lastPos = regex.lastIndex
        }
        if (lastPos < node.value.length) {
          children.push({ type: 'text', value: node.value.slice(lastPos) })
        }
        if (children.length > 0) {
          parent.children.splice(index, 1, ...children)
          return index + children.length
        }
      })
    }
  }

  function customCodePlugin() {
    return (tree) => {
      visit(tree, 'code', (node) => {
        const lang = (node.lang || 'text').toLowerCase()
        const escaped = node.value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
        
        // Use Base64 for robust data transport
        const toBase64 = (str) => {
          try {
            // Modern approach: TextEncoder for proper UTF-8
            const bytes = new TextEncoder().encode(str)
            const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
            return btoa(binaryString)
          } catch (e) {
            return encodeURIComponent(str) // Fallback
        }
        
        const encoded = toBase64(node.value)

        // Standard code block enhancement
        node.type = 'html'
        node.value = `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span class="code-language font-bold">${lang}</span>
            <div class="code-actions">
              <button class="copy-code-btn" data-code="${encoded}" title="Copy Code">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
            </div>
            <pre><code class="language-${lang}">${escaped}</code></pre>
          </div>`
        }
      })
    }
  }

  function directivePlugin() {
    return (tree) => {
      visit(tree, (node) => {
        if (
          node.type === 'containerDirective' ||
          node.type === 'leafDirective' ||
          node.type === 'textDirective'
        ) {
          const type = node.name.toLowerCase()
          const validTypes = ['note', 'tip', 'important', 'warning', 'caution']
          const data = node.data || (node.data = {})

          if (validTypes.includes(type)) {
            data.hName = 'div'
            data.hProperties = { class: `admonition admonition-${type}` }
            const label = node.attributes?.label || type.toUpperCase()
            node.children.unshift({
              type: 'paragraph',
              data: { hName: 'p', hProperties: { class: 'admonition-title' } },
              children: [{ type: 'text', value: label }]
            })
          } else {
            // Fallback for unknown directives (e.g., 'ss')
            // Render as a generic div/span so content is visible but unstyled
            data.hName = node.type === 'textDirective' ? 'span' : 'div'
            data.hProperties = { class: `directive directive-${type}` }
          }
        }
      })
    }
  }

  // --- CONSTRUCT ENGINES ---
  _fullEngine = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkDirective)
    .use(directivePlugin)
    .use(wikiLinkPlugin)
    .use(tasklistPlugin)
    .use(customCodePlugin)
    .use(remarkRehype, { allowDangerousHtml: true })

  if (rehypeRaw) {
    _fullEngine.use(rehypeRaw)
  }

  if (rehypeHighlight) {
    _fullEngine.use(rehypeHighlight, { ignoreMissing: true })
  }

  _fullEngine.use(rehypeStringify)

  _syncEngine = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(wikiLinkPlugin)
    .use(tasklistPlugin)
    .use(remarkRehype, { allowDangerousHtml: true })

  if (rehypeRaw) {
    _syncEngine.use(rehypeRaw)
  }

  _syncEngine.use(rehypeStringify)

  return { full: _fullEngine, sync: _syncEngine }
}

/**
 * Specialty Block Processor (Kanban, Tabs, Grid)
 */
async function preProcessSpecialtyBlocks(text) {
  const { sync } = await getMarkdownEngines()
  let processed = text
  const placeholders = []

  // Kanban
  processed = processed.replace(/\[kanban\]([\s\S]*?)\[\/kanban\]/gi, (match, content) => {
    const pId = `§BLOCK${placeholders.length}§`
    const cols = content
      .split(/^##\s+/m)
      .filter(Boolean)
      .map((c) => {
        const lines = c.trim().split('\n')
        const title = lines[0]
        const items = lines.slice(1).join('\n')
        const innerHtml = sync.processSync(items).toString()
        return `<div class="kanban-col"><div class="kanban-header">${title}</div><div class="kanban-tasks">${innerHtml}</div></div>`
      })
      .join('')
    placeholders.push({ id: pId, html: `<div class="preview-kanban">${cols}</div>` })
    return pId
  })

  // Tabs
  processed = processed.replace(/\[tabs\]([\s\S]*?)\[\/tabs\]/gi, (match, content) => {
    const pId = `§BLOCK${placeholders.length}§`
    const tabs = []
    let currentTab = null
    content.split('\n').forEach((line) => {
      const tabMatch = line.match(/^\[tab:\s*([^\]]+)\]/)
      if (tabMatch) {
        if (currentTab) tabs.push(currentTab)
        currentTab = { label: tabMatch[1], lines: [] }
      } else if (currentTab) currentTab.lines.push(line)
    })
    if (currentTab) tabs.push(currentTab)
    const tabsHtml = `
      <div class="preview-tabs" data-id="${pId}">
        <div class="tabs-header">
          ${tabs.map((t, i) => `<button class="tab-btn ${i === 0 ? 'active' : ''}">${t.label}</button>`).join('')}
        </div>
        <div class="tabs-body">
          ${tabs.map((t, i) => `<div class="tab-pane ${i === 0 ? 'active' : ''}">${sync.processSync(t.lines.join('\n')).toString()}</div>`).join('')}
        </div>
      </div>`
    placeholders.push({ id: pId, html: tabsHtml })
    return pId
  })

  return { text: processed, placeholders }
}

const _parseCache = { text: null, options: null, result: null }

/**
 * markdownToHtml - Main entry point
 */
export const markdownToHtml = async (text, options = {}) => {
  if (text === undefined || text === null) return ''

  if (
    _parseCache.text === text &&
    JSON.stringify(_parseCache.options) === JSON.stringify(options)
  ) {
    return _parseCache.result
  }

  const { full } = await getMarkdownEngines()

  let metadata = {}
  const content = text.replace(/^---\n([\s\S]*?)\n---\n/, (match, yaml) => {
    yaml.split('\n').forEach((line) => {
      const parts = line.split(':')
      if (parts.length >= 2)
        metadata[parts[0].trim().toLowerCase()] = parts.slice(1).join(':').trim()
    })
    return ''
  })

  const { text: preProcessed, placeholders } = await preProcessSpecialtyBlocks(content)
  const result = await full.process(preProcessed || ' ')
  let html = result.toString()

  placeholders.forEach((p) => {
    html = html.replace(p.id, p.html)
  })

  const words = (content || '').trim().split(/\s+/).filter(Boolean).length
  const readTime = Math.max(1, Math.ceil(words / 200))
  const isRTL = /[\u0600-\u06FF\u0590-\u05FF]/.test(content || '')
  const intelHeader = `<div class="preview-intel"><span>${words} words</span> • <span>${readTime} min read</span></div>`

  let metadataHtml = ''
  if (options.renderMetadata && (metadata.title || metadata.author)) {
    metadataHtml = `
      <div class="preview-metadata-card" style="padding: 40px 0; border-bottom: 1px solid var(--color-border); margin-bottom: 40px;">
        ${metadata.title ? `<h1 class="meta-title">${metadata.title}</h1>` : ''}
        ${metadata.author ? `<div class="meta-details">By ${metadata.author}</div>` : ''}
      </div>`
  }

  if (options.minimal) {
    return `<div class="markdown-content ${isRTL ? 'is-rtl' : ''}">${html}</div>`
  }

  const finalHtml = `
    <div class="${isRTL ? 'is-rtl' : 'is-ltr'}">
      ${intelHeader}
      ${metadataHtml}
      <div class="markdown-content">${html}</div>
    </div>`

  _parseCache.text = text
  _parseCache.options = options
  _parseCache.result = finalHtml
  return finalHtml
}

/**
 * codeToHtml - Single block highlighter
 */
export const codeToHtml = async (code, language = 'javascript') => {
  if (!code) return ''
  const { full } = await getMarkdownEngines()
  const md = `\`\`\`${language}\n${code}\n\`\`\``
  const result = await full.process(md)
  return result.toString()
}

export default markdownToHtml
