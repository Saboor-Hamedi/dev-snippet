// IPC handler for exporting all snippets to Word (DOCX)
import { ipcMain, dialog } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { exportSnippetsToWord } from './wordExporter.js'
import { getAllSnippetsWithDiagrams } from './snippetCollector.js'

export function registerWordExportHandler(appInstance) {
  // Use passed instance to avoid top-level 'app' import circularity
  const getApp = () => appInstance || require('electron').app

  ipcMain.handle('export:word', async (event, htmlOrSnippets, defaultName = 'snippets-export') => {
    try {
      const app = getApp()
      let filePath
      if (typeof htmlOrSnippets === 'string') {
        // Single snippet HTML export
        const sanitizedName = (defaultName || 'snippet').replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const { filePath: fp, canceled } = await dialog.showSaveDialog({
          title: 'Export Snippet to Word',
          defaultPath: path.join(app.getPath('documents'), `${sanitizedName}.docx`),
          filters: [{ name: 'Word Documents', extensions: ['docx'] }]
        })
        filePath = fp
        if (canceled || !filePath) return false

        // Convert HTML to DOCX
        const HTMLToDOCX = (await import('html-to-docx')).default
        console.log('📝 [Word Export] Converting HTML to DOCX...')

        // Strip <style> and <script> tags and their content from the HTML to prevent them appearing as text
        let cleanHtml = htmlOrSnippets
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

        // Also try to extract just the body content if possible, to be safe
        const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        if (bodyMatch && bodyMatch[1]) {
          cleanHtml = bodyMatch[1]
        }

        const buffer = await HTMLToDOCX(cleanHtml, null, {
          title: defaultName,
          description: 'Exported snippet',
          styles: `
            body { font-family: Arial, sans-serif; margin: 1in; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace; }
            code { font-family: 'Courier New', monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
            .mermaid { margin: 20px 0; text-align: center; }
          `
        })
        console.log('💾 [Word Export] Writing file to:', filePath)
        await fs.writeFile(filePath, buffer)
        // console.log('✅ [Word Export] File written successfully')
      } else {
        // All snippets export
        const { filePath: fp, canceled } = await dialog.showSaveDialog({
          title: 'Export All Snippets to Word',
          defaultPath: path.join(app.getPath('documents'), `${defaultName}.docx`),
          filters: [{ name: 'Word Documents', extensions: ['docx'] }]
        })
        filePath = fp
        if (canceled || !filePath) return false

        const snippets = await getAllSnippetsWithDiagrams(app)
        console.log('📄 [Word Export] Gathered', snippets.length, 'snippets')
        await exportSnippetsToWord(snippets, filePath)
      }

      console.log('✅ [Word Export] Successfully saved to:', filePath)
      return true
    } catch (err) {
      console.error('Word export failed:', err)
      return false
    }
  })
}
