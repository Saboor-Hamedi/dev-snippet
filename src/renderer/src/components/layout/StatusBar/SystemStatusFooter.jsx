import React from 'react'
import PropTypes from 'prop-types'
import ToggleButton from '../../ToggleButton'
import { useSettings } from '../../../hook/useSettingsContext'

import './StatusBar.css'

const SystemStatusFooter = ({ snippets = [] }) => {
  const { getSetting, updateSetting } = useSettings()
  const hideWelcomePage = getSetting('welcome.hideWelcomePage') || false
  const [version, setVersion] = React.useState('...')

  React.useEffect(() => {
    window.api?.getVersion().then(setVersion)
  }, [])

  return (
    <div className="status-bar-container text-xs">
      <div className="status-bar-left">
        {/* System Ready */}
        <div className="status-bar-item">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
          <span className="font-mono tabular-nums opacity-80">System Ready</span>
        </div>
        {/* Version */}
        <div className="status-bar-item opacity-60">
          <span className="font-mono tabular-nums">v{version}</span>
        </div>
        <div className="status-bar-divider"></div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('app:toggle-flow'))}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-blue-500/10 text-blue-400/80 hover:text-blue-400 transition-all group"
          title="Enter Flow Mode (Alt+Shift+F)"
        >
          <span className="text-xs leading-none group-hover:scale-110 transition-transform">
            🌀
          </span>
          <span className="font-mono text-xtiny opacity-90">Flow Mode</span>
        </button>
      </div>

      <div className="status-bar-right">
        {/* Snippets Count */}
        <div className="status-bar-item opacity-80">
          <span className="font-mono tabular-nums">{snippets.length}</span>
          <span className="font-mono tabular-nums">Snippets</span>
        </div>
        {/* Languages Count */}
        <div className="status-bar-item opacity-80">
          <span className="font-mono tabular-nums">
            {new Set(snippets.map((s) => s.language)).size}
          </span>
          <span className="font-mono tabular-nums">Languages</span>
        </div>

        <div className="status-bar-divider"></div>

        <div className="flex items-center gap-2">
          <span className="opacity-60 px-1 py-0.5 font-mono tabular-nums hover:opacity-100 transition-opacity">
            Don't show again
          </span>
          <ToggleButton
            checked={hideWelcomePage}
            onChange={(checked) => updateSetting('welcome.hideWelcomePage', checked)}
            width={30}
            height={16}
            padding={2}
          />
        </div>
      </div>
    </div>
  )
}

SystemStatusFooter.propTypes = {
  snippets: PropTypes.array
}

export default SystemStatusFooter
