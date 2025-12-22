/**
 * Export IPC Handlers
 * Handles PDF export and other file conversions
 */

import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export const registerExportHandlers = () => {
  console.log('� [Main] Initializing PDF export handler...')

  ipcMain.handle('export:pdf', async (event, htmlContent, defaultName = 'snippet-export') => {
    console.log('� [Main] Exporting to PDF:', defaultName)

    try {
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

      // Load content directly (it already contains full HTML/CSS from previewGenerator)
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

      // Wait for Mermaid/Highlight.js to settle (Capturing premium aesthetics)
      await new Promise((resolve) => setTimeout(resolve, 2000))

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
}
