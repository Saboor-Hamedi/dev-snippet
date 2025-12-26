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
  FileJson,
  Info,
  Cloud
} from 'lucide-react'
import { DEFAULT_SETTINGS } from '../config/defaultSettings'
import CodeEditor from './CodeEditor/CodeEditor'
import { MIN_ZOOM, MAX_ZOOM } from '../hook/useZoomLevel'
import ToggleButton from './ToggleButton'
import {
  SettingRow,
  SettingSection,
  SettingToggle,
  SettingSelect,
  SettingInput
} from './settings/components'

// Lazy load settings sections to improve performance
const UpdateSettings = React.lazy(() => import('./settings/sections/UpdateSettings'))
const KeyboardShortcuts = React.lazy(() => import('./settings/sections/KeyboardShortcuts'))
const DataSettings = React.lazy(() => import('./settings/sections/DataSettings'))
const UserSettings = React.lazy(() => import('./preference/UserSettings'))
const SyncSettings = React.lazy(() => import('./settings/sections/SyncSettings'))
// Appearance and Editor settings are kept inline to preserve specific custom logic + UI features that were missing in the external files

const SettingsModal = ({ isOpen, onClose, currentSettings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(currentSettings)
  const [activeTab, setActiveTab] = useState('updates')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Sync local settings when external settings change (without resetting the active tab)
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(currentSettings)
    }
  }, [currentSettings])

  // Reset UI state only when the modal is freshly opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab('updates')
      setShowMobileMenu(false)
    }
  }, [isOpen])

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
    { id: 'sync', label: 'Sync', icon: Cloud },
    { id: 'system', label: 'System & Data', icon: Database },
    { id: 'json', label: 'Configuration', icon: FileJson },
    { id: 'defaults', label: 'defaults', icon: Info },
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
          <div className="px-4 py-3 md:px-5 md:py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[var(--color-accent-primary)] flex items-center justify-center shadow-md">
                  <Settings size={10} className="text-[var(--color-bg-primary)]" />
                </div>
                <h2 className="text-xs font-bold tracking-tight">Settings</h2>
              </div>
              <button
                className="md:hidden p-1.5 opacity-50 hover:opacity-100"
                onClick={() => setShowMobileMenu(false)}
              >
                <X size={14} />
              </button>
            </div>

            {/* Search */}
            <div className="relative group">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity"
              />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded py-1 pl-8 pr-3 text-[11px] outline-none focus:border-[var(--color-accent-primary)] transition-all"
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
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 md:py-1.5 rounded-md text-xs md:text-[11px] font-medium cursor-pointer transition-all duration-200 ${
                    activeTab === section.id
                      ? 'bg-[var(--color-accent-primary)] text-white shadow-sm'
                      : 'hover:bg-[var(--hover-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Icon size={12} strokeWidth={activeTab === section.id ? 2.5 : 2} />
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
            className="flex items-center justify-between px-4 md:px-8 py-2 md:py-3 border-b"
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
                <h3 className="text-sm md:text-base font-bold capitalize leading-tight">
                  {activeTab}
                </h3>
                <p className="text-[9px] md:text-[10px] opacity-50 hidden sm:block">
                  {activeTab === 'defaults'
                    ? 'default user settings'
                    : `Manage your ${activeTab} preferences.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div id="settings-header-right"></div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Scrollable Area */}
          <div
            className={`flex-1 overflow-y-auto custom-scrollbar ${['json', 'defaults'].includes(activeTab) ? 'p-0 overflow-hidden' : 'p-4 md:p-8'}`}
          >
            <div
              className={`${['json', 'defaults'].includes(activeTab) ? 'max-w-none h-full' : 'max-w-2xl pb-[10px]'}`}
            >
              <React.Suspense
                fallback={
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-primary)]"></div>
                  </div>
                }
              >
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
                        options={[
                          'JetBrains Mono',
                          'Fira Code',
                          'Consolas',
                          'Monaco',
                          'Courier New'
                        ]}
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
                        label="Flow Mode"
                        description="Concentrate on your code with the Canvas (Alt+Shift+F)."
                        checked={localSettings.ui?.showFlowMode || false}
                        onChange={(v) => {
                          // Cleanly dispatch Global Event instead of duplicating logic
                          window.dispatchEvent(new CustomEvent('app:toggle-flow'))
                        }}
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
                  <div className="animate-in slide-in-from-right-4 duration-300">
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
                  <div className="animate-in slide-in-from-right-4 duration-300">
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
                    <KeyboardShortcuts modKey={navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} />
                  </div>
                )}

                {activeTab === 'sync' && (
                  <div className="animate-in slide-in-from-right-4  duration-300">
                    <SyncSettings />
                  </div>
                )}

                {activeTab === 'system' && (
                  <div className="animate-in slide-in-from-right-4 duration-300">
                    <DataSettings
                      hideWelcomePage={localSettings.welcome?.hideWelcomePage || false}
                      onWelcomePageToggle={(v) => updateSetting('welcome.hideWelcomePage', v)}
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
                  <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                    <UserSettings />
                  </div>
                )}

                {activeTab === 'defaults' && (
                  <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                    <div className="flex-1 min-h-0 overflow-hidden border-t border-[var(--color-border)]">
                      <CodeEditor
                        value={JSON.stringify(DEFAULT_SETTINGS, null, 2)}
                        readOnly={true}
                        language="json"
                        wordWrap="off"
                      />
                    </div>
                  </div>
                )}
              </React.Suspense>

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
