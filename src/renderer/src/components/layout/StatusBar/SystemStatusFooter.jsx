import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { ToggleButton } from '../../ToggleButton'
import { useSettings } from '../../../hook/useSettingsContext'
import { Check } from 'lucide-react'

import './StatusBar.css'

const SystemStatusFooter = ({ snippets = [], line = 1, col = 1 }) => {
  const { getSetting, updateSetting } = useSettings()
  const hideWelcomePage = getSetting('welcome.hideWelcomePage') || false
  const [version, setVersion] = React.useState('...')

  React.useEffect(() => {
    window.api?.getVersion().then(setVersion)
  }, [])

  // Visibility Settings
  const showVersion = getSetting('statusBar.showVersion') !== false
  const showCursorPosition = getSetting('statusBar.showCursorPosition') !== false
  const showIndentation = getSetting('statusBar.showIndentation') !== false
  const showEncoding = getSetting('statusBar.showEncoding') !== false
  const showLanguage = getSetting('statusBar.showLanguage') !== false
  const showStats = getSetting('statusBar.showStats') !== false

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 })

  const handleContextMenu = (e) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY })
  }

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false })
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu])

  const menuItems = [
    { label: 'Version', key: 'statusBar.showVersion', checked: showVersion },
    { label: 'Cursor Position', key: 'statusBar.showCursorPosition', checked: showCursorPosition },
    { label: 'Indentation', key: 'statusBar.showIndentation', checked: showIndentation },
    { label: 'Encoding', key: 'statusBar.showEncoding', checked: showEncoding },
    { label: 'Snippet Count', key: 'statusBar.showStats', checked: showStats },
    {
      label: 'Welcome Toggle',
      key: 'welcome.hideWelcomePage',
      checked: !hideWelcomePage,
      inverse: true
    } // Inverse logic for hide
  ]

  return (
    <>
      <div
        className="status-bar-container text-xs select-none"
        onContextMenu={handleContextMenu}
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <div className="status-bar-left">
          {/* Version (Restored) */}
          {showVersion && (
            <div className="status-bar-item opacity-60 hover:opacity-100 transition-opacity">
              <span className="font-mono tabular-nums">v{version}</span>
            </div>
          )}
          <div className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer opacity-60 hover:opacity-100 flex items-center gap-1">
            <span className="icon-branch text-[10px]">main*</span>
          </div>
        </div>

        <div className="status-bar-right flex items-center gap-0">
          {/* Cursor Position */}
          {showCursorPosition && (
            <div className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer min-w-[80px] justify-end">
              <span className="font-mono tabular-nums">
                Ln {line}, Col {col}
              </span>
            </div>
          )}

          {/* Indentation */}
          {showIndentation && (
            <div className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer">
              <span className="font-sans">Spaces: 2</span>
            </div>
          )}

          {/* Encoding */}
          {showEncoding && (
            <div className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer">
              <span className="font-sans">UTF-8</span>
            </div>
          )}

          {/* Snippet Count */}
          {showStats && (
            <div className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer">
              <span className="font-sans">{snippets.length} Snippets</span>
            </div>
          )}

          {/* Welcome Toggle */}
          <div
            className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            onClick={() => updateSetting('welcome.hideWelcomePage', !hideWelcomePage)}
            title="Toggle Welcome Page"
          >
            <div
              className={`w-2 h-2 rounded-full ${!hideWelcomePage ? 'bg-current opacity-100' : 'border border-current opacity-40'}`}
            ></div>
          </div>
        </div>
      </div>

      {/* Context Menu using Portal */}
      {contextMenu.visible &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999]"
            onClick={() => setContextMenu({ ...contextMenu, visible: false })}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu({ ...contextMenu, visible: false })
            }}
          >
            <div
              className="status-bar-context-menu"
              style={{
                left: Math.min(contextMenu.x, window.innerWidth - 200),
                bottom: window.innerHeight - contextMenu.y + 10
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  className="context-menu-item"
                  onClick={() =>
                    updateSetting(item.key, item.inverse ? hideWelcomePage : !item.checked)
                  }
                >
                  <div className="context-menu-check">
                    {(item.inverse ? !hideWelcomePage : item.checked) && (
                      <Check size={14} strokeWidth={3} />
                    )}
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

SystemStatusFooter.propTypes = {
  snippets: PropTypes.array,
  line: PropTypes.number,
  col: PropTypes.number
}

export default SystemStatusFooter
