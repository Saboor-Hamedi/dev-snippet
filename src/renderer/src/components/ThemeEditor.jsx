import React, { useState, useEffect } from 'react'
import { Save, RotateCcw, ArrowDownCircle } from 'lucide-react'

const ThemeEditor = ({ currentTheme, onSaveTheme }) => {
  const [jsonInput, setJsonInput] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState('')

  // Default theme structure (Minimal - customize as needed)
  const defaultTheme = {
    colors: {
      accent: '#3b82f6',
      background: '#000000',
      surface: '#1a1a1a',
      text: '#ffffff'
    }
  }

  // Helper to get active theme from CSS variables
  const loadActiveTheme = () => {
    const root = document.documentElement
    const style = getComputedStyle(root)

    const getVar = (name, fallback) => {
      const val = style.getPropertyValue(name).trim()
      return val || fallback
    }

    const activeColors = {
      colors: {
        accent: getVar('--ev-c-accent', defaultTheme.colors.accent),
        background: getVar('--color-background', defaultTheme.colors.background),
        surface: getVar('--color-background-soft', defaultTheme.colors.surface),
        text: getVar('--color-text', defaultTheme.colors.text)
      }
    }

    setJsonInput(JSON.stringify(activeColors, null, 2))
    setIsValid(true)
    setError('')
  }

  // Initialize with current theme or default
  useEffect(() => {
    if (currentTheme) {
      setJsonInput(JSON.stringify(currentTheme, null, 2))
    } else {
      loadActiveTheme()
    }
  }, [currentTheme])

  // Validate JSON as user types
  const validateAndPreview = (value) => {
    setJsonInput(value)

    if (!value.trim()) {
      setIsValid(false)
      setError('JSON cannot be empty')
      return
    }

    try {
      const parsed = JSON.parse(value)
      setIsValid(true)
      setError('')
      applyThemePreview(parsed)
    } catch (err) {
      setIsValid(false)
      setError(`Invalid JSON: ${err.message}`)
    }
  }

  const applyThemePreview = (theme) => {
    const colors = theme.colors || defaultTheme.colors
    const root = document.documentElement

    // Map JSON keys to actual CSS variables
    if (colors.accent) {
      root.style.setProperty('--ev-c-accent', colors.accent)
      root.style.setProperty('--ev-c-accent-hover', colors.accent)
    }
    if (colors.background) {
      root.style.setProperty('--color-background', colors.background)
    }
    if (colors.surface) {
      root.style.setProperty('--color-background-soft', colors.surface)
    }
    if (colors.text) {
      root.style.setProperty('--color-text', colors.text)
    }

    // Support additional custom properties
    Object.keys(colors).forEach((key) => {
      if (!['accent', 'background', 'surface', 'text'].includes(key)) {
        root.style.setProperty(`--${key}`, colors[key])
      }
    })
  }

  const handleSave = () => {
    try {
      if (!jsonInput.trim()) {
        setError('Cannot save empty JSON')
        return
      }

      const theme = JSON.parse(jsonInput)
      onSaveTheme(theme)
    } catch (err) {
      setError(`Cannot save: ${err.message}`)
    }
  }

  const resetToDefault = () => {
    setJsonInput(JSON.stringify(defaultTheme, null, 2))
    setIsValid(true)
    setError('')
    applyThemePreview(defaultTheme)
  }

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonInput(JSON.stringify(parsed, null, 2))
      setIsValid(true)
      setError('')
    } catch (err) {
      // Don't change input if invalid
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-hidden">
        {/* JSON Editor */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Theme JSON
            </label>
            <button
              onClick={handleFormat}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              Format
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => validateAndPreview(e.target.value)}
            onBlur={handleFormat}
            className={`flex-1 font-mono text-xs p-4 rounded-lg border ${
              isValid
                ? 'border-slate-700 focus:border-primary-500'
                : 'border-red-500 focus:border-red-500'
            } bg-black text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all`}
            placeholder={JSON.stringify(defaultTheme, null, 2)}
            spellCheck="false"
          />
        </div>

        {/* Live Preview */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
            Live Preview
          </label>
          <div className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 p-6 overflow-auto">
            <div className="space-y-4">
              {/* Preview Card */}
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-background-soft)',
                  borderColor: 'var(--ev-c-gray-1)'
                }}
              >
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Preview Card
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--ev-c-gray-1)' }}>
                  This shows how your theme colors will look
                </p>
                <button
                  className="px-3 py-1.5 text-white rounded text-xs font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--ev-c-accent)' }}
                >
                  Theme Button
                </button>
              </div>

              {/* Code Preview */}
              <div
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-background-mute)',
                  borderColor: 'var(--ev-c-gray-1)'
                }}
              >
                <code className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>
                  // Code block preview{'\n'}
                  function example() {'{\n'}
                  {'  '}return "Syntax highlighting";{'\n'}
                  {'}'}
                </code>
              </div>

              {/* Colors Preview */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center">
                  <div
                    className="w-full h-10 rounded-lg mb-1.5 border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: 'var(--ev-c-accent)' }}
                  ></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Accent
                  </span>
                </div>
                <div className="text-center">
                  <div
                    className="w-full h-10 rounded-lg mb-1.5 border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: 'var(--color-background-soft)' }}
                  ></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Surface
                  </span>
                </div>
                <div className="text-center">
                  <div
                    className="w-full h-10 rounded-lg mb-1.5 border border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: 'var(--color-background)' }}
                  ></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Background
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Actions and Status */}
      <div className="mx-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-0 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Status */}
          <div className="flex items-center gap-4">
            {error ? (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            ) : isValid ? (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Valid JSON</span>
              </div>
            ) : null}

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Version:</span> <span className="font-mono">1.0.0</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadActiveTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
              title="Load colors from current active theme"
            >
              <ArrowDownCircle size={14} />
              Load Active
            </button>
            <button
              onClick={resetToDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors shadow-sm"
            >
              <Save size={14} />
              Save Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeEditor
