import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Save, Code, Sliders, RotateCcw } from 'lucide-react'
import { useSettings } from '../../hook/useSettingsContext'
import { useToast } from '../../hook/useToast'
import CodeEditor from '../CodeEditor/CodeEditor'
import SettingsForm from '../settings/SettingsForm'
import cleanErrorJson from '../../hook/useCleanErrorJson.js'
import ToastNotification from '../../utils/ToastNotification'

const UserSettings = () => {
  const { settings, updateSettings, resetSettings: contextResetSettings } = useSettings()
  const { toast, showToast } = useToast()

  // 'ui' or 'json'
  const [mode, setMode] = useState('ui')

  // Local state for the JSON editor string
  const [jsonText, setJsonText] = useState('')

  // Sync jsonText when settings change or when switching to JSON mode
  useEffect(() => {
    if (settings && (mode === 'json' || jsonText === '')) {
      setJsonText(JSON.stringify(settings, null, 2))
    }
  }, [settings, mode])

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
    if (confirm('Are you sure you want to reset to defaults?')) {
      if (contextResetSettings) contextResetSettings()
    }
  }

  // Find the header portal target
  const headerPortalTarget = document.getElementById('settings-header-right')

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      <ToastNotification toast={toast} />

      {/* Mode Switcher & Controls - Portaled to Header */}
      {headerPortalTarget &&
        createPortal(
          <div className="flex items-center gap-2 sm:gap-4 ml-2">
            {/* Conditional Toggling Switcher (Only show opposite mode) */}
            <div className="flex items-center">
              {mode === 'ui' ? (
                <button
                  onClick={() => setMode('json')}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-[var(--color-border)] rounded-md text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all shadow-sm"
                  title="Switch to Source Code"
                >
                  <Code size={11} className="opacity-70" />
                  <span className="hidden sm:inline">Source Code</span>
                </button>
              ) : (
                <button
                  onClick={() => setMode('ui')}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-[var(--color-border)] rounded-md text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all shadow-sm"
                  title="Switch to Visual Editor"
                >
                  <Sliders size={11} className="opacity-70" />
                  <span className="hidden sm:inline">Visual Editor</span>
                </button>
              )}
            </div>

            {/* Source Code Action Buttons */}
            {mode === 'json' && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--color-border)]">
                <button
                  onClick={handleReset}
                  title="Reset Defaults"
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all sm:px-2 sm:py-1 sm:text-[9px] sm:font-bold sm:uppercase sm:tracking-wider sm:border sm:border-transparent sm:hover:border-red-500/30"
                >
                  <RotateCcw size={12} className="sm:hidden" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  onClick={handleJsonSave}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] uppercase font-bold tracking-tight transition-all shadow-sm"
                >
                  <Save size={11} />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>,
          headerPortalTarget
        )}

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {mode === 'ui' ? (
          <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 overflow-y-auto h-full custom-scrollbar">
            <SettingsForm key="visual-settings" />
          </div>
        ) : (
          <div className="h-full flex flex-col" key="json-settings">
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
        )}
      </div>
    </div>
  )
}

export default UserSettings
