import React from 'react'
import PropTypes from 'prop-types'
import ToggleButton from './ToggleButton'
import { useSettings } from '../hook/useSettingsContext'

const SystemStatusFooter = ({ snippets = [] }) => {
  const { getSetting, updateSetting } = useSettings()
  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false
  const [version, setVersion] = React.useState('...')

  React.useEffect(() => {
    window.api?.getVersion().then(setVersion)
  }, [])

  return (
    <div className="flex items-center justify-between py-1 select-none bg-[var(--welcome-bg)]">
      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 ">
        {/* System Ready - Using 'px-1 py-0.5' for similar height/padding as extension/zoom */}
        <div className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-default">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
          <span className="font-mono tabular-nums">System Ready</span>
        </div>
        {/* Version - Using 'px-1 py-0.5' */}
        <div className="px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-default opacity-80">
          <span className="font-mono tabular-nums">v{version}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        {/* Snippets Count - Using 'px-1 py-0.5' */}
        <div className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-default">
          <span className="font-mono tabular-nums">{snippets.length}</span>
          <span className="font-mono tabular-nums">Snippets</span>
        </div>
        {/* Languages Count - Using 'px-1 py-0.5' */}
        <div className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-default">
          <span className="font-mono tabular-nums">
            {new Set(snippets.map((s) => s.language)).size}
          </span>
          <span className="font-mono tabular-nums">Languages</span>
        </div>

        <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <div className="flex items-center gap-2">
          <span className="opacity-80 px-1 py-0.5 font-mono tabular-nums">Don't show again</span>
          <ToggleButton
            checked={hideWelcomePage}
            onChange={(checked) => updateSetting('ui.hideWelcomePage', checked)}
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
