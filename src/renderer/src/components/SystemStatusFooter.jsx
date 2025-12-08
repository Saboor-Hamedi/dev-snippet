import React from 'react'
import PropTypes from 'prop-types'
import ToggleButton from './ToggleButton'
import { useSettings } from '../hook/useSettingsContext'

const SystemStatusFooter = ({ snippets = [] }) => {
  const { getSetting, updateSetting } = useSettings()
  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false

  return (
    <div className="px-8 py-3 bg-[var(--color-bg-secondary)]/30 border-t border-[var(--color-border)]/10">
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-[var(--color-text-secondary)]">System Ready</span>
          </div>
          <div className="text-[var(--color-text-secondary)] font-mono opacity-60">v1.2.0</div>
        </div>
        <div className="flex items-center gap-6 text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[var(--color-accent)] tabular-nums">
              {snippets.length}
            </span>
            <span>Snippets</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[var(--color-accent)] tabular-nums">
              {new Set(snippets.map((s) => s.language)).size}
            </span>
            <span>Languages</span>
          </div>
          <div className="flex items-center gap-2 pl-4 border-l border-[var(--color-border)]/10">
            <span className="text-[var(--color-text-secondary)] opacity-80">Don't show again</span>
            <ToggleButton
              checked={hideWelcomePage}
              onChange={(checked) => updateSetting('ui.hideWelcomePage', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

SystemStatusFooter.propTypes = {
  snippets: PropTypes.array
}

export default SystemStatusFooter
