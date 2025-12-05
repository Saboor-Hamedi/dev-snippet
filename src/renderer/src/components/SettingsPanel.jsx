import React, { useState, useEffect } from 'react'

import ThemeModal from './ThemeModal'
import { Monitor, Download, ChevronLeft, Settings, SunMoon, FileDown, Database } from 'lucide-react'
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
   
  const [overlayMode, setOverlayMode] = useState(() => {
    try {
      const saved = localStorage.getItem('overlayMode')
      return saved ? saved === 'true' : false // Default to disabled
    } catch (e) {
      return false // Default to disabled
    }
  })
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
      }
    } catch (error) {
      showToast('❌ Failed to export data')
    }
  }

  // Theme handled by ThemeModal only

  // Detect platform to show correct modifier key in shortcut labels
  const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipod|ipad/i.test(navigator.platform)
  const modKey = isMac ? '⌘' : 'Ctrl'

  return (
    <div
      className="settings-panel h-full flex flex-col md:flex-row overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}
    >
      {/* Sidebar Navigation */}
      <div
        className="w-full md:w-56 border-b  md:border-b-0 md:border-r flex flex-col"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)'
        }}
      >
        <nav className="flex-1 p-1 space-y-1">
          <div
            className="text-tiny font-medium uppercase tracking-wider mb-2 px-3"
            style={{
              color: 'var(--color-text-tertiary)'
            }}
          >
            Configuration
          </div>

          {/* Go back */}
          <button
            onClick={handleGoBack}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xsmall font-medium transition-all duration-200"
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
            <span>Go Back</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xsmall font-medium transition-all duration-200"
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
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'general') {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = 'var(--color-text-secondary)'
              }
            }}
          >
            <Settings size={12} />
            <span>General</span>
          </button>
        </nav>

        {/* Footer Info */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-tiny" style={{ color: 'var(--color-text-tertiary)' }}>
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
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-4 max-full  mx-auto ml-1 mr-1">
              {/* APPEARANCE SECTION */}
              <section>
                {/* <h3 className="text-xsmall font-semibold uppercase tracking-wider mb-3" style={{
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
                        className="block text-xsmall font-medium"
                        style={{
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Color Theme
                      </label>
                      <button
                        onClick={() => setIsThemeModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-xsmall font-medium transition-all"
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
                        <SunMoon size={11} />
                        Change Theme
                      </button>
                    </div>
                    <p
                      className="text-tiny"
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
                      className="block text-xsmall font-medium mb-1"
                      style={{
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      Editor Font Family
                    </label>
                    <p
                      className="text-tiny mb-2"
                      style={{
                        color: 'var(--color-text-tertiary)'
                      }}
                    >
                      Monospace fonts recommended.
                    </p>
                    <select
                      value={editorFontFamily}
                      onChange={(e) => updateEditorFontFamily(e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-xsmall outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)'
                      }}
                      onFocus={(e) => e.target.blur()}
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
                      className="block text-xsmall font-medium mb-1"
                      style={{
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      Editor Font Size
                    </label>
                    <p
                      className="text-tiny mb-2"
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
                        className="flex-1 rounded-md px-3 py-2 text-xsmall outline-none transition-all"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)'
                        }}
                        onFocus={(e) => e.target.blur()}
                      />
                      <span className="text-xsmall" style={{ color: 'var(--color-text-tertiary)' }}>
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
                      className="block text-xsmall font-medium mb-1"
                      style={{
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      Preview Font Family
                    </label>
                    <p
                      className="text-tiny mb-2"
                      style={{
                        color: 'var(--color-text-tertiary)'
                      }}
                    >
                      Applies to code preview blocks.
                    </p>
                    <select
                      value={previewFontFamily}
                      onChange={(e) => updatePreviewFontFamily(e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-xsmall outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)'
                      }}
                      onFocus={(e) => e.target.blur()}
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
                      className="block text-xsmall font-medium mb-1"
                      style={{
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      Preview Font Size
                    </label>
                    <p
                      className="text-tiny mb-2"
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
                        className="flex-1 rounded-md px-3 py-2 text-xsmall outline-none transition-all"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)'
                        }}
                        onFocus={(e) => e.target.blur()}
                      />
                      <span className="text-xsmall" style={{ color: 'var(--color-text-tertiary)' }}>
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
                      className="block text-xsmall font-medium mb-1"
                      style={{
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      Caret Width
                    </label>
                    <p
                      className="text-tiny mb-2"
                      style={{
                        color: 'var(--color-text-tertiary)'
                      }}
                    >
                      Thickness of the text cursor.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt((caretWidth || '3px').replace('px', ''))}
                        onChange={(e) => updateCaretWidth(e.target.value)}
                        className="flex-1 rounded-md px-3 py-2 text-xsmall outline-none transition-all"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)'
                        }}
                        onFocus={(e) => e.target.blur()}
                      />
                      <span className="text-xsmall" style={{ color: 'var(--color-text-tertiary)' }}>
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
                      className="block text-xsmall font-medium mb-1"
                      style={{
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      Caret Style
                    </label>
                    <p
                      className="text-tiny mb-2"
                      style={{
                        color: 'var(--color-text-tertiary)'
                      }}
                    >
                      Choose bar, block, or underline.
                    </p>
                    <select
                      value={caretStyle}
                      onChange={(e) => updateCaretStyle(e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-xsmall outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)'
                      }}
                      onFocus={(e) => e.target.blur()}
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
                  className="text-xsmall font-semibold uppercase tracking-wider mb-3 ml-3"
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
                      className="text-tiny mb-3"
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
                            className="text-xsmall font-medium"
                            style={{
                              color: 'var(--color-text-primary)'
                            }}
                          >
                            Create new snippet
                          </div>
                          <div
                            className="text-tiny"
                            style={{
                              color: 'var(--color-text-tertiary)'
                            }}
                          >
                            Open a new draft
                          </div>
                        </div>
                        <kbd
                          className="px-1.5 py-0.5 rounded text-tiny"
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
                            className="text-xsmall font-medium"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            Save (force)
                          </div>
                          <div
                            className="text-tiny"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            Trigger editor save (Ctrl+S)
                          </div>
                        </div>
                        <kbd
                          className="px-1.5 py-0.5 rounded text-tiny"
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
                            className="text-xsmall font-medium"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            Command Palette
                          </div>
                          <div
                            className="text-tiny"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            Open quick search / commands
                          </div>
                        </div>
                        <kbd
                          className="px-1.5 py-0.5 rounded text-tiny"
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
                            className="text-xsmall font-medium"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            Go to Welcome
                          </div>
                          <div
                            className="text-tiny"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            Show the welcome page
                          </div>
                        </div>
                        <kbd
                          className="px-1.5 py-0.5 rounded text-tiny"
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
                            className="text-xsmall font-medium"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            Copy to clipboard
                          </div>
                          <div
                            className="text-tiny"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            Copy selected snippet code
                          </div>
                        </div>
                        <kbd
                          className="px-1.5 py-0.5 rounded text-tiny"
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
                            className="text-xsmall font-medium"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            Rename snippet
                          </div>
                          <div
                            className="text-tiny"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            Open rename modal
                          </div>
                        </div>
                        <kbd
                          className="px-1.5 py-0.5 rounded text-tiny"
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
                            className="text-xsmall font-medium"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            Delete snippet
                          </div>
                          <div
                            className="text-tiny"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            Open delete confirmation
                          </div>
                        </div>
                        <kbd
                          className="px-1.5 py-0.5 rounded text-tiny"
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
                            className="text-xsmall font-medium"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            Toggle compact
                          </div>
                          <div
                            className="text-tiny"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            Toggle compact header / status bar
                          </div>
                        </div>
                        <kbd
                          className="px-1.5 py-0.5 rounded text-tiny"
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
                  className="text-xsmall font-semibold uppercase tracking-wider mb-3 ml-3"
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
                        className="block text-xsmall font-medium"
                        style={{
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Word Wrap
                      </label>
                     
                      <p
                        className="text-tiny mt-1"
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
                      className="rounded-md px-2 py-1 text-xsmall outline-none transition-all"
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
                  <div className="p-5 flex items-center justify-between gap-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Auto Save
                      </label>
                      <p className="text-xsmall text-slate-500 mt-1">
                        Automatically save changes after delay.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        try {
                          const next = !autoSave
                          setAutoSave(next)
                          localStorage.setItem('autoSave', next ? 'true' : 'false')
                          // notify other components (editor) about change
                          try {
                            window.dispatchEvent(
                              new CustomEvent('autosave:toggle', { detail: { enabled: next } })
                            )
                          } catch {}
                        } catch (e) {
                          setAutoSave((s) => !s)
                        }
                      }}
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

                  {/* Preview Overlay Mode */}
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white">
                        Preview Overlay Mode
                      </label>
                      <p className="text-xsmall text-slate-500 mt-1">
                        Float preview over editor instead of side-by-side.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        try {
                          const next = !overlayMode
                          setOverlayMode(next)
                          localStorage.setItem('overlayMode', next ? 'true' : 'false')
                          // notify editor about change
                          try {
                            window.dispatchEvent(
                              new CustomEvent('overlayMode:toggle', { detail: { enabled: next } })
                            )
                          } catch {}
                        } catch (e) {
                          setOverlayMode((s) => !s)
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                        overlayMode ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          overlayMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* DATA & SYSTEM SECTION */}
              <section>
                <h3
                  className="text-xsmall font-semibold uppercase tracking-wider mb-3 ml-3"
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
                  <div className="p-4 flex items-center justify-between gap-4 ">
                    <div>
                      <label
                        className="block text-xsmall font-medium"
                        style={{
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        Export Library
                      </label>
                      <p
                        className="text-xsmall mt-1 max-w-sm"
                        style={{
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        Create a JSON backup of all your snippets and projects.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-xsmall font-medium transition-colors"
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
      </div>

      {/* Theme Modal */}
      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </div>
  )
}

export default SettingsPanel
