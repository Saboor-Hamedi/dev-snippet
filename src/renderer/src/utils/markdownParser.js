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
    visit(tree, 'code', (node) => {
      if (node.lang === 'mermaid') {
        const data = node.data || (node.data = {})
        data.hName = 'div'
        data.hProperties = { class: 'mermaid-diagram-wrapper' }
        data.hChildren = [
          {
            type: 'element',
            tagName: 'div',
            properties: { class: 'mermaid' },
            children: [{ type: 'text', value: node.value }]
          }
        ]
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
 * markdownToHtml - The "DRY" export function.
 */
export const markdownToHtml = async (text, options = {}) => {
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
      <div class="preview-metadata-card">
        ${metadata.title ? `<h1 class="meta-title">${metadata.title}</h1>` : ''}
        ${metadata.author ? `<div class="meta-details">By ${metadata.author}</div>` : ''}
        ${metadata.theme ? `<div class="meta-theme-pill">${metadata.theme}</div>` : ''}
      </div>`
  }

  // Wrap in direction container
  return `
    <div class="${isRTL ? 'is-rtl' : 'is-ltr'}">
      ${intelHeader}
      ${metadataHtml}
      <div class="markdown-content">${html}</div>
    </div>`
}

export default markdownToHtml
