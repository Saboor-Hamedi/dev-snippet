// Word Exporter Utility
// Uses html-to-docx and markdown-it to generate a Word document from rendered markdown

import MarkdownIt from 'markdown-it'
import HTMLToDOCX from 'html-to-docx'
import fs from 'fs/promises'

/**
 * Generate a DOCX file from an array of snippet objects
 * @param {Array} snippets - Array of { title, code, language, diagrams, description }
 * @param {string} outputPath - Where to save the DOCX file
 * @returns {Promise<void>}
 */
export async function exportSnippetsToWord(snippets, outputPath) {
  try {
    const md = new MarkdownIt()

    let html = `<html>
<head>
<style>
body { font-family: Arial, sans-serif; margin: 20px; }
h1 { color: #333; }
pre { background: #f4f4f4; padding: 10px; border-radius: 4px; }
code { font-family: 'Courier New', monospace; }
</style>
</head>
<body>`

    for (const snippet of snippets) {
      html += `<h1>${snippet.title || 'Untitled'}</h1>`
      if (snippet.description) {
        html += `<p><strong>Description:</strong> ${snippet.description}</p>`
      }
      const rendered = md.render(snippet.code || '')
      html += rendered
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
