import React, { useEffect } from 'react'
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
  return <SnippetLibrary />
}

export default App
