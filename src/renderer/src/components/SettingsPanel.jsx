import React, { useState, useEffect } from 'react'
import ThemeComponent from './ThemeComponent' // Reusing your existing theme toggle
import { useToast } from '../utils/ToastNotification'

const SettingsPanel = () => {
  const { showToast } = useToast()

  // Local state for settings (You can hook this up to your database later)
  const [fontSize, setFontSize] = useState(14)
  const [wordWrap, setWordWrap] = useState('on')
  const [autoSave, setAutoSave] = useState(false)

  // Handle Export Data (Moved logic here from the old big file)
  const handleExportData = async () => {
    try {
      if (
        window.api?.saveFileDialog &&
        window.api?.writeFile &&
        window.api?.getSnippets &&
        window.api?.getProjects
      ) {
        // 1. Fetch current data
        const snippets = await window.api.getSnippets()
        const projects = await window.api.getProjects()

        // 2. Open Save Dialog
        const path = await window.api.saveFileDialog()

        if (path) {
          const data = {
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            snippets,
            projects
          }
          // 3. Write File
          await window.api.writeFile(path, JSON.stringify(data, null, 2))
          showToast('✓ Data exported successfully')
        }
      } else {
        console.warn('API not available for exporting data')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      showToast('❌ Failed to export data')
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-300 overflow-y-auto">
      {/* Header */}
      <div className="p-8 pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-light text-white mb-2">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your editor preferences and data.</p>
      </div>

      <div className="p-8 max-w-4xl space-y-12">
        {/* SECTION 1: APPEARANCE */}
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-primary-500">#</span> Appearance
          </h2>
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-200">Color Theme</label>
                <p className="text-xs text-slate-500 mt-1">Switch between light and dark modes.</p>
              </div>
              <div className="bg-slate-900 rounded p-1">
                <ThemeComponent />
              </div>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-200">Font Size</label>
                <p className="text-xs text-slate-500 mt-1">Controls the font size in pixels.</p>
              </div>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded w-20 px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: EDITOR */}
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-primary-500">#</span> Text Editor
          </h2>
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-6">
            {/* Word Wrap */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-200">Word Wrap</label>
                <p className="text-xs text-slate-500 mt-1">Controls how lines should wrap.</p>
              </div>
              <select
                value={wordWrap}
                onChange={(e) => setWordWrap(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none"
              >
                <option value="off">off</option>
                <option value="on">on</option>
                <option value="bounded">bounded</option>
              </select>
            </div>

            {/* Auto Save */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-200">Auto Save</label>
                <p className="text-xs text-slate-500 mt-1">
                  Automatically save changes after delay.
                </p>
              </div>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSave ? 'bg-primary-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: DATA & SYSTEM */}
        <section>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-red-400">#</span> System & Data
          </h2>
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-200">Export Library</label>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Create a JSON backup of all your snippets and projects.
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export Data
              </button>
            </div>

            {/* Shortcut Reference */}
            <div className="pt-6 border-t border-slate-700/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Toggle Sidebar</span>
                  <kbd className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 font-mono text-xs">
                    Ctrl+B
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Close Modal</span>
                  <kbd className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 font-mono text-xs">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SettingsPanel
