// This is the Setting Modal component for managing application settings with live updates.
// LiveUpdates
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { X, Settings, Monitor, Keyboard, Sliders } from 'lucide-react'
import { MIN_ZOOM, MAX_ZOOM } from '../hook/useZoomLevel'

const SettingsModal = ({ isOpen, onClose, currentSettings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(currentSettings)
  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(currentSettings)
  }, [currentSettings])

  // Apply changes immediately and notify parent
  const updateSetting = (path, value) => {
    const pathArray = path.split('.')
    const newSettings = { ...localSettings }
    
    // Navigate to the correct nested object
    let target = newSettings
    for (let i = 0; i < pathArray.length - 1; i++) {
      target = target[pathArray[i]]
    }
    
    // Set the value
    target[pathArray[pathArray.length - 1]] = value
    
    setLocalSettings(newSettings)
    onSettingsChange(newSettings) // Immediate live update
    
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderBottomColor: 'var(--color-border)' }}
        >
          {/* Header setting */}
          <div className="flex items-center gap-3">
            <Settings size={12} style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-tiny font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 focus:outline-none focus:ring-0 rounded-md cursor-pointer transition-colors duration-150"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Settings */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                <h3
                  className="text-tiny font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Editor
                </h3>
              </div>

              {/* Zoom Level */}
              <div className="space-y-2">
                <label
                  className="text-tiny font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Zoom Level: {localSettings.editor?.zoomLevel || 1.0}x
                </label>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step="0.1"
                  value={localSettings.editor?.zoomLevel || 1.0}
                  onChange={(e) => updateSetting('editor.zoomLevel', parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    accentColor: 'var(--color-accent-primary)'
                  }}
                />
                <div
                  className="flex justify-between text-xs"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <span>{Math.round(MIN_ZOOM * 100)}%</span>
                  <span>100%</span>
                  <span>{Math.round(MAX_ZOOM * 100)}%</span>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <label
                  className="text-tiny font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Font Size: {localSettings.editor?.fontSize || 14}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  step="1"
                  value={localSettings.editor?.fontSize || 14}
                  onChange={(e) => updateSetting('editor.fontSize', parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    accentColor: 'var(--color-accent-primary)'
                  }}
                />
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <label
                  className="text-tiny font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Font Family
                </label>
                <select
                  value={localSettings.editor?.fontFamily || 'JetBrains Mono'}
                  onChange={(e) => updateSetting('editor.fontFamily', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="Fira Code">Fira Code</option>
                  <option value="Consolas">Consolas</option>
                  <option value="Monaco">Monaco</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>

              {/* Tab Size */}
              <div className="space-y-2">
                <label className="text-tiny font-medium text-slate-300">
                  Tab Size: {localSettings.editor?.tabSize || 2} spaces
                </label>
                <select
                  value={localSettings.editor?.tabSize || 2}
                  onChange={(e) => updateSetting('editor.tabSize', parseInt(e.target.value))}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>

              {/* Word Wrap */}
              <div className="flex items-center justify-between">
                <label className="text-tiny font-medium text-slate-300">Word Wrap</label>
                <input
                  type="checkbox"
                  checked={localSettings.editor?.wordWrap === 'on'}
                  onChange={(e) =>
                    updateSetting('editor.wordWrap', e.target.checked ? 'on' : 'off')
                  }
                  className="rounded bg-slate-700 border-slate-600"
                />
              </div>

              {/* Overlay Mode */}
              <div className="flex items-center justify-between">
                <label className="text-tiny font-medium text-slate-300">Overlay Mode</label>
                <input
                  type="checkbox"
                  checked={localSettings.editor?.overlayMode === true}
                  onChange={(e) =>
                    updateSetting('editor.overlayMode', e.target.checked ? true : false)
                  }
                  className="rounded bg-slate-700 border-slate-600"
                />
              </div>

              {/* Caret Color */}
              <div className="space-y-2">
                <label
                  className="text-tiny font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Caret Color
                </label>
                <input
                  type="color"
                  value={localSettings.editor?.cursorColor || '#e9e8deff'}
                  onChange={(e) => updateSetting('editor.cursorColor', e.target.value)}
                  className="w-10 h-6 rounded"
                />
              </div>

              {/* Line Numbers */}
              <div className="flex items-center justify-between">
                <label className="text-tiny font-medium text-slate-300">Line Numbers</label>
                <input
                  type="checkbox"
                  checked={localSettings.editor?.lineNumbers || true}
                  onChange={(e) => updateSetting('editor.lineNumbers', e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600"
                />
              </div>
            </div>

            {/* UI & Behavior Settings */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Sliders size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                <h3
                  className="text-tiny font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Interface
                </h3>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <label
                  className="text-tiny font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Compact Mode
                </label>
                <input
                  type="checkbox"
                  checked={localSettings.ui?.compactMode || false}
                  onChange={(e) => updateSetting('ui.compactMode', e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600"
                />
              </div>

              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <label className="text-tiny font-medium text-slate-300">Auto Save</label>
                <input
                  type="checkbox"
                  checked={localSettings.behavior?.autoSave || true}
                  onChange={(e) => updateSetting('behavior.autoSave', e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600"
                />
              </div>

              {/* Auto Save Delay */}
              {localSettings.behavior?.autoSave && (
                <div className="space-y-2">
                  <label className="text-tiny font-medium text-slate-300">
                    Auto Save Delay: {localSettings.behavior?.autoSaveDelay || 2000}ms
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="500"
                    value={localSettings.behavior?.autoSaveDelay || 2000}
                    onChange={(e) =>
                      updateSetting('behavior.autoSaveDelay', parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Code Folding */}
              <div className="flex items-center justify-between">
                <label className="text-tiny font-medium text-slate-300">Code Folding</label>
                <input
                  type="checkbox"
                  checked={localSettings.advanced?.enableCodeFolding || true}
                  onChange={(e) => updateSetting('advanced.enableCodeFolding', e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600"
                />
              </div>

              {/* Auto Complete */}
              <div className="flex items-center justify-between">
                <label className="text-tiny font-medium text-slate-300">Auto Complete</label>
                <input
                  type="checkbox"
                  checked={localSettings.advanced?.enableAutoComplete || true}
                  onChange={(e) => updateSetting('advanced.enableAutoComplete', e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Live Settings Preview */}
          <div
            className="mt-8 p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Keyboard size={12} style={{ color: 'var(--color-text-tertiary)' }} />
              <h4
                className="text-tiny font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Live Settings JSON
              </h4>
            </div>
            <pre
              className="text-xs overflow-x-auto"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {JSON.stringify(localSettings, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-6 border-t flex justify-between"
          style={{ borderTopColor: 'var(--color-border)' }}
        >
          <button
            onClick={() => {
              // Reset to defaults
              const defaults = {
                editor: {
                  zoomLevel: 1.0,
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono',
                  lineNumbers: true,
                  wordWrap: 'on',
                  cursorColor: '#e9e8deff',
                  overlayMode: false,
                  tabSize: 2,
                  theme: 'dark'
                },
                ui: {
                  compactMode: false,
                  showPreview: false,
                  sidebarWidth: 250,
                  previewPosition: 'right'
                },
                behavior: {
                  autoSave: true,
                  autoSaveDelay: 2000,
                  confirmDelete: true,
                  restoreSession: true
                },
                advanced: {
                  enableCodeFolding: true,
                  enableAutoComplete: true,
                  enableLinting: false,
                  maxFileSize: 1048576
                }
              }
              setLocalSettings(defaults)
              onSettingsChange(defaults)
            }}
            className="px-4 py-2 transition-colors rounded-md"
            onMouseEnter={(e) => (e.target.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-tertiary)')}
          >
            Reset to Defaults
          </button>
          {/* Footer close button */}
        </div>
      </div>
    </div>
  )
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentSettings: PropTypes.object.isRequired,
  onSettingsChange: PropTypes.func.isRequired
}

export default SettingsModal