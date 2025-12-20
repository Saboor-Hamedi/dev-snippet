import React from 'react'
import PropTypes from 'prop-types'
import { FileDown } from 'lucide-react'
import { SettingSection, SettingToggle, SettingRow } from '../components'
import BackupRestorePanel from '../../BackupRestorePanel'

/**
 * Data & System Settings Section
 * Handles welcome page toggle, data export, and backup/restore
 */
const DataSettings = ({ hideWelcomePage, onWelcomePageToggle, onExportData }) => {
  return (
    <SettingSection title="System & Data">
      {/* Show Welcome Page Toggle */}
      <SettingToggle
        label="Show Welcome Page"
        description="Show the welcome page when starting the application."
        checked={!hideWelcomePage}
        onChange={(checked) => onWelcomePageToggle(!checked)}
      />

      {/* Export Library */}
      <SettingRow
        label="Export Library"
        description="Create a JSON backup of all your snippets and projects."
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
          Export Data
        </button>
      </SettingRow>

      {/* Backup & Restore */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <BackupRestorePanel />
      </div>
    </SettingSection>
  )
}

DataSettings.propTypes = {
  hideWelcomePage: PropTypes.bool.isRequired,
  onWelcomePageToggle: PropTypes.func.isRequired,
  onExportData: PropTypes.func.isRequired
}

export default DataSettings
