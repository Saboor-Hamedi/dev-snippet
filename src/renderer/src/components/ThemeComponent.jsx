import { useState, useEffect } from 'react'

const STORAGE_KEY = 'quick-snippets-theme'

const ThemeComponent = () => {
  const [currentTheme, setCurrentTheme] = useState('dark')

  const themes = [
    { id: 'light', icon: '☀️', label: 'Light' },
    { id: 'dark', icon: '🌙', label: 'Dark' },
    { id: 'midnight', icon: '🌌', label: 'Midnight' },
    { id: 'ocean', icon: '🌊', label: 'Ocean' }
  ]

  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (window.api && window.api.getSetting) {
          const savedTheme = await window.api.getSetting('theme')
          if (savedTheme) {
            setCurrentTheme(savedTheme)
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error)
      }
    }
    loadTheme()
  }, [])

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', currentTheme)

    // Handle Tailwind dark mode class
    if (currentTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }

    if (window.api && window.api.saveSetting) {
      window.api
        .saveSetting('theme', currentTheme)
        .catch((err) => console.error('Failed to save theme:', err))
    }
  }, [currentTheme])

  const cycleTheme = () => {
    const currentIndex = themes.findIndex((t) => t.id === currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    setCurrentTheme(themes[nextIndex].id)
  }

  const currentThemeObj = themes.find((t) => t.id === currentTheme) || themes[1]

  return (
    <button
      onClick={cycleTheme}
      className="w-full h-full flex items-center justify-center transition-colors hover:text-primary-400"
      title={`Current theme: ${currentThemeObj.label}`}
    >
      <span className="text-lg">{currentThemeObj.icon}</span>
    </button>
  )
}

export default ThemeComponent
