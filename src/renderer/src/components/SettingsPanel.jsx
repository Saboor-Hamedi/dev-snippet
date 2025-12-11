import React, { useState, useEffect } from 'react'
import ToggleButton from './ToggleButton'
import { useFontSettings } from '../hook/useFontSettings'
import { useSettings } from '../hook/useSettingsContext'
import { useToast } from '../hook/useToast'
import ToastNotification from '../utils/ToastNotification'
import UserSettings from './preference/UserSettings.jsx'
import cleanErrorJson from '../hook/useCleanErrorJson.js'
import ThemeModal from './ThemeModal'
import {
  Monitor,
  Download,
  ChevronLeft,
  Settings,
  SunMoon,
  FileDown,
  Database,
  FileJson,
  Save
} from 'lucide-react'

const SettingsPanel = ({ onClose }) => {
  const { toast, showToast } = useToast()

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

  const [overlayMode, setOverlayMode] = useState(() => {
    try {
      const saved = localStorage.getItem('overlayMode')
      return saved ? saved === 'true' : false // Default to disabled
    } catch (e) {
      return false // Default to disabled
    }
  })
  const { getSetting, updateSetting, updateSettings } = useSettings()
  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false
  const [activeTab, setActiveTab] = useState('general')
  const [jsonContent, setJsonContent] = useState('')
  const [isJsonDirty, setIsJsonDirty] = useState(false)

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
            version: '1.2.0',
            snippets,
            projects
          }
          await window.api.writeFile(path, JSON.stringify(data, null, 2))
          showToast('✓ Data exported successfully')
        }
      } else {
      }
    } catch (error) {
      showToast('❌ Failed to export data', error)
    }
  }

  // Handle opening JSON view
  const handleOpenJson = async () => {
    setActiveTab('json')
    if (window.api?.readSettingsFile) {
      try {
        const content = await window.api.readSettingsFile()
        setJsonContent(content || '{}')
        setIsJsonDirty(false)
      } catch (error) {
        showToast('❌ Failed to load settings file', error)
      }
    }
  }

  // Handle saving JSON view
  const handleSaveJson = async () => {
    let parsedSettings

    // --- 1. VALIDATION and PARSING ---
    try {
      parsedSettings = JSON.parse(jsonContent)
    } catch (error) {
      // Attempt auto-repair for trailing garbage (common after file corruption)
      try {
        const trimmed = jsonContent.trim()
        const lastBrace = trimmed.lastIndexOf('}')
        if (lastBrace !== -1 && lastBrace < trimmed.length - 1) {
          const candidate = trimmed.substring(0, lastBrace + 1)
          parsedSettings = JSON.parse(candidate)
          // If successful, notify user but proceed
          showToast('⚠️ Repaired trailing characters in JSON', 'info')
        } else {
          throw error
        }
      } catch (retryError) {
        const cleanError = cleanErrorJson(error, jsonContent)
        showToast(`Syntax Error: ${cleanError}`)
        return // Stop execution on error
      }
    }

    try {
      // --- 2. UPDATE APPLICATION STATE via Context ---
      // This delegates persistence to the SettingsManager, ensuring a single source of truth
      // and preventing race conditions (double-writes) caused by manual file writing here.
      await updateSettings(parsedSettings)

      // Final UI feedback
      setIsJsonDirty(false)
      showToast('✓ Settings saved and applied')
    } catch (error) {
      showToast(`❌ System Error during save: ${error.message}`)
      console.error('Save operation failed:', error)
    }
  }

  // Theme handled by ThemeModal only

  // Detect platform to show correct modifier key in shortcut labels
  const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipod|ipad/i.test(navigator.platform)
  const modKey = isMac ? '⌘' : 'Ctrl'

  return (
    <div
      className="settings-panel h-full flex flex-col md:flex-row overflow-hidden transition-colors duration-200 p-2"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}
    >
      <ToastNotification toast={toast} />
      {/* Sidebar Navigation */}
      <div
        className="w-full md:w-56  md:border-b-0 flex flex-col "
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)'
        }}
      >
        <nav className="flex-1 p-1 space-y-1 rounded-sm">
          <div
            className="text-xtiny font-thin uppercase tracking-wider mb-2 px-3"
            style={{
              color: 'var(--color-text-tertiary)'
            }}
          >
            Configuration
          </div>

          {/* Go back */}
          <button
            onClick={handleGoBack}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xtiny font-thin transition-all duration-200"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--hover-bg)'
              e.target.style.color = 'var(--hover-text)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = 'var(--color-text-secondary)'
            }}
          >
            <ChevronLeft size={12} />
            <span>Back</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xtiny font-thin transition-all duration-200"
            style={{
              backgroundColor:
                activeTab === 'general' ? 'var(--color-accent-primary)' : 'transparent',
              color:
                activeTab === 'general' ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'general') {
                e.target.style.backgroundColor = 'var(--hover-bg)'
                e.target.style.color = 'var(--hover-text)'
                e.target.style.opacity = '1'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'general') {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = 'var(--color-text-secondary)'
                e.target.style.opacity = '0.8'
              }
            }}
          >
            <Settings size={12} />
            <span>General</span>
          </button>

          <button
            onClick={handleOpenJson}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xtiny font-thin transition-all duration-200"
            style={{
              backgroundColor: activeTab === 'json' ? 'var(--color-accent-primary)' : 'transparent',
              color:
                activeTab === 'json' ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'json') {
                e.target.style.backgroundColor = 'var(--hover-bg)'
                e.target.style.color = 'var(--hover-text)'
                e.target.style.opacity = '1'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'json') {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = 'var(--color-text-secondary)'
                e.target.style.opacity = '0.8'
              }
            }}
          >
            <FileJson size={12} />
            <span>User Settings</span>
          </button>
        </nav>

        {/* Footer Info */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-xtiny" style={{ color: 'var(--color-text-tertiary)' }}>
            <div className="flex items-center justify-between mb-1">
              <span>Version</span>
              <span className="font-mono">1.2.0</span>
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
        {activeTab === 'json' && (
          // Display the UserSettings component
          <UserSettings
            activeTab={activeTab}
            jsonContent={jsonContent}
            isJsonDirty={isJsonDirty}
            setIsJsonDirty={setIsJsonDirty}
            handleSaveJson={handleSaveJson}
            setJsonContent={setJsonContent}
          />
        )}

        {/* Scrollable Content */}
        {activeTab !== 'json' && (
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-4 max-full  mx-auto ml-1 mr-1">
                {/* APPEARANCE SECTION */}
                <section>
                  {/* <h3 className="text-xtiny font-semibold uppercase tracking-wider mb-3" style={{
                  color: 'var(--color-text-tertiary)'
                }}>
                  Appearance
                </h3> */}
                  <div
                    className="rounded-md border overflow-hidden "
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    {/* Theme Select */}
                    <div
                      className="p-2 border-b"
                      style={{
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label
                          className="block text-xtiny font-thin"
                          style={{
                            color: 'var(--color-text-primary)'
                          }}
                        >
                          Color Theme
                        </label>
                        <button
                          onClick={() => setIsThemeModalOpen(true)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xtiny font-thin transition-all"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--hover-bg)'
                            e.target.style.borderColor = 'var(--color-text-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--color-bg-primary)'
                            e.target.style.borderColor = 'var(--color-border)'
                          }}
                        >
                          <SunMoon size={11} />
                          Change Theme
                        </button>
                      </div>
                      <p
                        className="text-xtiny"
                        style={{
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        Select your preferred visual theme.
                      </p>
                    </div>

                    {/* Editor Font Family */}
                    <div className="p-2">
                      <label
                        className="block text-xtiny font-thin mb-1"
                        style={{
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Editor Font Family
                      </label>
                      <p
                        className="text-xtiny mb-2"
                        style={{
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        Monospace fonts recommended.
                      </p>
                      <select
                        value={editorFontFamily}
                        onChange={(e) => updateEditorFontFamily(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-xtiny outline-none transition-all"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                      >
                        <option>JetBrains Mono</option>
                        <option>Fira Code</option>
                        <option>Consolas</option>
                        <option>Monaco</option>
                        <option>Courier New</option>
                      </select>
                    </div>

                    {/* Editor Font Size */}
                    <div
                      className="p-2 border-t"
                      style={{
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <label
                        className="block text-xtiny font-thin mb-1"
                        style={{
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Editor Font Size
                      </label>
                      <p
                        className="text-xtiny mb-2"
                        style={{
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        Controls the editor font size.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editorFontSize}
                          onChange={(e) => updateEditorFontSize(e.target.value)}
                          className="flex-1 rounded-md px-3 py-2 text-xtiny outline-none transition-all"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none'
                          }}
                        />
                        <span
                          className="text-xtiny"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          px
                        </span>
                      </div>
                    </div>

                    {/* Preview Font Family */}
                    <div
                      className="p-2 border-t"
                      style={{
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <label
                        className="block text-xtiny font-thin mb-1"
                        style={{
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Preview Font Family
                      </label>
                      <p
                        className="text-xtiny mb-2"
                        style={{
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        Applies to code preview blocks.
                      </p>
                      <select
                        value={previewFontFamily}
                        onChange={(e) => updatePreviewFontFamily(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-xtiny outline-none transition-all"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                      >
                        <option>JetBrains Mono</option>
                        <option>Fira Code</option>
                        <option>Consolas</option>
                        <option>Monaco</option>
                        <option>Courier New</option>
                      </select>
                    </div>

                    {/* Preview Font Size */}
                    <div
                      className="p-2 border-t"
                      style={{
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <label
                        className="block text-xtiny font-thin mb-1"
                        style={{
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Preview Font Size
                      </label>
                      <p
                        className="text-xtiny mb-2"
                        style={{
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        Controls code preview size.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={previewFontSize}
                          onChange={(e) => updatePreviewFontSize(e.target.value)}
                          className="flex-1 rounded-md px-3 py-2 text-xtiny outline-none transition-all"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none'
                          }}
                        />
                        <span
                          className="text-xtiny"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          px
                        </span>
                      </div>
                    </div>

                    {/* Caret Width */}
                    <div
                      className="p-2 border-t"
                      style={{
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <label
                        className="block text-xtiny font-thin mb-1"
                        style={{
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Caret Width
                      </label>
                      <p
                        className="text-xtiny mb-2"
                        style={{
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        Thickness of the text cursor.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={parseInt(String(caretWidth || '3px').replace('px', ''))}
                          onChange={(e) => updateCaretWidth(e.target.value)}
                          className="flex-1 rounded-md px-3 py-2 text-xtiny outline-none transition-all"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none'
                          }}
                        />
                        <span
                          className="text-xtiny"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          px
                        </span>
                      </div>
                    </div>

                    {/* Caret Style */}
                    <div
                      className="p-2 border-t"
                      style={{
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <label
                        className="block text-xtiny font-thin mb-1"
                        style={{
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Caret Style
                      </label>
                      <p
                        className="text-xtiny mb-2"
                        style={{
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        Choose bar, block, or underline.
                      </p>
                      <select
                        value={caretStyle}
                        onChange={(e) => updateCaretStyle(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-xtiny outline-none transition-all"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                      >
                        <option value="bar">Bar</option>
                        <option value="block">Block</option>
                        <option value="underline">Underline</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* KEYBOARD SHORTCUTS */}
                <section>
                  <h3
                    className="text-xtiny font-semibold uppercase tracking-wider mb-3 ml-3"
                    style={{
                      color: 'var(--color-text-tertiary)'
                    }}
                  >
                    Keyboard Shortcuts
                  </h3>
                  <div
                    className="rounded-md border overflow-hidden"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <div className="p-4">
                      <p
                        className="text-xtiny mb-3"
                        style={{
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        Common keyboard shortcuts used across the app.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div
                          className="flex items-center justify-between px-2 py-1.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)'
                          }}
                        >
                          <div>
                            <div
                              className="text-xtiny font-thin"
                              style={{
                                color: 'var(--color-text-primary)'
                              }}
                            >
                              Create new snippet
                            </div>
                            <div
                              className="text-xtiny"
                              style={{
                                color: 'var(--color-text-tertiary)'
                              }}
                            >
                              Open a new draft
                            </div>
                          </div>
                          <kbd
                            className="px-1.5 py-0.5 rounded text-xtiny"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            {modKey} + N
                          </kbd>
                        </div>

                        <div
                          className="flex items-center justify-between px-2 py-1.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)'
                          }}
                        >
                          <div>
                            <div
                              className="text-xtiny font-thin"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              Save (force)
                            </div>
                            <div
                              className="text-xtiny"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              Trigger editor save (Ctrl+S)
                            </div>
                          </div>
                          <kbd
                            className="px-1.5 py-0.5 rounded text-xtiny"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            {modKey} + S
                          </kbd>
                        </div>

                        <div
                          className="flex items-center justify-between px-2 py-1.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)'
                          }}
                        >
                          <div>
                            <div
                              className="text-xtiny font-thin"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              Command Palette
                            </div>
                            <div
                              className="text-xtiny"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              Open quick search / commands
                            </div>
                          </div>
                          <kbd
                            className="px-1.5 py-0.5 rounded text-xtiny"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            {modKey} + P
                          </kbd>
                        </div>

                        <div
                          className="flex items-center justify-between px-2 py-1.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)'
                          }}
                        >
                          <div>
                            <div
                              className="text-xtiny font-thin"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              Go to Welcome
                            </div>
                            <div
                              className="text-xtiny"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              Show the welcome page
                            </div>
                          </div>
                          <kbd
                            className="px-1.5 py-0.5 rounded text-xtiny"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            {modKey} + Shift + W
                          </kbd>
                        </div>

                        <div
                          className="flex items-center justify-between px-2 py-1.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)'
                          }}
                        >
                          <div>
                            <div
                              className="text-xtiny font-thin"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              Copy to clipboard
                            </div>
                            <div
                              className="text-xtiny"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              Copy selected snippet code
                            </div>
                          </div>
                          <kbd
                            className="px-1.5 py-0.5 rounded text-xtiny"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            {modKey} + Shift + C
                          </kbd>
                        </div>

                        <div
                          className="flex items-center justify-between px-2 py-1.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)'
                          }}
                        >
                          <div>
                            <div
                              className="text-xtiny font-thin"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              Rename snippet
                            </div>
                            <div
                              className="text-xtiny"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              Open rename modal
                            </div>
                          </div>
                          <kbd
                            className="px-1.5 py-0.5 rounded text-xtiny"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            {modKey} + R
                          </kbd>
                        </div>

                        <div
                          className="flex items-center justify-between px-2 py-1.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)'
                          }}
                        >
                          <div>
                            <div
                              className="text-xtiny font-thin"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              Delete snippet
                            </div>
                            <div
                              className="text-xtiny"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              Open delete confirmation
                            </div>
                          </div>
                          <kbd
                            className="px-1.5 py-0.5 rounded text-xtiny"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            {modKey} + Shift + D
                          </kbd>
                        </div>

                        <div
                          className="flex items-center justify-between px-2 py-1.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)'
                          }}
                        >
                          <div>
                            <div
                              className="text-xtiny font-thin"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              Toggle compact
                            </div>
                            <div
                              className="text-xtiny"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              Toggle compact header / status bar
                            </div>
                          </div>
                          <kbd
                            className="px-1.5 py-0.5 rounded text-xtiny"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            {modKey} + ,
                          </kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* EDITOR SECTION */}
                <section>
                  <h3
                    className="text-xtiny font-semibold uppercase tracking-wider mb-3 ml-3"
                    style={{
                      color: 'var(--color-text-tertiary)'
                    }}
                  >
                    Text Editor
                  </h3>
                  <div
                    className="rounded-md border overflow-hidden"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    {/* Word Wrap */}
                    <div
                      className="p-4 flex items-center justify-between gap-4 border-b"
                      style={{
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <div>
                        <label
                          className="block text-xtiny font-thin"
                          style={{
                            color: 'var(--color-text-primary)'
                          }}
                        >
                          Word Wrap
                        </label>

                        <p
                          className="text-xtiny mt-1"
                          style={{
                            color: 'var(--color-text-tertiary)'
                          }}
                        >
                          Controls how lines should wrap.
                        </p>
                      </div>
                      <select
                        value={wordWrap}
                        onChange={(e) => setWordWrap(e.target.value)}
                        className="rounded-md px-2 py-1 text-xtiny outline-none transition-all"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)'
                        }}
                        onFocus={(e) => e.target.blur()}
                      >
                        <option value="off">Off</option>
                        <option value="on">On</option>
                        <option value="bounded">Bounded</option>
                      </select>
                    </div>

                    {/* Auto Save */}
                    <div
                      className="p-5 flex items-center justify-between gap-4 border-b"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <div>
                        <label className="block text-sm font-thin text-slate-900 dark:text-white">
                          Auto Save
                        </label>
                        <p className="text-xtiny text-slate-500 mt-1">
                          Automatically save changes after delay.
                        </p>
                      </div>
                      <ToggleButton
                        checked={autoSave}
                        onChange={(checked) => {
                          try {
                            setAutoSave(checked)
                            localStorage.setItem('autoSave', checked ? 'true' : 'false')
                            // notify other components (editor) about change
                            try {
                              window.dispatchEvent(
                                new CustomEvent('autosave:toggle', { detail: { enabled: checked } })
                              )
                            } catch {}
                          } catch (e) {
                            setAutoSave((s) => !s)
                          }
                        }}
                      />
                    </div>

                    {/* Preview Overlay Mode */}
                    <div className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <label className="block text-sm font-thin text-slate-900 dark:text-white">
                          Preview Overlay Mode
                        </label>
                        <p className="text-xtiny text-slate-500 mt-1">
                          Float preview over editor instead of side-by-side.
                        </p>
                      </div>
                      <ToggleButton
                        checked={overlayMode}
                        onChange={(checked) => {
                          try {
                            setOverlayMode(checked)
                            localStorage.setItem('overlayMode', checked ? 'true' : 'false')
                            // notify editor about change
                            try {
                              window.dispatchEvent(
                                new CustomEvent('overlayMode:toggle', {
                                  detail: { enabled: checked }
                                })
                              )
                            } catch {}
                          } catch (e) {
                            setOverlayMode((s) => !s)
                          }
                        }}
                      />
                    </div>
                  </div>
                </section>

                {/* DATA & SYSTEM SECTION */}
                <section>
                  <h3
                    className="text-xtiny font-semibold uppercase tracking-wider mb-3 ml-3"
                    style={{
                      color: 'var(--color-text-tertiary)'
                    }}
                  >
                    System & Data
                  </h3>
                  <div
                    className="rounded-md border overflow-hidden"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    {/* Show Welcome Page */}
                    <div
                      className="p-4 flex items-center justify-between gap-4 border-b"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <div>
                        <label
                          className="block text-xtiny font-thin"
                          style={{
                            color: 'var(--color-text-primary)'
                          }}
                        >
                          Show Welcome Page
                        </label>
                        <p
                          className="text-xtiny mt-1 max-w-sm"
                          style={{
                            color: 'var(--color-text-tertiary)'
                          }}
                        >
                          Show the welcome page when starting the application.
                        </p>
                      </div>
                      <ToggleButton
                        checked={!hideWelcomePage}
                        onChange={(checked) => {
                          updateSetting('ui.hideWelcomePage', !checked)
                        }}
                      />
                    </div>

                    <div className="p-4 flex items-center justify-between gap-4 ">
                      <div>
                        <label
                          className="block text-xtiny font-thin"
                          style={{
                            color: 'var(--color-text-primary)'
                          }}
                        >
                          Export Library
                        </label>
                        <p
                          className="text-xtiny mt-1 max-w-sm"
                          style={{
                            color: 'var(--color-text-tertiary)'
                          }}
                        >
                          Create a JSON backup of all your snippets and projects.
                        </p>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-xtiny font-thin transition-colors"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'var(--hover-bg)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'var(--color-bg-primary)'
                        }}
                      >
                        <FileDown size={11} />
                        Export Data
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Theme Modal */}
      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </div>
  )
}

export default SettingsPanel
