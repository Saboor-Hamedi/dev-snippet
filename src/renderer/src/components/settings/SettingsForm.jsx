import React, { useState, useEffect } from 'react'
import { Monitor, Type, Layout, Code, Settings as SettingsIcon, FileJson } from 'lucide-react'
import { Toggle, Select, Input } from './controls/SettingsControls'
import { useSettings, useCompactMode } from '../../hook/useSettingsContext'

const SettingsForm = () => {
  const { settings, updateSetting, isLoading } = useSettings()
  const [compactMode, setCompactMode] = useCompactMode()

  // Local state to debounce or manage form vs json
  // But for now we bind directly for instant gratification

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>

  const handleUpdate = (section, key, value) => {
    // updateSetting handles dot notation correctly for nested keys
    // This is safer and more efficient than reconstructing the whole object
    updateSetting(`${section}.${key}`, value)
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* SECTION: Appearance */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <Monitor className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Appearance</h2>
        </div>

        <div className="space-y-1">
          <Toggle
            label="Compact Mode"
            description="Reduce padding in the sidebar and lists."
            value={compactMode}
            onChange={setCompactMode}
          />

          <Toggle
            label="Hide Welcome Page"
            description="Start with a blank workspace instead of the welcome screen."
            value={settings.ui?.hideWelcomePage ?? false}
            onChange={(v) => handleUpdate('ui', 'hideWelcomePage', v)}
          />
        </div>
      </section>

      {/* SECTION: Editor */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <Type className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Editor</h2>
        </div>

        <div className="space-y-1">
          <Select
            label="Font Family"
            description="The font used in the code editor area."
            value={settings.editor?.fontFamily || 'Fira Code'}
            onChange={(v) => handleUpdate('editor', 'fontFamily', v)}
            options={[
              { label: 'Fira Code', value: "'Fira Code', monospace" },
              { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
              { label: 'Cascadia Code', value: "'Cascadia Code', monospace" },
              { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
              { label: 'Consolas (System)', value: "Consolas, 'Courier New', monospace" }
            ]}
          />

          <Select
            label="Font Size"
            value={parseInt(settings.editor?.fontSize) || 14}
            onChange={(v) => handleUpdate('editor', 'fontSize', parseInt(v))}
            options={[
              { label: '12px', value: 12 },
              { label: '14px', value: 14 },
              { label: '16px', value: 16 },
              { label: '18px', value: 18 },
              { label: '20px', value: 20 },
              { label: '24px', value: 24 }
            ]}
          />

          <Select
            label="Cursor Blinking"
            description="Controls the cursor animation style."
            value={settings.editor?.cursorBlinking || 'blink'}
            onChange={(v) => handleUpdate('editor', 'cursorBlinking', v)}
            options={[
              { label: 'Blink', value: 'blink' },
              { label: 'Smooth', value: 'smooth' },
              { label: 'Phase', value: 'phase' },
              { label: 'Expand', value: 'expand' },
              { label: 'Solid', value: 'solid' }
            ]}
          />

          <Toggle
            label="Font Ligatures"
            description="Enable symbols combining (e.g. => turns into an arrow)."
            value={settings.editor?.fontLigatures ?? true}
            onChange={(v) => handleUpdate('editor', 'fontLigatures', v)}
          />

          <Toggle
            label="Line Numbers"
            value={settings.editor?.lineNumbers !== 'off'}
            onChange={(v) => handleUpdate('editor', 'lineNumbers', v ? 'on' : 'off')}
          />

          <Toggle
            label="Word Wrap"
            value={settings.editor?.wordWrap === 'on'}
            onChange={(v) => handleUpdate('editor', 'wordWrap', v ? 'on' : 'off')}
          />

          <Toggle
            label="Minimap"
            description="Show the code overview on the right side."
            value={settings.editor?.minimap?.enabled ?? false}
            onChange={(v) =>
              handleUpdate('editor', 'minimap', { ...settings.editor?.minimap, enabled: v })
            }
          />

          <Input
            label="Background Color (CSS)"
            description="Override the editor background color (e.g. #1e1e1e or transparent)."
            value={settings.editor?.editorBgColor || ''}
            onChange={(v) => handleUpdate('editor', 'editorBgColor', v)}
            placeholder="#232731"
          />
        </div>
      </section>

      {/* SECTION: AI & System (Placeholder) */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <SettingsIcon className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">System</h2>
        </div>

        <div className="space-y-1">
          <Input
            label="Snippets Directory"
            description="Custom path to store snippets (Coming Soon)."
            value={settings.system?.snippetPath || ''}
            onChange={() => {}} // Disabled for now
            disabled
            placeholder="Default application folder"
          />
        </div>
      </section>
    </div>
  )
}

export default SettingsForm
