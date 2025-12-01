import React, { useState, useEffect } from 'react'

import ThemeModal from './ThemeModal'
import { SunMoon, FileDown, Settings } from 'lucide-react'
import { useFontSettings } from '../hook/useFontSettings'
import { useToast } from '../hook/useToast'
import ToastNotification from '../utils/ToastNotification'
const SettingsPanel = ({ onClose }) => {
  const { showToast } = useToast()

  // Local state for settings
  const {
    editorFontFamily,
    editorFontSize,
    previewFontFamily,
    previewFontSize,
    caretStyle,
    caretWidth,
    updateEditorFontFamily,
    updateEditorFontSize,
    updatePreviewFontFamily,
    updatePreviewFontSize,
    updateCaretWidth,
    updateCaretStyle
  } = useFontSettings()
  const [wordWrap, setWordWrap] = useState('on')
  const [autoSave, setAutoSave] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Modal State
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const handleGoBack = () => {
    if (onClose) {
      onClose()
    }
  }
  // Handle Export Data
  const handleExportData = async () => {
    try {
      if (
        window.api?.saveFileDialog &&
        window.api?.writeFile &&
        window.api?.getSnippets &&
        window.api?.getProjects
      ) {
        const snippets = await window.api.getSnippets()
        const projects = await window.api.getProjects()
        const path = await window.api.saveFileDialog()

        if (path) {
          const data = {
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            snippets,
            projects
          }
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

  // Theme handled by ThemeModal only

  return (
    <div className="h-full flex bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 overflow-hidden transition-colors duration-200">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col">
        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
            Configuration
          </div>

          {/* Go back */}
          <button
            onClick={handleGoBack}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          >
            <FileDown size={18} />
            <span>Go Back</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'general'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings size={18} />
            <span>General</span>
          </button>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between mb-1">
              <span>Version</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Theme</span>
              <span className="font-mono capitalize">
                {document.documentElement.getAttribute('data-theme') || 'default'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="p-6 space-y-8 max-w-3xl">
              {/* APPEARANCE SECTION */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Appearance
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                  {/* Theme Select */}
                  <div className="p-5 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Color Theme
                      </label>
                      <p className="text-xs text-slate-500 mt-1">
                        Select your preferred visual theme.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsThemeModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                    >
                      <SunMoon size={14} />
                      Change Theme
                    </button>
                  </div>

                  {/* Editor Font Family */}
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Editor Font Family
                      </label>
                      <p className="text-xs text-slate-500 mt-1">Monospace fonts recommended.</p>
                    </div>
                    <select
                      value={editorFontFamily}
                      onChange={(e) => updateEditorFontFamily(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    >
                      <option>JetBrains Mono</option>
                      <option>Fira Code</option>
                      <option>Consolas</option>
                      <option>Monaco</option>
                      <option>Courier New</option>
                    </select>
                  </div>

                  {/* Editor Font Size */}
                  <div className="p-5 flex items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Editor Font Size
                      </label>
                      <p className="text-xs text-slate-500 mt-1">Controls the editor font size.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editorFontSize}
                        onChange={(e) => updateEditorFontSize(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg w-20 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                      />
                      <span className="text-sm text-slate-500">px</span>
                    </div>
                  </div>

                  {/* Preview Font Family */}
                  <div className="p-5 flex items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Preview Font Family
                      </label>
                      <p className="text-xs text-slate-500 mt-1">Applies to code preview blocks.</p>
                    </div>
                    <select
                      value={previewFontFamily}
                      onChange={(e) => updatePreviewFontFamily(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    >
                      <option>JetBrains Mono</option>
                      <option>Fira Code</option>
                      <option>Consolas</option>
                      <option>Monaco</option>
                      <option>Courier New</option>
                    </select>
                  </div>

                  {/* Preview Font Size */}
                  <div className="p-5 flex items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Preview Font Size
                      </label>
                      <p className="text-xs text-slate-500 mt-1">Controls code preview size.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={previewFontSize}
                        onChange={(e) => updatePreviewFontSize(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg w-20 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                      />
                      <span className="text-sm text-slate-500">px</span>
                    </div>
                  </div>

                  {/* Caret Width */}
                  <div className="p-5 flex items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Caret Width
                      </label>
                      <p className="text-xs text-slate-500 mt-1">Thickness of the text cursor.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt((caretWidth || '3px').replace('px', ''))}
                        onChange={(e) => updateCaretWidth(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg w-20 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                      />
                      <span className="text-sm text-slate-500">px</span>
                    </div>
                  </div>

                  {/* Caret Style */}
                  <div className="p-5 flex items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Caret Style
                      </label>
                      <p className="text-xs text-slate-500 mt-1">
                        Choose bar, block, or underline.
                      </p>
                    </div>
                    <select
                      value={caretStyle}
                      onChange={(e) => updateCaretStyle(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    >
                      <option value="bar">Bar</option>
                      <option value="block">Block</option>
                      <option value="underline">Underline</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* EDITOR SECTION */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Text Editor
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                  {/* Word Wrap */}
                  <div className="p-5 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Word Wrap
                      </label>
                      <p className="text-xs text-slate-500 mt-1">Controls how lines should wrap.</p>
                    </div>
                    <select
                      value={wordWrap}
                      onChange={(e) => setWordWrap(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    >
                      <option value="off">Off</option>
                      <option value="on">On</option>
                      <option value="bounded">Bounded</option>
                    </select>
                  </div>

                  {/* Auto Save */}
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Auto Save
                      </label>
                      <p className="text-xs text-slate-500 mt-1">
                        Automatically save changes after delay.
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoSave(!autoSave)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                        autoSave ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
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

              {/* DATA & SYSTEM SECTION */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  System & Data
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Export Library
                      </label>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Create a JSON backup of all your snippets and projects.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      <FileDown size={14} />
                      Export Data
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Theme Modal */}
      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </div>
  )
}

export default SettingsPanel
