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
  Database,
  Layers
} from 'lucide-react'
import { useSettings, useAutoSave } from '../../hook/useSettingsContext'
import useAdvancedSplitPane from '../splitPanels/useAdvancedSplitPane.js'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import UserSettings from '../preference/UserSettings.jsx'
import cleanErrorJson from '../../hook/useCleanErrorJson.js'
import { AppearanceSettings, EditorSettings, DataSettings, UpdateSettings } from './sections'
import KeyboardShortcuts from '../../features/keyboard/KeyboardShortcutsSection'

/**
 * Main Settings Panel Component
 * Refactored for Premium UI/UX
 */
const SettingsPanel = ({ onClose }) => {
  const { toast, showToast } = useToast()
  const { getSetting, updateSetting, updateSettings } = useSettings()

  // Typography & UI settings (Self-managed by components)
  const [wordWrap, setWordWrap] = useState('on')
  const [autoSave, setAutoSave] = useAutoSave()
  const { overlayMode, setOverlayMode } = useAdvancedSplitPane()
  const fontFamily = getSetting('editor.fontFamily') || 'JetBrains Mono'

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
      // PRO-SEC: Use secure main-process export handler
      if (window.api?.exportJSON && window.api?.getSnippets) {
        // Request full content (metadataOnly: false)
        const snippets = await window.api.getSnippets({ metadataOnly: false })
        const data = {
          exportDate: new Date().toISOString(),
          version: '1.1.6',
          snippets
        }

        const success = await window.api.exportJSON(data)
        if (success) {
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
    setOverlayMode(checked)
  }

  const handleFontFamilyChange = (value) => {
    updateSetting('editor.fontFamily', value)
  }

  const navItems = [
    { id: 'updates', label: 'Updates', icon: RefreshCw },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor', icon: Type },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'system', label: 'System & Data', icon: Database },
    { id: 'json', label: 'Configuration', icon: FileJson, action: handleOpenJson }
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
        {/* Header - Fixed height to match main content */}
        <div className="px-6 h-16 flex items-center border-b border-[var(--color-border)] flex-shrink-0">
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
            className={`${activeTab === 'json' ? 'w-full h-full' : 'max-w-3xl mx-auto'} animate-fade-in min-h-0 flex flex-col`}
          >
            {/* Desktop Header for Context - Matches sidebar height */}
            <div
              className={`h-16 border-b border-[var(--color-border)] flex-shrink-0 flex items-center justify-between px-4 sm:px-6 ${activeTab === 'json' ? 'bg-slate-50/30 dark:bg-zinc-900/10' : 'mb-6'}`}
            >
              <div className="flex flex-col justify-center h-full min-w-0">
                <h1 className="text-[10px] sm:text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-1.5 truncate">
                  {navItems.find((i) => i.id === activeTab)?.icon &&
                    React.createElement(navItems.find((i) => i.id === activeTab).icon, {
                      size: 14,
                      className: 'opacity-50'
                    })}
                  <span className="truncate">
                    {navItems.find((i) => i.id === activeTab)?.label}
                  </span>
                </h1>
                {activeTab !== 'json' && (
                  <p className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] mt-0.5 opacity-60 truncate">
                    Customize your development environment
                  </p>
                )}
              </div>

              {/* Injected Header Content (used for Configuration Tab tabs) */}
              <div id="settings-header-right" className="flex-shrink-0"></div>
            </div>

            <div
              className={`flex-1 min-h-0 ${activeTab === 'json' ? '' : 'overflow-y-auto custom-scrollbar pr-1'}`}
            >
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
                  fontFamily={fontFamily}
                  onFontFamilyChange={handleFontFamilyChange}
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
    </div>
  )
}

SettingsPanel.propTypes = {
  onClose: PropTypes.func
}

export default SettingsPanel
