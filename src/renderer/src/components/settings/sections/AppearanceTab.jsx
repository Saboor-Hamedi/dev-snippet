import React from 'react'
import PropTypes from 'prop-types'
import { Monitor, Layout, MousePointer2 } from 'lucide-react'
import {
  SettingSection,
  SettingRow,
  SettingSelect,
  SettingInput,
  SettingToggle
} from '../components'

/**
 * AppearanceTab Component
 *
 * Manages the visual theme, cursor details, and UI layout.
 * Integrated with the Global Theme engine and Sidebar customizer.
 */
const AppearanceTab = ({ settings, updateSetting }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      {/* SECTION: UI Aesthetic */}
      <SettingSection title="UI Aesthetic" icon={Monitor}>
        <SettingToggle
          label="Compact Mode"
          description="Reduce vertical padding across the application for a denser look."
          checked={settings.ui?.compactMode || false}
          onChange={(v) => updateSetting('ui.compactMode', v)}
        />
        <SettingToggle
          label="Show Header"
          description="Display the top title bar and action buttons."
          checked={settings.ui?.showHeader !== false}
          onChange={(v) => updateSetting('ui.showHeader', v)}
        />
        <SettingToggle
          label="Show Activity Bar"
          description="Display the leftmost navigation bar."
          checked={settings.ui?.showActivityBar !== false}
          onChange={(v) => updateSetting('ui.showActivityBar', v)}
        />
        <SettingToggle
          label="Show Status Bar"
          description="Display the bottom bar with file info."
          checked={settings.ui?.showStatusBar !== false}
          onChange={(v) => updateSetting('ui.showStatusBar', v)}
        />
        <SettingToggle
          label="Flow Mode"
          description="Concentrate on your code by switching to the Canvas (Alt+Shift+F)."
          checked={settings.ui?.showFlowMode || false}
          onChange={() => window.dispatchEvent(new CustomEvent('app:toggle-flow'))}
        />
      </SettingSection>

      {/* SECTION: Interface Layout & Locks */}
      <SettingSection title="Interface Layout & Locks" icon={Layout}>
        <SettingToggle
          label="Universal Lock"
          description="Fix all modals and floating toolbars in their current positions."
          checked={settings.ui?.universalLock?.modal || false}
          onChange={(v) => updateSetting('ui.universalLock.modal', v)}
        />
        <SettingToggle
          label="Disable Mode Float"
          description="Prevent the mode switcher from becoming a floating element."
          checked={settings.ui?.modeSwitcher?.disableDraggable || false}
          onChange={(v) => updateSetting('ui.modeSwitcher.disableDraggable', v)}
        />
      </SettingSection>

      {/* SECTION: Sidebar Configuration */}
      <SettingSection title="Sidebar" icon={Layout}>
        <SettingToggle
          label="Show Sidebar"
          description="Toggle visibility of the document explorer."
          checked={settings.sidebar?.visible !== false}
          onChange={(v) => updateSetting('sidebar.visible', v)}
        />
        <SettingInput
          label="Sidebar Background"
          description="Custom color for the explorer sidebar."
          value={settings.sidebar?.bgColor || '#252526'}
          onChange={(v) => updateSetting('sidebar.bgColor', v)}
        />
        <SettingInput
          label="Icon Color"
          description="The highlight color for sidebar icons."
          value={settings.sidebar?.iconColor || '#cccccc'}
          onChange={(v) => updateSetting('sidebar.iconColor', v)}
        />
      </SettingSection>

      {/* SECTION: Cursor Customization */}
      <SettingSection title="Cursor Details" icon={MousePointer2}>
        <SettingSelect
          label="Cursor Shape"
          description="The style of the text insertion point."
          value={settings.cursor?.cursorShape || 'bar'}
          onChange={(v) => updateSetting('cursor.cursorShape', v)}
          options={[
            { label: 'Bar', value: 'bar' },
            { label: 'Block', value: 'block' },
            { label: 'Underline', value: 'underline' }
          ]}
        />
        <SettingToggle
          label="Cursor Blinking"
          description="Animate the cursor with a fade effect."
          checked={settings.cursor?.cursorBlinking !== false}
          onChange={(v) => updateSetting('cursor.cursorBlinking', v)}
        />
        <SettingInput
          label="Selection Background"
          description="Color used for highlighted text ranges."
          value={settings.cursor?.cursorSelectionBg || 'rgba(38, 79, 120, 0.5)'}
          onChange={(v) => updateSetting('cursor.cursorSelectionBg', v)}
          placeholder="e.g. #58a6ff33"
          noBorder
        />
      </SettingSection>
    </div>
  )
}

AppearanceTab.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSetting: PropTypes.func.isRequired
}

export default AppearanceTab
