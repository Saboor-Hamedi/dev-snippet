import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  ChevronLeft,
  Settings,
  FileJson,
  RefreshCw,
  Palette,
  Type,
  Keyboard,
  Database
} from 'lucide-react'
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
 * Refactored for Premium UI/UX
 */
const SettingsPanel = ({ onClose }) => {
  const { toast, showToast } = useToast()
  const { getSetting, updateSetting, updateSettings } = useSettings()

  // Typography & UI settings (Self-managed by components)
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
  const handleExportData = async () => {
    try {
      if (window.api?.saveFileDialog && window.api?.writeFile && window.api?.getSnippets) {
        const snippets = await window.api.getSnippets()
        const path = await window.api.saveFileDialog()

        if (path) {
          const data = {
            exportDate: new Date().toISOString(),
            version: '1.1.6',
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

  const navItems = [
    { id: 'updates', label: 'Software Updates', icon: RefreshCw },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor', icon: Type },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'system', label: 'System & Data', icon: Database },
    { id: 'json', label: 'Edit JSON', icon: FileJson, action: handleOpenJson }
  ]

  return (
    <div
      className="settings-panel h-full flex flex-col md:flex-row overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}
    >
      <ToastNotification toast={toast} />
      {/* Modern Sidebar */}
      <div
        className="w-full md:w-64 flex-shrink-0 flex flex-col border-r bg-slate-50/50 dark:bg-zinc-900/50"
        style={{
          borderColor: 'var(--color-border)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h2 className="text-xs font-bold tracking-wider text-[var(--color-text-secondary)] uppercase">
            Preferences
          </h2>
        </div>

        {/* Navigation List */}
        <div className="flex flex-col w-full overflow-y-auto custom-scrollbar flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) item.action()
                  else setActiveTab(item.id)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-all duration-200 border-l-[3px] ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-500'
                    : 'text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--color-text-primary)] border-transparent'
                }`}
              >
                <Icon
                  size={16}
                  className={`transition-colors duration-200 ${isActive ? 'text-blue-500' : 'opacity-70 group-hover:opacity-100'}`}
                />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-[var(--color-border)] ">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium border border-[var(--color-border)] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[var(--color-text-primary)]"
          >
            <ChevronLeft size={14} />
            <span>Back to Editor</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">
        <div
          className={`flex-1 ${activeTab === 'json' ? 'overflow-hidden' : 'overflow-y-auto px-6 pb-6 pt-4'}`}
        >
          <div
            className={`${activeTab === 'json' ? 'w-full h-full' : 'max-w-3xl mx-auto'} animate-fade-in h-full`}
          >
            {/* Desktop Header for Context */}
            {activeTab !== 'json' && activeTab !== 'updates' && (
              <div className="mb-6 border-b border-[var(--color-border)] pb-3">
                <h1 className="text-sm font-bold text-[var(--color-text-primary)] capitalize tracking-tight flex items-center gap-2">
                  {navItems.find((i) => i.id === activeTab)?.icon &&
                    React.createElement(navItems.find((i) => i.id === activeTab).icon, {
                      size: 16,
                      className: 'opacity-50'
                    })}
                  {navItems.find((i) => i.id === activeTab)?.label}
                </h1>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 opacity-70">
                  Customize your development environment
                </p>
              </div>
            )}

            {/* Header for Mobile/Context - kept for compatibility but hidden on MD */}
            <div className="mb-6 md:hidden">
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)] capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
            </div>

            {/* Persist UpdateSettings to keep download active when switching tabs */}
            <div style={{ display: activeTab === 'updates' ? 'block' : 'none' }}>
              <UpdateSettings />
            </div>

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

            {activeTab === 'json' && <UserSettings />}
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
