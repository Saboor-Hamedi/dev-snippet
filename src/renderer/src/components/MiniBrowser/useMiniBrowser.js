/**
 * useMiniBrowser.js
 * Hook for opening content in Mini Browser window.
 * DRY: Centralized mini browser logic.
 */

import { useCallback } from 'react'
import { generateMiniBrowserHtml } from './miniBrowserGenerator'

/**
 * Hook to open content in Mini Browser
 * @param {Object} options - Configuration options
 * @param {string} options.code - Content code/text
 * @param {string} options.title - Document title
 * @param {string} options.theme - Theme ID
 * @param {Array} options.snippets - Available snippets for WikiLinks
 * @param {string} options.fontFamily - Font family
 * @param {Object} options.settings - App settings (for syntax colors, fontSize, etc.)
 * @returns {Function} openMiniBrowser - Function to open the mini browser
 */
export const useMiniBrowser = ({
  code = '',
  title = 'Untitled',
  theme = 'midnight-pro',
  snippets = [],
  fontFamily = "'Outfit', 'Inter', sans-serif",
  settings = {}
}) => {
  const openMiniBrowser = useCallback(async () => {
    try {
      console.log('[MiniBrowser] Opening with:', { title, theme, codeLength: code?.length })

      // Generate HTML with proper theme
      const htmlContent = await generateMiniBrowserHtml({
        code,
        title,
        theme,
        snippets,
        fontFamily,
        settings
      })

      if (!htmlContent || htmlContent.trim().length === 0) {
        console.error('[MiniBrowser] Failed to generate HTML content')
        return
      }

      console.log('[MiniBrowser] HTML generated, length:', htmlContent.length)

      // Open via IPC - try direct method first, then invoke
      if (window.api?.openMiniBrowser) {
        console.log('[MiniBrowser] Using window.api.openMiniBrowser')
        const result = await window.api.openMiniBrowser(htmlContent)
        console.log('[MiniBrowser] Result:', result)
      } else if (window.api?.invoke) {
        console.log('[MiniBrowser] Using window.api.invoke')
        // Use invoke as fallback
        const result = await window.api.invoke('window:openMiniBrowser', htmlContent)
        console.log('[MiniBrowser] Invoke result:', result)
      } else {
        console.error('[MiniBrowser] window.api is not available')
      }
    } catch (error) {
      console.error('[MiniBrowser] Error:', error)
      throw error
    }
  }, [code, title, theme, snippets, fontFamily, settings])

  return { openMiniBrowser }
}
