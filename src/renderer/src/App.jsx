import React, { useEffect } from 'react'
import SnippetLibrary from './components/workbench/SnippetLibrary'
import { SettingsProvider } from './hook/useSettingsContext'
import ErrorBoundary from './components/ErrorBoundary'
import QuickCapture from './components/QuickCapture/QuickCapture'

function App() {
  // Global event handlers & shortcuts
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

  const searchParams = new URLSearchParams(window.location.search)
  const isQuickCapture = searchParams.get('mode') === 'quick-capture'

  if (isQuickCapture) {
    return (
      <ErrorBoundary>
        <SettingsProvider>
          <QuickCapture />
        </SettingsProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <SnippetLibrary />
      </SettingsProvider>
    </ErrorBoundary>
  )
}

export default App
