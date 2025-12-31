import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import rehypeHighlight from 'rehype-highlight'
import { visit } from 'unist-util-visit'

/**
 * Custom Remark Plugin to handle Task Lists ([ ], [x], [X])
 */
function tasklistPlugin() {
  return (tree) => {
    // 1. Handle Standard List Items
    visit(tree, 'listItem', (node) => {
      const firstChild = node.children[0]
      if (firstChild && (firstChild.type === 'paragraph' || firstChild.type === 'text')) {
        // Find the actual text node
        const textNode = firstChild.type === 'text' ? firstChild : firstChild.children?.[0]
        if (textNode && textNode.type === 'text') {
          const match = textNode.value.match(/^\s*\[([ xX])\]\s?/)
          if (match) {
            const isChecked = match[1].toLowerCase() === 'x'
            node.checked = isChecked
            textNode.value = textNode.value.replace(/^\s*\[([ xX])\]\s?/, '')

            const data = node.data || (node.data = {})
            const props = data.hProperties || (data.hProperties = {})
            props.className = props.className || []
            if (!props.className.includes('task-list-item')) {
              props.className.push('task-list-item')
            }
          }
        }
      }

      // Ensure class is applied even if GFM handled the checked state
      if (typeof node.checked === 'boolean') {
        const data = node.data || (node.data = {})
        const props = data.hProperties || (data.hProperties = {})
        props.className = props.className || []
        if (!props.className.includes('task-list-item')) {
          props.className.push('task-list-item')
        }
      }
    })

    // 2. Handle Bare Checkboxes
    visit(tree, 'paragraph', (node) => {
      const firstText = node.children[0]
      if (firstText && firstText.type === 'text' && !node.data?.hName) {
        const match = firstText.value.match(/^\s*\[([ xX])\]\s?/)
        if (match) {
          const checked = match[1].toLowerCase() === 'x'
          const data = node.data || (node.data = {})
          data.hName = 'div'
          data.hProperties = {
            className: ['task-list-item', 'bare-task'],
            style: 'display: flex; align-items: flex-start; gap: 8px;'
          }

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

/**
 * Custom Remark Plugin to handle Wiki Links [[Name]]
 */
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
        // Use HTML type for maximum compatibility with rehype-raw
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
        // Skip the newly added children
        return index + children.length
      }
    })
  }
}

/**
 * Custom Remark Plugin to handle Mermaid diagrams and specific UI wrappers
 */
function customCodePlugin() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid') {
        const escaped = node.value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')

        const encoded = encodeURIComponent(node.value)

        const ICON_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`
        const ICON_COPY = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`

        const html = `
          <div class="mermaid-diagram-wrapper" style="display: flex !important; flex-direction: column !important; width: 100% !important; background: var(--color-bg-secondary) !important; border: 1px solid var(--color-border) !important; border-radius: 12px !important; margin: 2rem 0 !important; box-sizing: border-box !important; shadow: var(--box-shadow-premium) !important; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5) !important;">
              <div class="code-block-header" style="display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 12px 20px !important; background: var(--color-bg-tertiary) !important; backdrop-filter: blur(12px) saturate(180%) !important; border-bottom: 1px solid var(--color-border) !important; width: 100% !important; box-sizing: border-box !important; flex-shrink: 0 !important; height: 44px !important;">
                <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #ff5f56; box-shadow: 0 0 6px #ff5f5666; border: 0.5px solid rgba(0,0,0,0.1); margin: 0 !important; padding: 0 !important;"></div>
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #ffbd2e; box-shadow: 0 0 6px #ffbd2e66; border: 0.5px solid rgba(0,0,0,0.1); margin: 0 !important; padding: 0 !important;"></div>
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #27c93f; box-shadow: 0 0 6px #27c93f66; border: 0.5px solid rgba(0,0,0,0.1); margin: 0 !important; padding: 0 !important;"></div>
                </div>
                <div class="code-actions" style="display: flex !important; gap: 10px !important; align-items: center !important;">
                  <button class="copy-image-btn" data-code="${encoded}" data-lang="mermaid" title="Export as Image" style="background: transparent !important; border: none !important; cursor: pointer !important; color: var(--color-text-tertiary) !important; padding: 6px !important; border-radius: 6px !important; display: flex !important; align-items: center !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); hover:background: rgba(255,255,255,0.05) !important;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </button>
                  <button class="copy-code-btn" data-code="${encoded}" title="Copy Mermaid Source" style="background: transparent !important; border: none !important; cursor: pointer !important; color: var(--color-text-tertiary) !important; padding: 6px !important; border-radius: 6px !important; display: flex !important; align-items: center !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); hover:background: rgba(255,255,255,0.05) !important;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
              </div>
            <div class="mermaid" data-mermaid-src="${encoded}" style="display: flex !important; justify-content: center !important; width: 100% !important; padding: 40px 20px !important; background: var(--color-bg-primary) !important; box-sizing: border-box !important; position: relative !important; overflow: visible !important; min-height: 150px !important;">${escaped}</div>
          </div>
        `

        // Replace with HTML node
        parent.children.splice(index, 1, { type: 'html', value: html })
      }
    })
  }
}

/**
 * Custom Remark Plugin to handle ::: callouts using remark-directive
 */
function directivePlugin() {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const data = node.data || (node.data = {})
        const type = node.name.toLowerCase()

        // Map to our CSS classes
        data.hName = 'div'
        data.hProperties = {
          class: `admonition admonition-${type}`
        }

        // Extract title if provided ::: info [Title]
        const label = node.attributes?.label || type.toUpperCase()

        // Prepend title as a paragraph
        node.children.unshift({
          type: 'paragraph',
          data: {
            hName: 'p',
            hProperties: { class: 'admonition-title' }
          },
          children: [{ type: 'text', value: label }]
        })
      }
    })
  }
}

/**
 * Central Markdown Parser Engine
 * Standardizes rendering across the entire application.
 */
const mdParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkDirective)
  .use(directivePlugin)
  .use(wikiLinkPlugin)
  .use(tasklistPlugin)
  .use(customCodePlugin)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(rehypeStringify)

/**
 * Simple synchronous parser for nested content in specialty blocks.
 */
const syncMDParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(wikiLinkPlugin)
  .use(tasklistPlugin)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)

/**
 * Custom Pre-processor for Specialty UI Blocks ([kanban], [tabs], [grid])
 */
const preProcessSpecialtyBlocks = (text) => {
  let processed = text
  const placeholders = []

  // 1. Kanban [kanban]
  processed = processed.replace(/\[kanban\]([\s\S]*?)\[\/kanban\]/gi, (match, content) => {
    const pId = `§BLOCK${placeholders.length}§`
    const cols = content
      .split(/^##\s+/m)
      .filter(Boolean)
      .map((c) => {
        const lines = c.trim().split('\n')
        const title = lines[0]
        const items = lines.slice(1).join('\n')
        const innerHtml = syncMDParser.processSync(items).toString()
        return `<div class="kanban-col"><div class="kanban-header">${title}</div><div class="kanban-tasks">${innerHtml}</div></div>`
      })
      .join('')
    placeholders.push({ id: pId, html: `<div class="preview-kanban">${cols}</div>` })
    return pId
  })

  // 2. Tabs [tabs]
  processed = processed.replace(/\[tabs\]([\s\S]*?)\[\/tabs\]/gi, (match, content) => {
    const pId = `§BLOCK${placeholders.length}§`
    const tabs = []
    let currentTab = null
    content.split('\n').forEach((line) => {
      const tabMatch = line.match(/^\[tab:\s*([^\]]+)\]/)
      if (tabMatch) {
        if (currentTab) tabs.push(currentTab)
        currentTab = { label: tabMatch[1], lines: [] }
      } else if (currentTab) {
        currentTab.lines.push(line)
      }
    })
    if (currentTab) tabs.push(currentTab)

    const tabsHtml = `
      <div class="preview-tabs" data-id="${pId}">
        <div class="tabs-header">
          ${tabs.map((t, i) => `<button class="tab-btn ${i === 0 ? 'active' : ''}">${t.label}</button>`).join('')}
        </div>
        <div class="tabs-body">
          ${tabs.map((t, i) => `<div class="tab-pane ${i === 0 ? 'active' : ''}">${syncMDParser.processSync(t.lines.join('\n')).toString()}</div>`).join('')}
        </div>
      </div>`
    placeholders.push({ id: pId, html: tabsHtml })
    return pId
  })

  return { text: processed, placeholders }
}

/**
 * Global Cache to prevent redundant parsing cycles.
 */
const _parseCache = {
  text: null,
  options: null,
  result: null
}

/**
 * markdownToHtml - The "DRY" export function.
 */
export const markdownToHtml = async (text, options = {}) => {
  if (text === undefined || text === null) return ''

  // 0. QUICK CACHE CHECK: If content and options match last render, return cached string.
  if (
    _parseCache.text === text &&
    JSON.stringify(_parseCache.options) === JSON.stringify(options)
  ) {
    return _parseCache.result
  }

  if (text === undefined || text === null) return ''

  // 1. Handle Frontmatter Extraction
  let metadata = {}
  const content = text.replace(/^---\n([\s\S]*?)\n---\n/, (match, yaml) => {
    yaml.split('\n').forEach((line) => {
      const [key, ...val] = line.split(':')
      if (key && val.length) metadata[key.trim().toLowerCase()] = val.join(':').trim()
    })
    return ''
  })

  // 2. Pre-process Specialty Blocks
  const { text: preProcessed, placeholders } = preProcessSpecialtyBlocks(content)

  // 3. Unified Core Pulse
  const result = await mdParser.process(preProcessed || ' ')
  let html = result.toString()

  // 4. Restore Specialty Placeholders
  placeholders.forEach((p) => {
    html = html.replace(p.id, p.html)
  })

  // 5. Intelligence & Metadata Card
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length
  const readTime = Math.max(1, Math.ceil(words / 200))
  const isRTL = /[\u0600-\u06FF\u0590-\u05FF]/.test(content || '')

  const intelHeader = `<div class="preview-intel"><span>${words} words</span> • <span>${readTime} min read</span></div>`

  let metadataHtml = ''
  if (options.renderMetadata && (metadata.title || metadata.author)) {
    metadataHtml = `
      <div class="preview-metadata-card" style="padding: 40px 0 !important; background: transparent !important; margin-bottom: 40px !important; border: none !important; border-bottom: 1px solid var(--color-border) !important; text-align: left !important;">
        ${metadata.title ? `<h1 class="meta-title" style="margin-left: 0 !important; padding-left: 0 !important;">${metadata.title}</h1>` : ''}
        ${metadata.author ? `<div class="meta-details" style="display: flex; justify-content: flex-start; gap: 24px;">By ${metadata.author}</div>` : ''}
        ${metadata.theme ? `<div class="meta-theme-pill">${metadata.theme}</div>` : ''}
      </div>`
  }

  // Wrap in direction container
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

export default markdownToHtml
