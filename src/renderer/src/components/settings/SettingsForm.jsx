import React from 'react'
import { Monitor, Type, Settings as SettingsIcon, MousePointer2, Layout, Eye } from 'lucide-react'
import { SettingSection, SettingToggle, SettingSelect, SettingInput } from './components'
import { useSettings, useCompactMode } from '../../hook/useSettingsContext'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import useFontSettings from '../../hook/settings/useFontSettings'
import useCursorProp from '../../hook/settings/useCursorProp'

const SettingsForm = () => {
  const { settings, updateSetting, isLoading } = useSettings()
  const { toast, showToast } = useToast()
  const [compactMode, setCompactMode] = useCompactMode()

  // Hooks for matched settings from other tabs
  const fontSettings = useFontSettings()
  const cursorSettings = useCursorProp()

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>

  const handleUpdate = (section, key, value) => {
    updateSetting(`${section}.${key}`, value)
    showToast(`✓ Updated ${key}`)
  }

  const handleCompactToggle = (v) => {
    setCompactMode(v)
    showToast(`✓ Compact Mode ${v ? 'Enabled' : 'Disabled'}`)
  }

  const onSettingChange = (setter, label) => (val) => {
    setter(val)
    showToast(`✓ Updated ${label}`)
  }

  return (
    <div className="max-w-2xl mx-auto py-2 px-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <ToastNotification toast={toast} />

      {/* SECTION: Global Appearance */}
      <SettingSection title="Global Appearance" icon={Monitor} iconColor="text-blue-500">
        <SettingToggle
          label="Compact Mode"
          description="Reduce padding in the sidebar and lists."
          checked={compactMode}
          onChange={handleCompactToggle}
        />
      </SettingSection>

      {/* SECTION: Typography */}
      <SettingSection title="Typography" icon={Type} iconColor="text-emerald-500">
        <SettingSelect
          label="Editor Font Family"
          description="Monospace fonts recommended."
          value={fontSettings.editorFontFamily}
          onChange={onSettingChange(fontSettings.updateEditorFontFamily, 'Font Family')}
          options={['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New']}
        />

        <SettingInput
          label="Editor Font Size"
          description="Controls the editor font size."
          value={fontSettings.editorFontSize}
          onChange={onSettingChange(fontSettings.updateEditorFontSize, 'Font Size')}
          type="number"
        />

        <SettingToggle
          label="Font Ligatures"
          description="Enable symbols combining (e.g. => turns into an arrow)."
          checked={settings.editor?.fontLigatures !== false}
          onChange={(v) => handleUpdate('editor', 'fontLigatures', v)}
        />
      </SettingSection>

      {/* SECTION: Editor Experience */}
      <SettingSection title="Editor Experience" icon={Layout} iconColor="text-purple-500">
        <SettingToggle
          label="Word Wrap"
          description="Wrap long lines in the editor."
          checked={settings.editor?.wordWrap === 'on'}
          onChange={(v) => handleUpdate('editor', 'wordWrap', v ? 'on' : 'off')}
        />

        <SettingToggle
          label="Line Numbers"
          checked={settings.editor?.lineNumbers !== 'off'}
          onChange={(v) => handleUpdate('editor', 'lineNumbers', v ? 'on' : 'off')}
        />

        <SettingToggle
          label="Minimap"
          description="Show the code overview on the right side."
          checked={settings.editor?.minimap?.enabled ?? false}
          onChange={(v) =>
            handleUpdate('editor', 'minimap', { ...settings.editor?.minimap, enabled: v })
          }
        />

        <SettingSelect
          label="Cursor Blinking"
          description="Controls the cursor animation style."
          value={cursorSettings.cursorBlinking ? 'blink' : 'solid'}
          onChange={(v) => cursorSettings.setCursorBlinking(v === 'blink')}
          options={[
            { label: 'Blink', value: 'blink' },
            { label: 'Solid', value: 'solid' }
          ]}
        />
      </SettingSection>

      {/* SECTION: Cursor & Interaction */}
      <SettingSection
        title="Cursor & Cursor Details"
        icon={MousePointer2}
        iconColor="text-cyan-500"
      >
        <SettingSelect
          label="Cursor Shape"
          value={cursorSettings.cursorShape}
          onChange={onSettingChange(cursorSettings.setCursorShape, 'Cursor Shape')}
          options={[
            { value: 'bar', label: 'Bar' },
            { value: 'block', label: 'Block' },
            { value: 'underline', label: 'Underline' }
          ]}
        />
        <SettingInput
          label="Cursor Width"
          description="Thickness of the text cursor."
          value={cursorSettings.cursorWidth}
          onChange={onSettingChange(cursorSettings.setCursorWidth, 'Cursor Width')}
          type="number"
        />
        <SettingInput
          label="Selection Background"
          description="CSS color for selected text."
          value={cursorSettings.cursorSelectionBg}
          onChange={onSettingChange(cursorSettings.setCursorSelectionBg, 'Selection Color')}
          placeholder="#58a6ff33"
        />
      </SettingSection>

      {/* SECTION: System */}
      <SettingSection title="System" icon={SettingsIcon} iconColor="text-slate-500">
        <SettingInput
          label="Snippets Directory"
          description="Custom path to store snippets (Coming Soon)."
          value={settings.system?.snippetPath || ''}
          onChange={() => {}}
          placeholder="Default application folder"
          noBorder
        />
      </SettingSection>
    </div>
  )
}

export default SettingsForm
