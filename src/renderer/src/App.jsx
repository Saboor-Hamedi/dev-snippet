import React, { useEffect } from 'react'
import SnippetLibrary from './components/workbench/SnippetLibrary'
import { SettingsProvider } from './hook/useSettingsContext.jsx'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
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
    <ErrorBoundary>
      <SettingsProvider>
        <SnippetLibrary />
      </SettingsProvider>
    </ErrorBoundary>
  )
}

export default App
