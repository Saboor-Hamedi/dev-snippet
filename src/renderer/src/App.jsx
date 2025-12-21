import React, { useEffect } from 'react'
import SnippetLibrary from './components/workbench/SnippetLibrary'
import { SettingsProvider } from './hook/useSettingsContext'
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

    const onUnhandledRejection = (event) => {
      console.error('Unhandled Promise Rejection:', event.reason)
    }

    const onGlobalError = (event) => {
      console.error('Global Window Error:', event.error || event.message)
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    window.addEventListener('error', onGlobalError)

    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      window.removeEventListener('error', onGlobalError)
    }
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
