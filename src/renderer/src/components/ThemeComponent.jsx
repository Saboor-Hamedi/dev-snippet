import { useState, useEffect } from 'react'

const STORAGE_KEY = 'quick-snippets-theme'

const ThemeComponent = () => {
  const [currentTheme, setCurrentTheme] = useState('dark')
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
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    if (window.api && window.api.saveSetting) {
      window.api
        .saveSetting('theme', currentTheme)
        .catch((err) => console.error('Failed to save theme:', err))
    }
  }, [currentTheme])

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    setCurrentTheme(newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-full h-full flex items-center justify-center transition-colors"
      title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {currentTheme === 'dark' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  )
}

export default ThemeComponent
