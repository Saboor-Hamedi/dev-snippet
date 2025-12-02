import React, { useEffect, useRef } from 'react'
import SnippetLibrary from './components/workbench/SnippetLibrary'
import { useTheme } from './hook/useTheme'
import { useFontSettings } from './hook/useFontSettings'

function App() {
  const { setTheme } = useTheme()
  useFontSettings()
  useEffect(() => {
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
  }, [])

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

  return <SnippetLibrary />
}

export default App
