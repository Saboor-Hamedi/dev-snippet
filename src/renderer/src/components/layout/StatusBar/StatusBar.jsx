import React, { useState, useEffect, useMemo, memo } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useZoomLevel, useEditorZoomLevel, useSettings } from '../../../hook/useSettingsContext'
import { Check, Eye, Edit2 } from 'lucide-react'

import './StatusBar.css'
import ContextMenu from '../../common/ContextMenu'

/**
 * CursorDisplay - Specialized for high-frequency cursor position updates.
 */
const CursorDisplay = memo(({ line, col, show }) => {
  if (!show) return null
  return (
    <div
      className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer min-w-[40px] sm:min-w-[80px] justify-end"
      title="Go to Line"
    >
      <span className="font-mono tabular-nums hidden sm:inline">
        Ln {line}, Col {col}
      </span>
      <span className="font-mono tabular-nums sm:hidden">
        {line}:{col}
      </span>
    </div>
  )
})

/**
 * StatsDisplay - Specialized for debounced document statistics.
 */
const StatsDisplay = memo(({ stats, show }) => {
  if (!stats || !show) return null
  return (
    <div
      className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer flex"
      title="Word Count"
    >
      <span className="font-sans tabular-nums">
        <span className="sm:hidden">{stats.words}w</span>
        <span className="hidden sm:inline">{stats.words} words</span>
      </span>
    </div>
  )
})

const StatusBar = ({
  title,
  isFavorited = false,
  isLargeFile = false,
  snippets = [],
  stats,
  line = 1,
  col = 1,
  minimal = false
}) => {
  const [version, setVersion] = useState('...')
  const [zoom] = useZoomLevel()
  const [editorZoom] = useEditorZoomLevel()

  const [displayZoom, setDisplayZoom] = useState(zoom)
  const [displayEditorZoom, setDisplayEditorZoom] = useState(editorZoom)

  useEffect(() => {
    const t = setTimeout(() => setDisplayZoom(zoom), 50)
    return () => clearTimeout(t)
  }, [zoom])

  useEffect(() => {
    const t = setTimeout(() => setDisplayEditorZoom(editorZoom), 50)
    return () => clearTimeout(t)
  }, [editorZoom])

  useEffect(() => {
    window.api?.getVersion().then(setVersion)
  }, [])

  const { getSetting, updateSetting } = useSettings()

  const showSystemStatus = getSetting('statusBar.showSystemStatus') !== false
  const showVersion = getSetting('statusBar.showVersion') !== false
  const showFlowMode = getSetting('statusBar.showFlowMode') !== false
  const showLanguage = getSetting('statusBar.showLanguage') !== false
  const showStats = getSetting('statusBar.showStats') !== false
  const showZoom = getSetting('statusBar.showZoom') !== false
  const showCursorPosition = getSetting('statusBar.showCursorPosition') !== false
  const showIndentation = getSetting('statusBar.showIndentation') !== false
  const showEncoding = getSetting('statusBar.showEncoding') !== false

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 })
  const [zoomMenu, setZoomMenu] = useState({ visible: false, x: 0, y: 0 })

  const [, setEditorZoomInternal] = useEditorZoomLevel()

  const handleContextMenu = (e) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.currentTarget.getBoundingClientRect().top
    })
  }

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false })
      if (zoomMenu.visible) setZoomMenu({ ...zoomMenu, visible: false })
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu, zoomMenu])

  const menuItems = [
    { label: 'System Status', key: 'statusBar.showSystemStatus', checked: showSystemStatus },
    { label: 'Version', key: 'statusBar.showVersion', checked: showVersion },
    { label: 'Flow Mode', key: 'statusBar.showFlowMode', checked: showFlowMode },
    { label: 'Cursor Position', key: 'statusBar.showCursorPosition', checked: showCursorPosition },
    { label: 'Indentation', key: 'statusBar.showIndentation', checked: showIndentation },
    { label: 'Encoding', key: 'statusBar.showEncoding', checked: showEncoding },
    { label: 'Language', key: 'statusBar.showLanguage', checked: showLanguage },
    { label: 'Word Count', key: 'statusBar.showStats', checked: showStats },
    { label: 'Zoom', key: 'statusBar.showZoom', checked: showZoom }
  ]

  return (
    <>
      <div
        className="status-bar-container text-xs select-none flex items-center justify-between"
        onContextMenu={handleContextMenu}
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <div className="status-bar-left flex-shrink-0 max-w-[40%] overflow-hidden">
          {!minimal && showFlowMode && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('app:toggle-flow'))}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-all group hidden sm:flex"
              title="Enter Flow Mode (Alt+Shift+F)"
            >
              <span className="text-xs leading-none group-hover:scale-110 transition-transform">
                🌀
              </span>
              <span className="font-mono text-xtiny opacity-90 hidden md:inline">Flow Mode</span>
            </button>
          )}

          {!minimal && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('app:toggle-preview'))}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-all group ml-1"
              title="Toggle Reading Mode (Ctrl+E)"
            >
              <div className="text-[var(--color-accent-primary)]">
                <Edit2 size={12} className="group-hover:hidden" />
                <Eye size={12} className="hidden group-hover:block" />
              </div>
              <span className="font-mono text-xtiny opacity-90 hidden md:inline">Mode</span>
            </button>
          )}

          {!minimal && showSystemStatus && (
            <div className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer opacity-60 hover:opacity-100 hidden md:flex items-center gap-1">
              <span className="icon-branch text-[10px]">main*</span>
            </div>
          )}
        </div>

        <div className="status-bar-right flex items-center gap-0 overflow-hidden text-clip">
          <CursorDisplay line={line} col={col} show={showCursorPosition} />

          {!minimal && showIndentation && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer hidden lg:flex"
              title="Select Indentation"
            >
              <span className="font-sans">Spaces: 2</span>
            </div>
          )}

          {!minimal && showEncoding && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer hidden lg:flex"
              title="Select Encoding"
            >
              <span className="font-sans">UTF-8</span>
            </div>
          )}

          <StatsDisplay stats={stats} show={showStats} />

          {!minimal && showLanguage && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer flex"
              title="Select Language Mode"
            >
              <span className="font-mono text-xtiny uppercase tracking-wider">
                {title?.split('.').pop() || 'TXT'}
              </span>
            </div>
          )}

          {!minimal && showZoom && displayEditorZoom && (
            <div className="relative group/zoom">
              <div
                className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                title="Zoom Level (Click for options)"
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = e.currentTarget.getBoundingClientRect()
                  setZoomMenu({
                    visible: true,
                    x: rect.left,
                    y: rect.top
                  })
                }}
              >
                <span className="font-mono tabular-nums text-xtiny">
                  {Math.round((displayEditorZoom || 1) * 100)}%
                </span>
              </div>
            </div>
          )}

          {!minimal && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer px-1.5 hidden md:flex"
              title="Tweet Feedback"
            >
              <span className="text-[14px]">😊</span>
            </div>
          )}
        </div>
      </div>

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
            <div onClick={(e) => e.stopPropagation()}>
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                items={menuItems.map((item) => ({
                  label: item.label,
                  checked: item.checked,
                  onClick: () => updateSetting(item.key, !item.checked)
                }))}
                onClose={() => setContextMenu({ ...contextMenu, visible: false })}
              />
            </div>
          </div>,
          document.body
        )}

      {zoomMenu.visible &&
        createPortal(
          <div
            className="fixed inset-0 z-[10001]"
            onClick={() => setZoomMenu({ ...zoomMenu, visible: false })}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ContextMenu
                x={zoomMenu.x}
                y={zoomMenu.y}
                items={[
                  { label: '50%', onClick: () => setEditorZoomInternal(0.5) },
                  { label: '70%', onClick: () => setEditorZoomInternal(0.7) },
                  { label: '80%', onClick: () => setEditorZoomInternal(0.8) },
                  { label: '90%', onClick: () => setEditorZoomInternal(0.9) },
                  { label: '100% (Normal)', onClick: () => setEditorZoomInternal(1.0) },
                  { label: '110%', onClick: () => setEditorZoomInternal(1.1) },
                  { label: '120%', onClick: () => setEditorZoomInternal(1.2) },
                  { label: '150%', onClick: () => setEditorZoomInternal(1.5) },
                  { label: '200%', onClick: () => setEditorZoomInternal(2.0) }
                ]}
                onClose={() => setZoomMenu({ ...zoomMenu, visible: false })}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

StatusBar.propTypes = {
  title: PropTypes.string,
  isLargeFile: PropTypes.bool,
  snippets: PropTypes.array,
  stats: PropTypes.shape({
    chars: PropTypes.number,
    words: PropTypes.number
  }),
  line: PropTypes.number,
  col: PropTypes.number
}

export default memo(StatusBar)
