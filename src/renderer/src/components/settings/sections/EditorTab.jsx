import React from 'react'
import PropTypes from 'prop-types'
import { Type, Layout } from 'lucide-react'
import {
  SettingSection,
  SettingRow,
  SettingSelect,
  SettingInput,
  SettingToggle
} from '../components'
import { MIN_ZOOM, MAX_ZOOM } from '../../../hook/useZoomLevel'

/**
 * EditorTab Component
 *
 * Centralized settings for the Code Editor experience.
 * Used by the SettingsModal.
 */
const EditorTab = ({ settings, updateSetting }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      {/* SECTION: Typography */}
      <SettingSection title="Typography" icon={Type}>
        <SettingSelect
          label="Font Family"
          description="Recommended: JetBrains Mono or Fira Code for best legibility."
          value={settings.editor?.fontFamily || 'JetBrains Mono'}
          onChange={(v) => updateSetting('editor.fontFamily', v)}
          options={['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New']}
        />
        <SettingInput
          label="Font Size"
          description="Global font size for the editor area."
          value={settings.editor?.fontSize || 16}
          type="number"
          onChange={(v) => updateSetting('editor.fontSize', parseInt(v))}
        />
        <SettingToggle
          label="Font Ligatures"
          description="Enable symbols like => to display as single arrows."
          checked={settings.editor?.fontLigatures !== false}
          onChange={(v) => updateSetting('editor.fontLigatures', v)}
        />
      </SettingSection>

      {/* SECTION: Layout & Editor State */}
      <SettingSection title="Layout" icon={Layout}>
        <SettingRow
          label="Zoom Level"
          description={`Global UI scaling: ${settings.editor?.zoomLevel || 1.0}x`}
        >
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.1"
            value={settings.editor?.zoomLevel || 1.0}
            onChange={(e) => updateSetting('editor.zoomLevel', parseFloat(e.target.value))}
            className="w-36 h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-primary)]"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          />
        </SettingRow>

        <SettingToggle
          label="Line Numbers"
          description="Toggle visibility of the left-side line gutter."
          checked={settings.editor?.lineNumbers !== false}
          onChange={(v) => updateSetting('editor.lineNumbers', v)}
        />

        <SettingSelect
          label="Word Wrap"
          description="How the editor handles long lines."
          value={settings.editor?.wordWrap || 'off'}
          onChange={(v) => updateSetting('editor.wordWrap', v)}
          options={[
            { label: 'On', value: 'on' },
            { label: 'Off', value: 'off' }
          ]}
        />

        <SettingSelect
          label="Tab Size"
          description="Number of spaces inserted for a Tab."
          value={settings.editor?.tabSize || 2}
          onChange={(v) => updateSetting('editor.tabSize', parseInt(v))}
          options={[
            { label: '2 Spaces', value: 2 },
            { label: '4 Spaces', value: 4 },
            { label: '8 Spaces', value: 8 }
          ]}
        />

        <SettingToggle
          label="Preview Overlay Mode"
          description="Float preview over editor instead of side-by-side."
          checked={settings.livePreview?.overlayMode || false}
          onChange={(v) => updateSetting('livePreview.overlayMode', v)}
        />
      </SettingSection>
    </div>
  )
}

EditorTab.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSetting: PropTypes.func.isRequired
}

export default EditorTab
