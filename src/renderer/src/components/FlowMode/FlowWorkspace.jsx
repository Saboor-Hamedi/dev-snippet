import React, { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../../hook/useTheme'
import LivePreview from '../livepreview/LivePreview'
import UniversalModal from '../universal/UniversalModal'
import {
  Smartphone,
  Tablet,
  Monitor,
  Ghost,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  Hash,
  Activity,
  Layout,
  Columns,
  Maximize2,
  Minimize2,
  Maximize,
  Minimize,
  Star,
  Pin,
  GripVertical,
  X
} from 'lucide-react'
import AutosaveIndicator from '../layout/Header/AutosaveIndicator'

const FlowWorkspace = ({ selectedSnippet, snippets, fontFamily, renderEditor, onExit }) => {
  const { currentTheme } = useTheme()
  const [device, setDevice] = useState('mini')
  const [liveCode, setLiveCode] = useState(selectedSnippet?.code || '')
  const [opacity, setOpacity] = useState(0.8)
  const [isLocked, setIsLocked] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isZenFocused, setIsZenFocused] = useState(false)
  const [isStationMaximized, setIsStationMaximized] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // Create a derived version of the snippet to ensure we have the latest state (e.g. is_favorite toggle)
  const latestSnippet = useMemo(() => {
    return snippets?.find((s) => s.id === selectedSnippet?.id) || selectedSnippet
  }, [snippets, selectedSnippet])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Timer State
  const [seconds, setSeconds] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(true)

  useEffect(() => {
    let interval = null
    if (isTimerActive) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerActive])

  const formatTime = (s) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    // Sync background state with global convas
    const convas = document.querySelector('.flow-convas')
    if (convas) {
      if (!isZenFocused) {
        convas.classList.add('is-snapped')
        document.body.classList.remove('zen-focus-active')
      } else {
        convas.classList.remove('is-snapped')
        document.body.classList.add('zen-focus-active')
      }
    }

    // Cleanup on unmount: Ensure convas returns to normal if we exit
    return () => {
      const c = document.querySelector('.flow-convas')
      if (c) c.classList.remove('is-snapped')
      document.body.classList.remove('zen-focus-active')
    }
  }, [isZenFocused])

  useEffect(() => {
    setLiveCode(selectedSnippet?.code || '')
  }, [selectedSnippet?.id])

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.code !== undefined) {
        setLiveCode(e.detail.code)
      }
    }
    const maxHandler = () => setIsStationMaximized((m) => !m)
    const escHandler = (e) => {
      if (e.key === 'Escape' && isStationMaximized) {
        setIsStationMaximized(false)
      }
    }
    const flowPreviewHandler = () => setShowPreview((prev) => !prev)

    window.addEventListener('app:code-update', handler)
    window.addEventListener('app:maximize-station', maxHandler)
    window.addEventListener('keydown', escHandler)
    window.addEventListener('app:flow-toggle-preview', flowPreviewHandler)
    return () => {
      window.removeEventListener('app:code-update', handler)
      window.removeEventListener('app:maximize-station', maxHandler)
      window.removeEventListener('keydown', escHandler)
      window.removeEventListener('app:flow-toggle-preview', flowPreviewHandler)
    }
  }, [isStationMaximized])

  const fileName = useMemo(() => {
    if (!latestSnippet?.title) return 'UNTITLED_STATION'
    const parts = latestSnippet.title.split('.')
    const name = parts.length > 1 ? parts.slice(0, -1).join('.') : latestSnippet.title
    return name.toUpperCase()
  }, [latestSnippet?.title])

  const stats = useMemo(() => {
    const chars = liveCode.length
    const words = liveCode.trim() ? liveCode.trim().split(/\s+/).length : 0
    return { chars, words }
  }, [liveCode])
 
  const header = (
    <div
      className="flex items-center justify-between w-full pr-0 font-mono"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center gap-2">
        <GripVertical size={14} className="opacity-20 -ml-1.5" />
        {/* Timer Integration - Clean & Minimal */}
        <div className="flex items-center gap-2 pl-0">
          <div className="flex flex-col items-start justify-center h-full pt-1">
            <div className="flex items-center gap-1.5 h-3">
              <span
                className="text-[9px] font-black uppercase tracking-widest opacity-40"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Session
              </span>
              {isTimerActive && <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <span
              className="text-[14px] font-bold tabular-nums leading-none"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {formatTime(seconds)}
            </span>
          </div>
          <div className="flex gap-0.5 items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsTimerActive(!isTimerActive)
              }}
              className="p-1 rounded-none hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
            >
              {isTimerActive ? <Pause size={10} /> : <Play size={10} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSeconds(0)
              }}
              className="p-1 rounded-none hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
            >
              <RotateCcw size={10} />
            </button>
          </div>
        </div>

        {/* Station Identity (Clean Text Only) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 opacity-60">
            <Activity size={10} className="text-[var(--color-accent-primary)]" />
            {latestSnippet?.is_favorite ? (
              <Star size={10} className="text-yellow-500 fill-yellow-500" />
            ) : null}
            {latestSnippet?.is_pinned ? (
              <Pin size={10} className="text-blue-400 fill-blue-400/20" />
            ) : null}
            <span
              className="text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {fileName}
            </span>
          </div>
          {/* Autosave Indicator - Moved beside tab */}
          <div className="pl-2 border-l border-white/5">
            <AutosaveIndicator />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5" style={{ pointerEvents: 'auto' }}>
        {/* Simplified Control Group */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-none">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowPreview(!showPreview)
            }}
            className={`p-1.5 rounded-none ${showPreview ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
            title="Toggle Scientist Preview"
          >
            <Columns size={13} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsStationMaximized(!isStationMaximized)
            }}
            className={`p-1.5 rounded-none ${isStationMaximized ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
            title={
              isStationMaximized
                ? 'Restore Station Layout (Windowed)'
                : 'Maximize Station Layout (Full Screen)'
            }
          >
            {isStationMaximized ? <Minimize size={13} /> : <Maximize size={13} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsZenFocused(!isZenFocused)
            }}
            className={`p-1.5 rounded-none ${isZenFocused ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
            title={
              isZenFocused
                ? 'Exit Zen Environment (Snap Backdrop to Frame)'
                : 'Enter Zen Environment (Immersive Focus Mode)'
            }
          >
            {isZenFocused ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              localStorage.removeItem('pos_flow_workspace_position')
              window.location.reload()
            }}
            className="p-1.5 rounded-none text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
            title="Reset Station Layout"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    </div>
  )

  const getPreviewWidth = () => {
    switch (device) {
      case 'mobile':
        return '280px'
      case 'tablet':
        return '420px'
      case 'desktop':
        return '580px'
      default:
        return '320px'
    }
  }

  return (
    <UniversalModal
      isOpen={true}
      onClose={onExit}
      title={header}
      width={showPreview ? 800 : 600} // Numeric width for smoother JS interpolation
      height={700}
      noOverlay={true}
      customKey="flow_workspace_position"
      isMaximized={isStationMaximized || isZenFocused}
      allowMaximize={false}
      className={`flow-ghost-modal no-padding ${!isZenFocused ? 'snap-frame' : ''}`}
      hideHeaderBorder={true}
      hideCloseButton={true}
      noTab={true}
    >
      {isStationMaximized && (
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 z-[100000] opacity-0 hover:opacity-100 transition-all duration-300 pointer-events-none group"
          style={{ height: '40px', width: '200px', display: 'flex', justifyContent: 'center' }}
        >
          <button
            onClick={() => setIsStationMaximized(false)}
            className="pointer-events-auto bg-red-500/80 hover:bg-red-500 text-white px-4 py-1.5 rounded-none border border-t-0 border-white/20 shadow-xl flex items-center gap-2 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500"
          >
            <Minimize size={14} />
            <span className="text-[10px] font-black tracking-widest uppercase">
              Restore Station
            </span>
          </button>
        </div>
      )}
      <div
        className={`flex flex-1 w-full relative overflow-hidden min-h-0 transition-all duration-500 rounded-none ${isZenFocused ? 'bg-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-primary)]'} ${isMobile ? 'flex-col' : 'flex-row'}`}
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          opacity: 1
        }}
      >
        {/* Editor Column */}
        <div
          className="flex-1 min-w-[320px] flex flex-col"
          style={{
            backgroundColor: 'var(--editor-bg)',
            backdropFilter: 'none'
          }}
        >
          {renderEditor()}
        </div>

        {/* Ghost Preview Column */}
        {showPreview && (
          <div
            className={`flex-none transition-all duration-350 relative ${isLocked ? 'click-through' : ''}`}
            style={{
              width: isMobile ? '100%' : getPreviewWidth(),
              height: isMobile ? '40%' : '100%',
              opacity: opacity,
              backgroundColor: 'var(--color-bg-primary)',
              backdropFilter: 'none'
            }}
          >
          <div className="flex flex-col h-full w-full">
            {/* Ghost Preview Toolbar - Robust & Full Width */}
            <div
              className={`flex-none flex items-center justify-between px-3 h-10 bg-[var(--color-bg-secondary)] border-b border-white/5 z-20 transition-all duration-300 ${isZenFocused ? 'opacity-90 backdrop-blur-md' : ''}`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsLocked(!isLocked)
                  }}
                  className={`p-1.5 rounded-none transition-all ${isLocked ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
                  title={isLocked ? 'Disable Ghost Interactivity' : 'Enable Ghost Interactivity'}
                >
                  <Ghost size={13} />
                </button>
                <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] pl-1 hidden sm:inline">
                  Ghost Preview
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Opacity Slider */}
                <div className="flex items-center gap-2 group/opacity">
                  <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">
                    Opacity
                  </span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={opacity}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation()
                      setOpacity(parseFloat(e.target.value))
                    }}
                    className="w-16 sm:w-20 cursor-pointer accentuate-slider"
                  />
                </div>

                <div className="w-[1px] h-3 bg-white/10" />

                {/* Viewport Presets */}
                <div className="flex items-center gap-0.5">
                  {[
                    { id: 'mini', icon: Layout, size: 11, label: 'Standard' },
                    { id: 'mobile', icon: Smartphone, size: 12, label: 'Phone' },
                    { id: 'tablet', icon: Tablet, size: 12, label: 'Tablet' },
                    { id: 'desktop', icon: Monitor, size: 13, label: 'Desktop' }
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDevice(v.id)
                      }}
                      className={`p-1.5 rounded-none transition-all ${device === v.id ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
                      title={v.label}
                    >
                      <v.icon size={v.size} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 w-full relative overflow-hidden">
              <LivePreview
                code={liveCode}
                language={selectedSnippet?.language || 'markdown'}
                snippets={snippets}
                theme={currentTheme}
                fontFamily={fontFamily}
                showHeader={false}
                enableScrollSync={true}
                zenFocus={isZenFocused}
              />
            </div>
          </div>

            {/* Stats Overlay */}
            {showStats && (
              <div className="absolute bottom-4 left-4 p-2 bg-black/60 rounded-none border border-white/10 pointer-events-none font-mono text-[9px] text-blue-400">
                <div className="flex flex-col gap-1">
                  <span>CHARS: {stats.chars}</span>
                  <span>WORDS: {stats.words}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </UniversalModal>
  )
}

export default FlowWorkspace
