import { useState, useEffect } from 'react'

const STORAGE_KEY = 'quick-snippets-theme'

const ThemeComponent = () => {
  // 1. Lazy Initialization: Read storage immediately when state is created
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY)
    return savedTheme || 'midnight-syntax'
  })

  // Sync DOM and LocalStorage whenever the theme changes (including on mount)
  useEffect(() => {
    document.body.className = currentTheme
    localStorage.setItem(STORAGE_KEY, currentTheme)
  }, [currentTheme])

  const toggleTheme = () => {
    const newTheme = currentTheme === 'midnight-syntax' ? 'solar-dawn' : 'midnight-syntax'
    setCurrentTheme(newTheme)
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${currentTheme === 'midnight-syntax' ? 'light' : 'dark'} theme`}
    >
      {currentTheme === 'midnight-syntax' ? '☀️' : '🌙'}
    </button>
  )
}

export default ThemeComponent
