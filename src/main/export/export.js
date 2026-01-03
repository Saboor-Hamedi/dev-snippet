/**
 * Export IPC Handlers
 * Handles PDF export and other file conversions
 */

import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export const registerExportHandlers = () => {
  const getApp = () => require('electron').app
  console.log(' [Main] Initializing PDF export handler...')

  ipcMain.handle('export:pdf', async (event, htmlContent, defaultName = 'snippet-export') => {
    console.log(' [Main] Exporting to PDF:', defaultName)

    try {
      const app = getApp()
      // 1. Show save dialog to get destination path
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export Documentation to PDF',
        defaultPath: `${defaultName}.pdf`,
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
      })

      if (canceled || !filePath) {
        console.log('🚫 [Main] PDF Export cancelled by user.')
        return false
      }

      console.log('📦 [Main] Target path:', filePath)

      // 2. Create a hidden window for pixel-perfect rendering
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      // Load content - use file URL for large content to avoid data URL size limits
      let contentUrl
      if (htmlContent.length > 100000) {
        // If HTML is very large (>100KB)
        const tempPath = path.join(app.getPath('temp'), `dev-snippet-export-${Date.now()}.html`)
        await fs.writeFile(tempPath, htmlContent, 'utf-8')
        contentUrl = `file://${tempPath}`

        // Load and wait
        await printWindow.loadURL(contentUrl)
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Clean up temp file after PDF generation
        setTimeout(() => fs.unlink(tempPath).catch(() => {}), 5000)
      } else {
        // Use data URL for smaller content
        contentUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
        await printWindow.loadURL(contentUrl)
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      // 3. Generate PDF buffer with professional margins (0.5 inch is standard and clean)
      const pdfBuffer = await printWindow.webContents.printToPDF({
        printBackground: true,
        margins: {
          marginType: 'default' // This uses standard system margins usually ~0.5-0.75in
        },
        pageSize: 'A4'
      })

      // 4. Persistence
      await fs.writeFile(filePath, pdfBuffer)
      console.log('✅ [Main] PDF successfully saved to:', filePath)

      // 5. Cleanup
      printWindow.destroy()
      return true
    } catch (err) {
      console.error('❌ [Main] PDF Export Engine Error:', err)
      return false
    }
  })

  // NEW: Secure JSON Export
  ipcMain.handle('export:json', async (event, data) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export Data to JSON',
        defaultPath: 'dev-snippet-export.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })

      if (canceled || !filePath) return false

      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
      return true
    } catch (err) {
      console.error('Failed to export JSON:', err)
      return false
    }
  })
}
