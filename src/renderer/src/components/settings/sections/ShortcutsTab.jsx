import React from 'react'
import { Keyboard } from 'lucide-react'
import { SettingSection } from '../components'
import KeyboardShortcutsSection from '../../../features/keyboard/KeyboardShortcutsSection'

/**
 * ShortcutsTab Component
 *
 * Displays the keyboard shortcut reference guide.
 * Organizes commands by Navigation, Editing, Workspace, etc.
 */
const ShortcutsTab = () => {
  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <SettingSection
      //   title="Keyboard Shortcuts"
      // icon={Keyboard}
      >
        <KeyboardShortcutsSection />
      </SettingSection>

      <div className="mt-8 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
        <p className="text-[10px] text-[var(--color-text-tertiary)] italic leading-relaxed">
          Tip: Most shortcuts use the "Mod" key, which is <strong>Ctrl</strong> on Windows/Linux and{' '}
          <strong>Cmd (⌘)</strong> on macOS.
        </p>
      </div>
    </div>
  )
}

export default ShortcutsTab
