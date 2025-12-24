import React from 'react'
import PropTypes from 'prop-types'
import { SettingSection, KeyboardShortcutItem } from '../components'

/**
 * Keyboard Shortcuts Section
 * Displays all available keyboard shortcuts
 */
const KeyboardShortcuts = ({ modKey = 'Ctrl' }) => {
  const shortcuts = [
    {
      action: 'Create new snippet',
      description: 'Open a new draft',
      shortcut: `${modKey} + N`
    },
    {
      action: 'Save (force)',
      description: 'Trigger editor save',
      shortcut: `${modKey} + S`
    },
    {
      action: 'Command Palette',
      description: 'Open quick search / commands',
      shortcut: `${modKey} + P`
    },
    {
      action: 'Go to Welcome',
      description: 'Show the welcome page',
      shortcut: `${modKey} + Shift + W`
    },
    {
      action: 'Copy to clipboard',
      description: 'Copy selected snippet code',
      shortcut: `${modKey} + C`
    },
    {
      action: 'Rename snippet',
      description: 'Open rename dialog',
      shortcut: `${modKey} + R`
    },
    {
      action: 'Delete snippet',
      description: 'Open delete confirmation',
      shortcut: `${modKey} + Shift + D`
    },
    {
      action: 'Toggle compact',
      description: 'Toggle compact header / status bar',
      shortcut: `${modKey} + ,`
    }
  ]

  return (
    <SettingSection>
      <div className="p-4">
        <p className="text-xtiny mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
          Common keyboard shortcuts used across the app.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {shortcuts.map((shortcut, index) => (
            <KeyboardShortcutItem
              key={index}
              action={shortcut.action}
              description={shortcut.description}
              shortcut={shortcut.shortcut}
            />
          ))}
        </div>
      </div>
    </SettingSection>
  )
}

KeyboardShortcuts.propTypes = {
  modKey: PropTypes.string
}

export default KeyboardShortcuts
