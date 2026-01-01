import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Save, RotateCcw } from 'lucide-react'
import { useSettings } from '../../hook/useSettingsContext'
import { useToast } from '../../hook/useToast'
import CodeEditor from '../CodeEditor/CodeEditor'
import SettingsForm from '../settings/SettingsForm'
import cleanErrorJson from '../../hook/useCleanErrorJson.js'
import ToastNotification from '../../utils/ToastNotification'
import KeyboardShortcuts, { MODE_CONFIG } from '../../features/keyboard/KeyboardShortcutsSection'

const UserSettings = () => {
  const { settings, updateSettings, resetSettings: contextResetSettings } = useSettings()
  const { toast, showToast } = useToast()

  // 'ui', 'shortcuts', or 'json'
  const [mode, setMode] = useState('ui')

  // Local state for the JSON editor string
  const [jsonText, setJsonText] = useState('')

  // Sync jsonText when settings change or when switching to JSON mode
  useEffect(() => {
    if (settings && (mode === 'json' || jsonText === '')) {
      setJsonText(JSON.stringify(settings, null, 2))
    }
  }, [settings, mode])

  const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipod|ipad/i.test(navigator.platform)
  const modKey = isMac ? '⌘' : 'Ctrl'

  const handleJsonSave = () => {
    try {
      const parsed = JSON.parse(jsonText)
      updateSettings(parsed)
      showToast('✓ Settings saved successfully')
    } catch (e) {
      console.error('Invalid JSON', e)
      const cleanError = cleanErrorJson(e, jsonText)
      showToast(`❌ Syntax Error: ${cleanError}`)
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to defaults?')) {
      if (contextResetSettings) contextResetSettings()
    }
  }

  // Find the header portal target
  const headerPortalTarget = document.getElementById('settings-header-right')

  return (
    <div
      className="flex flex-col h-full text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden relative"
      style={{ backgroundColor: 'rgb(var(--color-bg-primary-rgb))' }}
    >
      <ToastNotification toast={toast} />

      {/* Mode Switcher & Controls - Portaled to Header */}
      {headerPortalTarget &&
        createPortal(
          <div className="flex items-center gap-2 sm:gap-4 ml-2">
            {/* Mode Switcher */}
            <div className="flex items-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md overflow-hidden">
              {MODE_CONFIG.map(({ id, label, tooltip, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  title={tooltip}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium transition-all ${
                    mode === id
                      ? 'bg-[var(--color-accent-bg, var(--color-bg-tertiary))] text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                  } ${id !== MODE_CONFIG[MODE_CONFIG.length - 1].id ? 'border-r border-[var(--color-border)]' : ''}`}
                >
                  <Icon size={12} className="opacity-70" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Actions */}
            {mode === 'json' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  title="Reset Defaults"
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 border border-[var(--color-border)] hover:border-red-200 dark:hover:border-red-900/30 rounded-md text-[9px] font-bold text-slate-600 dark:text-slate-300 transition-all"
                >
                  <RotateCcw size={10} className="opacity-70" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  onClick={handleJsonSave}
                  className="flex items-center gap-1.5 px-2 py-1 bg-blue-600 hover:bg-blue-700 border border-blue-600 hover:border-blue-700 rounded-md text-[9px] font-bold text-white transition-all shadow-sm"
                >
                  <Save size={10} />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>,
          headerPortalTarget
        )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 flex relative">
        {mode === 'ui' ? (
          <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 overflow-y-auto h-full custom-scrollbar flex-1">
            <SettingsForm key="visual-settings" />
          </div>
        ) : null}

        {mode === 'json' ? (
          <div className="flex-1 flex flex-col min-w-0" key="json-settings">
            <div className="flex-1 relative min-h-0 border-t border-[var(--color-border)] overflow-hidden">
              <CodeEditor
                value={jsonText}
                onChange={setJsonText}
                language="json"
                wordWrap="off"
                height="100%"
                isLargeFile={false}
              />
            </div>
          </div>
        ) : null}

        {mode === 'shortcuts' ? (
          <div
            className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-6"
            key="shortcuts"
          >
            <div className="max-w-3xl mx-auto w-full">
              <KeyboardShortcuts modKey={modKey} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default UserSettings
