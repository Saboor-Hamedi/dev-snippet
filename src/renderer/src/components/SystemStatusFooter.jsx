import React from 'react'
import PropTypes from 'prop-types'
import ToggleButton from './ToggleButton'
import { useSettings } from '../hook/useSettingsContext'

const SystemStatusFooter = ({ snippets = [] }) => {
  const { getSetting, updateSetting } = useSettings()
  const hideWelcomePage = getSetting('welcome.hideWelcomePage') || false
  const [version, setVersion] = React.useState('...')

  React.useEffect(() => {
    window.api?.getVersion().then(setVersion)
  }, [])

  return (
    <div
      className="flex items-center justify-between px-3 py-1 select-none border-t"
      style={{
        backgroundColor: 'var(--footer-bg)',
        color: 'var(--statusbar-text, var(--header-text))',
        borderColor: 'var(--color-border)'
      }}
    >
      <div
        className="flex items-center gap-3 text-xs"
        style={{ color: 'var(--statusbar-text, var(--header-text))' }}
      >
        {/* System Ready */}
        <div className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-white/5 transition-colors cursor-default">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
          <span className="font-mono tabular-nums opacity-80">System Ready</span>
        </div>
        {/* Version */}
        <div className="px-1 py-0.5 rounded hover:bg-white/5 transition-colors cursor-default opacity-60">
          <span className="font-mono tabular-nums">v{version}</span>
        </div>
      </div>

      <div
        className="flex items-center gap-2 text-xs"
        style={{ color: 'var(--statusbar-text, var(--header-text))' }}
      >
        {/* Snippets Count */}
        <div className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-white/5 transition-colors cursor-default opacity-80">
          <span className="font-mono tabular-nums">{snippets.length}</span>
          <span className="font-mono tabular-nums">Snippets</span>
        </div>
        {/* Languages Count */}
        <div className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-white/5 transition-colors cursor-default opacity-80">
          <span className="font-mono tabular-nums">
            {new Set(snippets.map((s) => s.language)).size}
          </span>
          <span className="font-mono tabular-nums">Languages</span>
        </div>

        <div className="w-px h-3 bg-white/10 mx-1"></div>

        <div className="flex items-center gap-2">
          <span className="opacity-60 px-1 py-0.5 font-mono tabular-nums hover:opacity-100 transition-opacity">
            Don't show again
          </span>
          <ToggleButton
            checked={hideWelcomePage}
            onChange={(checked) => updateSetting('welcome.hideWelcomePage', checked)}
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
