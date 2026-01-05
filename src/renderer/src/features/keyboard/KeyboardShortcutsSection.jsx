import React from 'react'
import PropTypes from 'prop-types'
import { Sliders, Keyboard as KeyboardIcon, Code } from 'lucide-react'
import { KeyboardShortcutItem } from '../../components/settings/components'
import { SHORTCUT_DEFINITIONS, MOD_KEY_PLACEHOLDER } from './shortcuts'

export const MODE_CONFIG = [
  {
    id: 'ui',
    label: 'Visual',
    tooltip: 'Visual editor for settings',
    icon: Sliders
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    tooltip: 'Keyboard reference',
    icon: KeyboardIcon
  },
  {
    id: 'json',
    label: 'Source',
    tooltip: 'Raw JSON editor',
    icon: Code
  }
]

const SCOPE_ORDER = ['Navigation', 'Workspace', 'AI', 'Editing', 'Preview', 'Zoom']

const KeyboardShortcutsSection = ({ modKey = 'Ctrl' }) => {
  const visibleShortcuts = SHORTCUT_DEFINITIONS.filter((shortcut) => !shortcut.hideInSettings)

  const grouped = visibleShortcuts.reduce((acc, shortcut) => {
    const scope = shortcut.scope || 'General'
    if (!acc[scope]) acc[scope] = []
    acc[scope].push(shortcut)
    return acc
  }, {})

  const formatCombos = (combos = []) =>
    combos.map((combo) => combo.replaceAll(MOD_KEY_PLACEHOLDER, modKey)).join(' · ')

  return (
    <div className="space-y-8">
      <p className="text-xtiny" style={{ color: 'var(--color-text-tertiary)' }}>
        Common keyboard shortcuts used across the app.
      </p>
      {SCOPE_ORDER.filter((scope) => grouped[scope]?.length).map((scope) => (
        <div key={scope} className="grid grid-cols-[100px_1fr] gap-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 py-1 sticky top-0">
            {scope}
          </div>
          <div className="grid grid-cols-1 gap-1">
            {grouped[scope].map((shortcut) => (
              <KeyboardShortcutItem
                key={shortcut.id}
                action={shortcut.action}
                description={shortcut.description}
                shortcut={formatCombos(shortcut.displayCombos)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

KeyboardShortcutsSection.propTypes = {
  modKey: PropTypes.string
}

export default KeyboardShortcutsSection
