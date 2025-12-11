import './assets/index.css'
import './assets/toast.css'
import './assets/markdown.css'
import './components/CodeEditor/CodeEditor.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import settingsManager from './config/settingsManager'

import App from './App'

const applyThemeFromDB = async () => {
  try {
    if (window.api?.getTheme) {
      const row = await window.api.getTheme()
      if (row && row.colors) {
        const colors = JSON.parse(row.colors)
        // Apply to DOM before React renders to avoid flashing
        document.documentElement.setAttribute('data-theme', row.name)
        if (row.name === 'polaris') {
          document.documentElement.classList.remove('dark')
        } else {
          document.documentElement.classList.add('dark')
        }
        const root = document.documentElement
        if (colors.background) root.style.setProperty('--color-background', colors.background)
        if (colors.sidebar) root.style.setProperty('--color-background-soft', colors.sidebar)
        if (colors.text) {
          root.style.setProperty('--color-text', colors.text)
          root.style.setProperty('--text-main', colors.text)
        }
        if (colors.accent) root.style.setProperty('--accent', colors.accent)
        if (colors.border) root.style.setProperty('--border-color', colors.border)
        // Hover/selected tuning
        if (row.name === 'polaris') {
          root.style.setProperty('--hover-bg', '#f1f5f9')
          root.style.setProperty('--hover-text', '#1e293b')
          root.style.setProperty('--selected-bg', '#e0f2fe')
          root.style.setProperty('--selected-text', '#0284c7')
          root.style.setProperty('--sidebar-text', '#334155')
          root.style.setProperty('--sidebar-header-text', '#475569')
        } else if (row.name === 'midnight-pro') {
          root.style.setProperty('--hover-bg', '#21262d')
          root.style.setProperty('--hover-text', '#ffffff')
          root.style.setProperty('--selected-bg', '#30363d')
          root.style.setProperty('--selected-text', '#ffffff')
        } else if (row.name === 'nebula') {
          root.style.setProperty('--hover-bg', 'rgba(217,70,239,0.15)')
          root.style.setProperty('--hover-text', '#e4e4e7')
          root.style.setProperty('--selected-bg', '#27272a')
          root.style.setProperty('--selected-text', '#e4e4e7')
        } else if (row.name === 'forest') {
          root.style.setProperty('--hover-bg', 'rgba(34,197,94,0.12)')
          root.style.setProperty('--hover-text', '#e7e5e4')
          root.style.setProperty('--selected-bg', '#44403c')
          root.style.setProperty('--selected-text', '#e7e5e4')
        }
      }
    }
  } catch {}
}

;(async () => {
  await applyThemeFromDB()

  // await settingsManager.load()
  await settingsManager.save()
  // console.log('Forced settings save:', settingsManager.settings.editor)
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})()
