import React from 'react'
import { SettingSection } from '../components'
import UpdateManager from '../components/UpdateManager'

/**
 * Update Settings Section
 * Dedicated tab for application updates and version information
 */
const UpdateSettings = () => {
  return (
    <SettingSection title="Software Updates">
      <UpdateManager />

      <div className="mt-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
        <p className="text-xs text-blue-400 opacity-80 leading-relaxed italic">
          Keep your developer workbench up to date with the latest features, security patches, and
          performance improvements. Updates are verified and can be installed with a single click.
        </p>
      </div>
    </SettingSection>
  )
}

export default UpdateSettings
