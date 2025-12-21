import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { ChevronLeft, Settings as SettingsIcon, FileJson, RefreshCw } from 'lucide-react'
import { useSettings } from '../../hook/useSettingsContext'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import UserSettings from '../preference/UserSettings.jsx'
import cleanErrorJson from '../../hook/useCleanErrorJson.js'
import {
  AppearanceSettings,
  EditorSettings,
  KeyboardShortcuts,
  DataSettings,
  UpdateSettings
} from './sections'

/**
 * Main Settings Panel Component
 * Refactored to use modular section components
 */
const SettingsPanel = ({ onClose }) => {
  const { toast, showToast } = useToast()
  const { getSetting, updateSetting, updateSettings } = useSettings()

  // Typography & UI settings (Self-managed by components)
  // Cursor settings (Self-managed by components)

  // Editor settings
  const [wordWrap, setWordWrap] = useState('on')
  const [autoSave, setAutoSave] = useState(false)
  const [overlayMode, setOverlayMode] = useState(() => {
    try {
      const saved = localStorage.getItem('overlayMode')
      return saved ? saved === 'true' : false
    } catch (e) {
      return false
    }
  })

  // UI state
  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false
  const [activeTab, setActiveTab] = useState('updates')
  const [jsonContent, setJsonContent] = useState('')
  const [isJsonDirty, setIsJsonDirty] = useState(false)

  // Detect platform for keyboard shortcuts
  const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipod|ipad/i.test(navigator.platform)
  const modKey = isMac ? '⌘' : 'Ctrl'

  // Handlers
  const handleGoBack = () => {
    if (onClose) onClose()
  }

  const handleExportData = async () => {
    try {
      if (window.api?.saveFileDialog && window.api?.writeFile && window.api?.getSnippets) {
        const snippets = await window.api.getSnippets()
        const path = await window.api.saveFileDialog()

        if (path) {
          const data = {
            exportDate: new Date().toISOString(),
            version: '1.1.2',
            snippets
          }
          await window.api.writeFile(path, JSON.stringify(data, null, 2))
          showToast('✓ Data exported successfully')
        }
      }
    } catch (error) {
      showToast('❌ Failed to export data')
    }
  }

  const handleOpenJson = async () => {
    setActiveTab('json')
    if (window.api?.readSettingsFile) {
      try {
        const content = await window.api.readSettingsFile()
        setJsonContent(content || '{}')
        setIsJsonDirty(false)
      } catch (error) {
        showToast('❌ Failed to load settings file')
      }
    }
  }

  const handleSaveJson = async () => {
    let parsedSettings

    try {
      parsedSettings = JSON.parse(jsonContent)
    } catch (error) {
      const cleanError = cleanErrorJson(error, jsonContent)
      showToast(`Syntax Error: ${cleanError}`)
      return
    }

    try {
      await updateSettings(parsedSettings)
      setIsJsonDirty(false)
      showToast('✓ Settings saved and applied')
    } catch (error) {
      showToast(`❌ System Error during save: ${error.message}`)
    }
  }

  const handleOverlayModeChange = (checked) => {
    try {
      setOverlayMode(checked)
      localStorage.setItem('overlayMode', checked ? 'true' : 'false')
    } catch (e) {
      setOverlayMode((s) => !s)
    }
  }

  return (
    <div
      className="settings-panel h-full flex flex-col md:flex-row overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}
    >
      <ToastNotification toast={toast} />

      {/* Sidebar Navigation */}
      <div
        className="w-full md:w-48 flex-shrink-0 flex flex-col border-r pt-4"
        style={{
          borderColor: 'var(--color-border)'
        }}
      >
        {/* Navigation List */}
        <div className="flex flex-col w-full overflow-y-auto custom-scrollbar flex-1 pb-4">
          <button
            onClick={() => setActiveTab('updates')}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'updates'
                ? 'border-l-2 bg-[var(--color-bg-primary)]'
                : 'border-l-2 border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'updates' ? 'var(--color-accent-primary)' : 'transparent',
              color:
                activeTab === 'updates'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)'
            }}
          >
            <RefreshCw
              size={13}
              className={activeTab === 'updates' ? 'text-[var(--color-accent-primary)]' : ''}
            />
            <span>Software Update</span>
          </button>

          {[
            { id: 'appearance', label: 'Appearance' },
            { id: 'editor', label: 'Editor' },
            { id: 'shortcuts', label: 'Shortcuts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-l-2 bg-[var(--color-bg-primary)]'
                  : 'border-l-2 border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
              }`}
              style={{
                borderColor: activeTab === tab.id ? 'var(--color-accent-primary)' : 'transparent',
                color:
                  activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
              }}
            >
              <div
                className={`w-1 h-1 rounded-full ${activeTab === tab.id ? 'bg-[var(--color-accent-primary)]' : 'bg-current opacity-20'}`}
              />
              <span>{tab.label}</span>
            </button>
          ))}

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'system'
                ? 'border-l-2 bg-[var(--color-bg-primary)]'
                : 'border-l-2 border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'system' ? 'var(--color-accent-primary)' : 'transparent',
              color:
                activeTab === 'system' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
            }}
          >
            <div
              className={`w-1 h-1 rounded-full ${activeTab === 'system' ? 'bg-[var(--color-accent-primary)]' : 'bg-current opacity-20'}`}
            />
            <span>System & Data</span>
          </button>
          <button
            onClick={handleOpenJson}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'json'
                ? 'border-l-2 bg-[var(--color-bg-primary)]'
                : 'border-l-2 border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === 'json' ? 'var(--color-accent-primary)' : 'transparent',
              color:
                activeTab === 'json' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
            }}
          >
            <FileJson
              size={13}
              className={activeTab === 'json' ? 'text-[var(--color-accent-primary)]' : 'opacity-50'}
            />
            <span>Edit JSON</span>
          </button>
        </div>

        <div className="mt-auto border-t border-[var(--color-border)] ">
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium  transition-colors hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ChevronLeft size={14} />
            <span>Back to Editor</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {activeTab === 'updates' && <UpdateSettings />}

            {activeTab === 'appearance' && <AppearanceSettings />}

            {activeTab === 'editor' && (
              <EditorSettings
                wordWrap={wordWrap}
                onWordWrapChange={setWordWrap}
                autoSave={autoSave}
                onAutoSaveChange={setAutoSave}
                overlayMode={overlayMode}
                onOverlayModeChange={handleOverlayModeChange}
              />
            )}

            {activeTab === 'shortcuts' && <KeyboardShortcuts modKey={modKey} />}

            {activeTab === 'system' && (
              <DataSettings
                hideWelcomePage={hideWelcomePage}
                onWelcomePageToggle={(value) => updateSetting('ui.hideWelcomePage', value)}
                onExportData={handleExportData}
              />
            )}

            {activeTab === 'json' && (
              <UserSettings
                activeTab={activeTab}
                jsonContent={jsonContent}
                isJsonDirty={isJsonDirty}
                setIsJsonDirty={setIsJsonDirty}
                handleSaveJson={handleSaveJson}
                setJsonContent={setJsonContent}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

SettingsPanel.propTypes = {
  onClose: PropTypes.func
}

export default SettingsPanel
