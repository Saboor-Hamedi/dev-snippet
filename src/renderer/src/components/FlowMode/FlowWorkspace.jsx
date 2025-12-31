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
  Minimize
} from 'lucide-react'
import AutosaveIndicator from '../layout/Header/AutosaveIndicator'

const FlowWorkspace = ({ selectedSnippet, snippets, fontFamily, renderEditor, onExit }) => {
  const { currentTheme } = useTheme()
  const [device, setDevice] = useState('mini')
  const [liveCode, setLiveCode] = useState(selectedSnippet?.code || '')
  const [opacity, setOpacity] = useState(0.8)
  const [isLocked, setIsLocked] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [isZenFocused, setIsZenFocused] = useState(true)
  const [isStationMaximized, setIsStationMaximized] = useState(false)

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
      } else {
        convas.classList.remove('is-snapped')
      }
    }

    // Cleanup on unmount: Ensure convas returns to normal if we exit
    return () => {
      const c = document.querySelector('.flow-convas')
      if (c) c.classList.remove('is-snapped')
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
    window.addEventListener('app:code-update', handler)
    window.addEventListener('app:maximize-station', maxHandler)
    window.addEventListener('keydown', escHandler)
    return () => {
      window.removeEventListener('app:code-update', handler)
      window.removeEventListener('app:maximize-station', maxHandler)
      window.removeEventListener('keydown', escHandler)
    }
  }, [isStationMaximized])

  const fileName = useMemo(() => {
    if (!selectedSnippet?.title) return 'UNTITLED_STATION'
    const parts = selectedSnippet.title.split('.')
    const name = parts.length > 1 ? parts.slice(0, -1).join('.') : selectedSnippet.title
    return name.toUpperCase()
  }, [selectedSnippet?.title])

  const stats = useMemo(() => {
    const chars = liveCode.length
    const words = liveCode.trim() ? liveCode.trim().split(/\s+/).length : 0
    return { chars, words }
  }, [liveCode])

  const header = (
    <div
      className="flex items-center justify-between w-full h-full pr-1 font-mono"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center gap-4">
        {/* Timer Integration */}
        <div className="flex items-center gap-3 bg-black/30 px-3 py-1 rounded-lg border border-white/5">
          <div className="flex flex-col items-center">
            <span className="text-[7px] font-black text-[var(--color-accent-primary)] uppercase tracking-tighter">
              Focus Session
            </span>
            <span className="text-[12px] font-bold text-white tabular-nums">
              {formatTime(seconds)}
            </span>
          </div>
          <div className="flex gap-1 border-l border-white/10 pl-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsTimerActive(!isTimerActive)
              }}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              {isTimerActive ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSeconds(0)
              }}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              <RotateCcw size={11} />
            </button>
          </div>
        </div>

        {/* Station Identity (Robust File Name Display) */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-primary)] animate-pulse shadow-[0_0_8px_rgba(var(--color-accent-primary-rgb),0.8)]" />
          <span className="text-[11px] font-black text-white/80 tracking-[0.15em] uppercase">
            {fileName}
          </span>
        </div>

        {/* Workspace Controls */}
        <div className="flex items-center gap-1 bg-black/40 rounded-md p-1 border border-white/5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowPreview(!showPreview)
            }}
            className={`p-1.5 rounded-md transition-all ${showPreview ? 'text-white shadow-[0_0_10px_rgba(var(--color-accent-primary-rgb),0.5)]' : 'text-white/20 hover:text-white'}`}
            style={{
              backgroundColor: showPreview ? 'var(--color-accent-primary, #3b82f6)' : 'transparent'
            }}
            title="Toggle Scientist Preview"
          >
            <Columns size={13} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsStationMaximized(!isStationMaximized)
            }}
            className={`p-1.5 rounded-md transition-all ${isStationMaximized ? 'text-white shadow-[0_0_10px_rgba(var(--color-accent-primary-rgb),0.5)]' : 'text-white/20 hover:text-white'}`}
            style={{
              backgroundColor: isStationMaximized
                ? 'var(--color-accent-primary, #3b82f6)'
                : 'transparent'
            }}
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
            className={`p-1.5 rounded-md transition-all ${isZenFocused ? 'text-white shadow-[0_0_10px_rgba(var(--color-accent-primary-rgb),0.5)]' : 'text-white/20 hover:text-white'}`}
            style={{
              backgroundColor: isZenFocused ? 'var(--color-accent-primary, #3b82f6)' : 'transparent'
            }}
            title={
              isZenFocused
                ? 'Exit Zen Environment (Snap Backdrop to Frame)'
                : 'Enter Zen Environment (Immersive Backdrop Blur)'
            }
          >
            {isZenFocused ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          <AutosaveIndicator />
        </div>
      </div>

      <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
        {showPreview && (
          <div className="hidden sm:flex items-center gap-2 border-r border-white/10 pr-2 mr-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsLocked(!isLocked)
              }}
              className={`p-1.5 rounded-md border transition-all ${isLocked ? 'shadow-[inset_0_0_10px_rgba(var(--color-accent-primary-rgb),0.2)] text-[var(--color-accent-primary)]' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`}
              style={{
                borderColor: isLocked
                  ? 'var(--color-accent-primary, #3b82f6)'
                  : 'rgba(255,255,255,0.1)',
                backgroundColor: isLocked
                  ? 'rgba(var(--color-accent-primary-rgb, 59, 130, 246), 0.1)'
                  : 'transparent'
              }}
              title={isLocked ? 'Disable Ghost Interactivity' : 'Enable Ghost Interactivity'}
            >
              <Ghost size={12} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowStats(!showStats)
              }}
              className={`p-1.5 rounded-md border transition-all ${showStats ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/20'}`}
              title="Toggle Statistics Telemetry"
            >
              <Hash size={12} />
            </button>

            {/* Viewport Presets */}
            <div className="flex items-center gap-0.5 bg-black/40 rounded-md p-0.5 border border-white/5">
              {[
                { id: 'mini', icon: Layout, size: 10 },
                { id: 'mobile', icon: Smartphone, size: 11 },
                { id: 'tablet', icon: Tablet, size: 11 },
                { id: 'desktop', icon: Monitor, size: 13 }
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDevice(v.id)
                    setShowPreview(true)
                  }}
                  className={`p-1.5 rounded transition-all ${device === v.id && showPreview ? 'text-white shadow-[0_0_10px_rgba(var(--color-accent-primary-rgb),0.5)]' : 'text-white/20 hover:text-white'}`}
                  style={{
                    backgroundColor:
                      device === v.id && showPreview ? 'var(--color-accent-primary)' : 'transparent'
                  }}
                >
                  <v.icon size={v.size} />
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            onExit()
          }}
          className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/20"
          title="Terminate Station"
        >
          <LogOut size={13} />
        </button>
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
      width={showPreview ? 'min(1200px, 95vw)' : 'min(800px, 95vw)'}
      height="min(800px, 90vh)"
      noOverlay={true}
      customKey="flow_workspace_position"
      isMaximized={isStationMaximized}
      className={`flow-ghost-modal no-padding ${!isZenFocused ? 'snap-frame' : ''}`}
    >
      {isStationMaximized && (
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 z-[100000] opacity-0 hover:opacity-100 transition-all duration-300 pointer-events-none group"
          style={{ height: '40px', width: '200px', display: 'flex', justifyContent: 'center' }}
        >
          <button
            onClick={() => setIsStationMaximized(false)}
            className="pointer-events-auto bg-red-500/80 hover:bg-red-500 text-white px-4 py-1.5 rounded-b-xl border border-t-0 border-white/20 shadow-xl flex items-center gap-2 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500"
          >
            <Minimize size={14} />
            <span className="text-[10px] font-black tracking-widest uppercase">
              Restore Station
            </span>
          </button>
        </div>
      )}
      <div
        className={`flex h-full w-full relative overflow-hidden transition-all duration-500 ${isStationMaximized ? 'rounded-none' : 'rounded-xl'} ${isZenFocused ? 'bg-[var(--color-bg-primary)] shadow-none' : 'bg-[var(--color-bg-primary)] shadow-[0_4px_40px_rgba(0,0,0,0.6)]'}`}
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          opacity: 1
        }}
      >
        {/* Editor Column */}
        <div className="flex-1 min-w-[320px] flex flex-col border-r border-white/5 bg-[var(--editor-bg)]">
          {renderEditor()}
        </div>

        {/* Ghost Preview Column */}
        {showPreview && (
          <div
            className={`flex-none transition-all duration-350 relative ${isLocked ? 'click-through' : ''}`}
            style={{
              width: getPreviewWidth(),
              opacity: opacity,
              backgroundColor: 'rgba(10, 12, 16, 0.4)',
              backdropFilter: 'blur(30px) saturate(150%)'
            }}
          >
            <div className="w-full h-full">
              <LivePreview
                code={liveCode}
                language={selectedSnippet?.language || 'markdown'}
                snippets={snippets}
                theme={currentTheme}
                fontFamily={fontFamily}
                showHeader={false}
                enableScrollSync={true}
              />
            </div>

            {/* Stats Overlay */}
            {showStats && (
              <div className="absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded border border-white/10 pointer-events-none font-mono text-[9px] text-blue-400">
                <div className="flex flex-col gap-1">
                  <span>CHARS: {stats.chars}</span>
                  <span>WORDS: {stats.words}</span>
                </div>
              </div>
            )}

            {/* Contextual HUD Controls */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
              <div className="p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
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
                  className="w-16 h-1 accent-blue-500 cursor-nw-resize"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </UniversalModal>
  )
}

export default FlowWorkspace
