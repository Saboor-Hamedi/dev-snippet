// Backup of theme-related code from App.jsx
// This code was removed to simplify testing and avoid document access issues in tests.

import React, { useEffect, useRef } from 'react'
import SnippetLibrary from './components/workbench/SnippetLibrary'
import { useTheme } from './hook/useTheme'
import { SettingsProvider } from './hook/useSettingsContext.jsx'

function App() {
  const { setTheme } = useTheme()
  
  // Apply comprehensive theme system on app start
  useEffect(() => {
    const applyGlobalStyles = () => {
      // Apply base scrollbar and global styling that should always be themed
      const style = document.createElement('style')
      style.textContent = `
        /* Global scrollbar theming */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: var(--color-bg-secondary, #161b22);
        }
        ::-webkit-scrollbar-thumb {
          background: var(--color-border, #30363d);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-tertiary, #64748b);
        }
        
        /* Ensure all components inherit theme colors */
        body, #root {
          background-color: var(--color-bg-primary, #0d1117) !important;
          color: var(--color-text-primary, #c9d1d9) !important;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
      `
      document.head.appendChild(style)
    }
    
    applyGlobalStyles()
    
    const load = async () => {
      try {
        if (window.api?.getTheme) {
          const row = await window.api.getTheme()
          if (row && row.colors) {
            const colors = JSON.parse(row.colors)
            setTheme(row.name, colors)
          }
        }
      } catch {}
    }
    load()
  }, [setTheme])

  // Add a simple keyboard shortcut to restore the default window size
  // (Ctrl/Cmd + Shift + R). This is lightweight and does not affect
  // runtime performance.
  useEffect(() => {
    const onKey = (e) => {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        try {
          if (window.api?.restoreDefaultSize) window.api.restoreDefaultSize()
        } catch {}
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SettingsProvider>
      <SnippetLibrary />
    </SettingsProvider>
  )
}

export default App