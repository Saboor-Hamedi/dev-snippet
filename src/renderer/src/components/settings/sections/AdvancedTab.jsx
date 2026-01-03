import React from 'react'
import PropTypes from 'prop-types'
import { Command, Cpu, ShieldAlert } from 'lucide-react'
import { SettingSection, SettingInput, SettingToggle } from '../components'

/**
 * AdvancedTab Component
 *
 * Performance tuning, code analysis, and developer-level settings.
 */
const AdvancedTab = ({ settings, updateSetting }) => {
  return (
    <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
      {/* SECTION: Editor Performance */}
      <SettingSection title="Performance" icon={Cpu}>
        <SettingToggle
          label="Code Folding"
          description="Enable folding of blocks (e.g., functions, objects) in the gutter."
          checked={settings.advanced?.enableCodeFolding !== false}
          onChange={(v) => updateSetting('advanced.enableCodeFolding', v)}
        />
        <SettingToggle
          label="Auto Complete"
          description="Provide typing suggestions and completions as you write."
          checked={settings.advanced?.enableAutoComplete !== false}
          onChange={(v) => updateSetting('advanced.enableAutoComplete', v)}
        />
      </SettingSection>

      {/* SECTION: Resource Limits */}
      <SettingSection title="Limits" icon={ShieldAlert}>
        <SettingInput
          label="Max File Size (Bytes)"
          description="Maximum file size allowed for editing (Default: 5MB)."
          type="number"
          value={settings.advanced?.maxFileSize || 5242880}
          onChange={(v) => updateSetting('advanced.maxFileSize', parseInt(v))}
        />
        <SettingToggle
          label="Enable Linting"
          description="Background code analysis to catch errors (Experimental)."
          checked={settings.advanced?.enableLinting || false}
          onChange={(v) => updateSetting('advanced.enableLinting', v)}
        />
      </SettingSection>

      {/* Placeholder for future advanced flags */}
      <div className="flex flex-col items-center justify-center h-24 opacity-20 transform scale-75">
        <Command size={32} />
        <p className="mt-2 font-bold tracking-widest uppercase text-xtiny">
          More items coming soon
        </p>
      </div>
    </div>
  )
}

AdvancedTab.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSetting: PropTypes.func.isRequired
}

export default AdvancedTab
