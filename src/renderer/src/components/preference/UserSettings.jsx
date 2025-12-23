import React, { useState, useEffect } from 'react'
import { Save, Code, Sliders } from 'lucide-react'
import { useSettings } from '../../hook/useSettingsContext'
import { useToast } from '../../hook/useToast'
import CodeEditor from '../CodeEditor/CodeEditor'
import SettingsForm from '../settings/SettingsForm'
import cleanErrorJson from '../../hook/useCleanErrorJson.js'

const UserSettings = () => {
  const { settings, updateSettings, resetSettings } = useSettings()
  const { showToast } = useToast()

  // 'ui' or 'json'
  const [mode, setMode] = useState('ui')

  // Local state for the JSON editor string
  const [jsonText, setJsonText] = useState('')

  // Sync jsonText when settings change or when switching to JSON mode
  // This ensures we always see the latest settings when opening the JSON tab
  useEffect(() => {
    if (settings && mode === 'json') {
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
      if (resetSettings) resetSettings()
      else console.error('resetSettings function is missing from context')
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Settings Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your editor preferences and configurations.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setMode('ui')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'ui'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Sliders size={16} />
            <span>Visual</span>
          </button>
          <button
            onClick={() => setMode('json')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'json'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Code size={16} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {mode === 'ui' ? (
          <SettingsForm key="visual-settings" />
        ) : (
          <div className="h-full flex flex-col" key="json-settings">
            <div className="flex-1 relative min-h-0">
              <CodeEditor
                value={jsonText}
                onChange={setJsonText}
                language="json"
                wordWrap="off"
                height="100%"
                isLargeFile={false}
              />
            </div>

            {/* Toolbar for JSON Mode */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleJsonSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm"
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserSettings
