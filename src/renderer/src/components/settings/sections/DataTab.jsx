import React from 'react'
import PropTypes from 'prop-types'
import { FileDown, Database } from 'lucide-react'
import { SettingSection, SettingToggle, SettingRow } from '../components'
import BackupRestorePanel from '../../BackupRestorePanel'

/**
 * DataTab Component
 *
 * Handles application data, welcome page visibility,
 * local library exports, and database backups.
 */
const DataTab = ({ settings, updateSetting, onExportData }) => {
  return (
    <SettingSection title="System & Data" icon={Database}>
      {/* Show Welcome Page Toggle */}
      <SettingToggle
        label="Show Welcome Page"
        description="Display the onboarding screen when starting the application."
        checked={settings.welcome?.hideWelcomePage !== true}
        onChange={(show) => updateSetting('welcome.hideWelcomePage', !show)}
      />

      {/* Export Library */}
      <SettingRow
        label="Export Library"
        description="Generate a portable JSON file containing all your snippets and metadata."
        noBorder
      >
        <button
          onClick={onExportData}
          className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-xtiny font-thin transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--hover-bg)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--color-bg-primary)'
          }}
        >
          <FileDown size={11} />
          Export JSON
        </button>
      </SettingRow>

      {/* Backup & Restore (Local Database) */}
      <div className="mt-4 p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <BackupRestorePanel />
      </div>
    </SettingSection>
  )
}

DataTab.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSetting: PropTypes.func.isRequired,
  onExportData: PropTypes.func.isRequired
}

export default DataTab
