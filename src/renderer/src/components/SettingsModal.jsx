// b:\electron\dev-snippet\src\renderer\src\components\SettingsModal.jsx
import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  X,
  Settings,
  Monitor,
  Keyboard,
  Type,
  MousePointer2,
  FileCode,
  Zap,
  RotateCcw,
  Search,
  Command,
  Layout,
  History,
  RefreshCw,
  Database,
  FileJson
} from 'lucide-react'
import { UpdateSettings, KeyboardShortcuts, DataSettings } from './settings/sections'
import UserSettings from './preference/UserSettings'
import { MIN_ZOOM, MAX_ZOOM } from '../hook/useZoomLevel'
import ToggleButton from './ToggleButton'
import {
  SettingRow,
  SettingSection,
  SettingToggle,
  SettingSelect,
  SettingInput
} from './settings/components'

const SettingsModal = ({ isOpen, onClose, currentSettings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(currentSettings)
  const [activeTab, setActiveTab] = useState('updates')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(currentSettings)
      setActiveTab('updates')
      setShowMobileMenu(false)
    }
  }, [currentSettings, isOpen])

  const updateSetting = (path, value) => {
    const pathArray = path.split('.')
    const newSettings = JSON.parse(JSON.stringify(localSettings)) // Deep clone

    let target = newSettings
    for (let i = 0; i < pathArray.length - 1; i++) {
      if (!target[pathArray[i]]) target[pathArray[i]] = {}
      target = target[pathArray[i]]
    }

    target[pathArray[pathArray.length - 1]] = value
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const sections = [
    { id: 'updates', label: 'Updates', icon: RefreshCw },
    { id: 'editor', label: 'Editor', icon: Type },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'behavior', label: 'Behavior', icon: Zap },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'system', label: 'System & Data', icon: Database },
    { id: 'json', label: 'Configuration', icon: FileJson },
    { id: 'advanced', label: 'Advanced', icon: Command },
    { id: 'history', label: 'History', icon: History }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-2 md:p-6">
      <div
        className="w-full max-w-5xl h-full md:h-[85vh] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl md:rounded-2xl shadow-3xl flex relative overflow-hidden ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* SIDEBAR - Responsive Toggle */}
        <aside
          className={`
            fixed md:relative inset-y-0 left-0 z-50 w-64 md:w-64 border-r flex flex-col bg-opacity-95 md:bg-opacity-50
            transition-transform duration-300 ease-in-out md:translate-x-0
            ${showMobileMenu ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          `}
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderRightColor: 'var(--color-border)'
          }}
        >
          {/* Sidebar Header */}
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-accent-primary)]/20">
                  <Settings size={18} className="text-[var(--color-bg-primary)]" />
                </div>
                <h2 className="text-sm font-bold tracking-tight">Settings</h2>
              </div>
              <button
                className="md:hidden p-2 opacity-50 hover:opacity-100"
                onClick={() => setShowMobileMenu(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="relative group">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity"
              />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md py-1.5 pl-9 pr-3 text-xs outline-none focus:border-[var(--color-accent-primary)] transition-all"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-0.5 md:space-y-1 overflow-y-auto custom-scrollbar pt-2">
            {sections.map((section) => {
              const isActive = activeTab === section.id
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveTab(section.id)
                    setShowMobileMenu(false) // Close menu on select
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm md:text-xs font-medium cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--color-accent-primary)] text-[var(--color-bg-primary)] shadow-md'
                      : 'hover:bg-[var(--hover-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {section.label}
                </button>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => {
                const defaults = {
                  editor: {
                    zoomLevel: 1.0,
                    fontSize: 16,
                    fontFamily: 'JetBrains Mono',
                    fontLigatures: true,
                    lineNumbers: true,
                    wordWrap: 'off',
                    tabSize: 2
                  },
                  ui: { compactMode: false, sidebarIconColor: '#c9d1d9', sidebarWidth: 250 },
                  behavior: { autoSave: true, autoSaveDelay: 2000 },
                  advanced: { enableCodeFolding: true, enableAutoComplete: true }
                }
                setLocalSettings(defaults)
                onSettingsChange(defaults)
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <RotateCcw size={14} />
              Restore Defaults
            </button>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {showMobileMenu && (
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* CONTENT */}
        <main
          className="flex-1 flex flex-col bg-opacity-30 min-w-0"
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          {/* Content Header */}
          <div
            className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
              >
                <Layout size={20} className="opacity-70" />
              </button>
              <div className="flex flex-col">
                <h3 className="text-lg md:text-xl font-bold capitalize leading-tight">
                  {activeTab}
                </h3>
                <p className="text-[10px] md:text-xs opacity-50 hidden sm:block">
                  Manage your {activeTab} preferences.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div id="settings-header-right"></div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--hover-bg)] rounded-lg md:rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className={`max-w-2xl ${activeTab === 'json' ? 'max-w-none h-full' : ''}`}>
              {activeTab === 'updates' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <UpdateSettings />
                </div>
              )}

              {activeTab === 'editor' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <SettingSection title="Typography" icon={Type}>
                    <SettingSelect
                      label="Font Family"
                      description="Recommended: JetBrains Mono or Fira Code."
                      value={localSettings.editor?.fontFamily || 'JetBrains Mono'}
                      onChange={(v) => updateSetting('editor.fontFamily', v)}
                      options={['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New']}
                    />
                    <SettingInput
                      label="Font Size"
                      description="Changes the global font size for code."
                      value={localSettings.editor?.fontSize || 16}
                      type="number"
                      onChange={(v) => updateSetting('editor.fontSize', parseInt(v))}
                    />
                    <SettingToggle
                      label="Font Ligatures"
                      description="Enable symbols like => to display as arrows."
                      checked={localSettings.editor?.fontLigatures !== false}
                      onChange={(v) => updateSetting('editor.fontLigatures', v)}
                    />
                  </SettingSection>

                  <SettingSection title="Layout" icon={Layout}>
                    <SettingRow
                      label="Zoom Level"
                      description={`Global UI scaling: ${localSettings.editor?.zoomLevel || 1.0}x`}
                    >
                      <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step="0.1"
                        value={localSettings.editor?.zoomLevel || 1.0}
                        onChange={(e) =>
                          updateSetting('editor.zoomLevel', parseFloat(e.target.value))
                        }
                        className="w-36 h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-primary)]"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                      />
                    </SettingRow>
                    <SettingToggle
                      label="Line Numbers"
                      checked={localSettings.editor?.lineNumbers !== false}
                      onChange={(v) => updateSetting('editor.lineNumbers', v)}
                    />
                    <SettingSelect
                      label="Word Wrap"
                      value={localSettings.editor?.wordWrap || 'off'}
                      onChange={(v) => updateSetting('editor.wordWrap', v)}
                      options={[
                        { label: 'On', value: 'on' },
                        { label: 'Off', value: 'off' }
                      ]}
                    />
                    <SettingSelect
                      label="Tab Size"
                      value={localSettings.editor?.tabSize || 2}
                      onChange={(v) => updateSetting('editor.tabSize', parseInt(v))}
                      options={[
                        { label: '2 Spaces', value: 2 },
                        { label: '4 Spaces', value: 4 },
                        { label: '8 Spaces', value: 8 }
                      ]}
                    />
                  </SettingSection>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <SettingSection title="UI Aesthetic" icon={Monitor}>
                    <SettingToggle
                      label="Compact Mode"
                      description="Reduce vertical padding across the application."
                      checked={localSettings.ui?.compactMode || false}
                      onChange={(v) => updateSetting('ui.compactMode', v)}
                    />
                    <SettingToggle
                      label="Show Header"
                      description="Display the top title bar and action buttons."
                      checked={localSettings.ui?.showHeader !== false}
                      onChange={(v) => updateSetting('ui.showHeader', v)}
                    />
                    <SettingToggle
                      label="Show Activity Bar"
                      description="Display the leftmost navigation bar with Explorer and Themes icons."
                      checked={localSettings.ui?.showActivityBar !== false}
                      onChange={(v) => updateSetting('ui.showActivityBar', v)}
                    />
                    <SettingToggle
                      label="Show Sidebar"
                      description="Display the file explorer and search panel."
                      checked={localSettings.ui?.showSidebar !== false}
                      onChange={(v) => updateSetting('ui.showSidebar', v)}
                    />
                    <SettingToggle
                      label="Show Status Bar"
                      description="Display the bottom bar with file info and system status."
                      checked={localSettings.ui?.showStatusBar !== false}
                      onChange={(v) => updateSetting('ui.showStatusBar', v)}
                    />
                    <SettingToggle
                      label="Focus Mode"
                      description="Hide all UI and center the editor (Alt+Shift+F)."
                      checked={localSettings.ui?.showFocusMode || false}
                      onChange={(v) => updateSetting('ui.showFocusMode', v)}
                    />
                    <SettingInput
                      label="Sidebar Icon Color"
                      description="Customize the color of the sidebar file icons."
                      value={localSettings.ui?.sidebarIconColor || '#c9d1d9'}
                      onChange={(v) => updateSetting('ui.sidebarIconColor', v)}
                    />
                  </SettingSection>
                </div>
              )}

              {activeTab === 'behavior' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <SettingSection title="Saving & Safety" icon={Zap}>
                    <SettingToggle
                      label="Auto Save"
                      description="Automatically save snippets after changes."
                      checked={localSettings.behavior?.autoSave !== false}
                      onChange={(v) => updateSetting('behavior.autoSave', v)}
                    />
                    {localSettings.behavior?.autoSave && (
                      <SettingInput
                        label="Auto Save Delay (ms)"
                        type="number"
                        value={localSettings.behavior?.autoSaveDelay || 2000}
                        onChange={(v) => updateSetting('behavior.autoSaveDelay', parseInt(v))}
                      />
                    )}
                  </SettingSection>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <SettingSection title="Performance" icon={Command}>
                    <SettingToggle
                      label="Code Folding"
                      checked={localSettings.advanced?.enableCodeFolding !== false}
                      onChange={(v) => updateSetting('advanced.enableCodeFolding', v)}
                    />
                    <SettingToggle
                      label="Auto Complete"
                      checked={localSettings.advanced?.enableAutoComplete !== false}
                      onChange={(v) => updateSetting('advanced.enableAutoComplete', v)}
                    />
                  </SettingSection>
                </div>
              )}

              {activeTab === 'shortcuts' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <KeyboardShortcuts />
                </div>
              )}

              {activeTab === 'system' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <DataSettings
                    hideWelcomePage={localSettings.ui?.hideWelcomePage || false}
                    onWelcomePageToggle={(v) => updateSetting('ui.hideWelcomePage', v)}
                    onExportData={async () => {
                      if (window.api?.exportJSON && window.api?.getSnippets) {
                        const snippets = await window.api.getSnippets({ metadataOnly: false })
                        const data = {
                          exportDate: new Date().toISOString(),
                          version: '1.1.6',
                          snippets
                        }
                        await window.api.exportJSON(data)
                      }
                    }}
                  />
                </div>
              )}

              {activeTab === 'json' && (
                <div className="h-full animate-in slide-in-from-right-4 duration-300 -m-8">
                  <UserSettings />
                </div>
              )}

              {/* Add more tabs as needed */}
              {['history'].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center h-48 opacity-20 transform scale-75">
                  <Zap size={48} />
                  <p className="mt-4 font-bold tracking-widest uppercase">Coming Soon</p>
                </div>
              )}
            </div>
          </div>
        </main>
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
