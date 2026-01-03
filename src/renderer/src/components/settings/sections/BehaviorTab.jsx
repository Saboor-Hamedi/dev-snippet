import React from 'react'
import PropTypes from 'prop-types'
import { Zap, History, Trash2 } from 'lucide-react'
import { SettingSection, SettingInput, SettingToggle } from '../components'

/**
 * BehaviorTab Component
 *
 * Controls how the application reacts to events like saving, deleting,
 * and session restoration.
 */
const BehaviorTab = ({ settings, updateSetting }) => {
  return (
    <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
      {/* SECTION: Saving & Safety */}
      <SettingSection title="Saving & Safety" icon={Zap}>
        <SettingToggle
          label="Auto Save"
          description="Automatically save snippet changes without clicking 'Save'."
          checked={settings.behavior?.autoSave !== false}
          onChange={(v) => updateSetting('behavior.autoSave', v)}
        />

        {/* Only show delay if auto-save is enabled */}
        {settings.behavior?.autoSave !== false && (
          <SettingInput
            label="Auto Save Delay (ms)"
            description="Time to wait after your last keystroke before saving."
            type="number"
            value={settings.behavior?.autoSaveDelay || 1000}
            onChange={(v) => updateSetting('behavior.autoSaveDelay', parseInt(v))}
          />
        )}

        <SettingToggle
          label="Confirm Deletion"
          description="Show a warning dialog before permanently deleting a snippet."
          checked={settings.behavior?.confirmDelete !== false}
          onChange={(v) => updateSetting('behavior.confirmDelete', v)}
        />
      </SettingSection>

      {/* SECTION: Session Management */}
      <SettingSection title="Session" icon={History}>
        <SettingToggle
          label="Restore Session"
          description="Re-open all your tabs and active snippet when the app restarts."
          checked={settings.behavior?.restoreSession !== false}
          onChange={(v) => updateSetting('behavior.restoreSession', v)}
        />
      </SettingSection>
    </div>
  )
}

BehaviorTab.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSetting: PropTypes.func.isRequired
}

export default BehaviorTab
