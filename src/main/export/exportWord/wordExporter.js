// Word Exporter Utility
// Uses html-to-docx and unified to generate a Word document from rendered markdown

import fs from 'fs/promises'

/**
 * Generate a DOCX file from an array of snippet objects
 * @param {Array} snippets - Array of { title, code, language, diagrams, description }
 * @param {string} outputPath - Where to save the DOCX file
 * @returns {Promise<void>}
 */
export async function exportSnippetsToWord(snippets, outputPath) {
  try {
    const { unified } = await import('unified')
    const { default: remarkParse } = await import('remark-parse')
    const { default: remarkGfm } = await import('remark-gfm')
    const { default: remarkRehype } = await import('remark-rehype')
    const { default: rehypeStringify } = await import('rehype-stringify')
    const { default: HTMLToDOCX } = await import('html-to-docx')

    const mdParser = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)

    let html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Export</title>
        </head>
        <body>
    `

    for (const snippet of snippets) {
      html += `<h1>${snippet.title || 'Untitled'}</h1>`
      if (snippet.description) {
        html += `<p><strong>Description:</strong> ${snippet.description}</p>`
      }
      const result = await mdParser.process(snippet.code || '')
      html += result.toString()
      html += '<hr style="margin: 40px 0;">'
    }

    html += '</body></html>'

    const buffer = await HTMLToDOCX(html, null, {
      title: 'Snippets Export',
      description: 'Exported code snippets with markdown rendering'
    })

    await fs.writeFile(outputPath, buffer)
  } catch (err) {
    throw new Error(`Failed to export to Word: ${err.message}`)
  }
}
