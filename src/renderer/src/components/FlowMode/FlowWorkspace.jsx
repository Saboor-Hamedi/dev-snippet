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
  const [isZenFocused, setIsZenFocused] = useState(false)
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
      <div className="flex items-center gap-6">
        {/* Timer Integration - Clean & Minimal */}
        <div className="flex items-center gap-3 pl-1">
          <div className="flex flex-col items-start justify-center h-full pt-1">
            <span
              className="text-[9px] font-black uppercase tracking-widest opacity-40 leading-none"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Session
            </span>
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
              className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
            >
              {isTimerActive ? <Pause size={10} /> : <Play size={10} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSeconds(0)
              }}
              className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
            >
              <RotateCcw size={10} />
            </button>
          </div>
        </div>

        {/* Station Identity (Clean Text Only) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-3 opacity-60">
            <div className="w-1 h-1 rounded-full bg-[var(--color-accent-primary)]" />
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
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowPreview(!showPreview)
            }}
            className={`p-1.5 rounded-md transition-all ${showPreview ? 'text-[var(--color-accent-primary)] bg-[var(--color-bg-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
            title="Toggle Scientist Preview"
          >
            <Columns size={13} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsStationMaximized(!isStationMaximized)
            }}
            className={`p-1.5 rounded-md transition-all ${isStationMaximized ? 'text-[var(--color-accent-primary)] bg-[var(--color-bg-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
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
            className={`p-1.5 rounded-md transition-all ${isZenFocused ? 'text-[var(--color-accent-primary)] bg-[var(--color-bg-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
            title={
              isZenFocused
                ? 'Exit Zen Environment (Snap Backdrop to Frame)'
                : 'Enter Zen Environment (Immersive Backdrop Blur)'
            }
          >
            {isZenFocused ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
        {showPreview && (
          <div className="hidden sm:flex items-center gap-2 border-l border-[var(--color-border)] pl-2 ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsLocked(!isLocked)
              }}
              className={`p-1.5 rounded-md transition-all ${isLocked ? 'text-[var(--color-accent-primary)] bg-[var(--color-bg-tertiary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
              title={isLocked ? 'Disable Ghost Interactivity' : 'Enable Ghost Interactivity'}
            >
              <Ghost size={13} />
            </button>

            {/* Viewport Presets - Minimalist */}
            <div className="flex items-center gap-0.5">
              {[
                { id: 'mini', icon: Layout, size: 11 },
                { id: 'mobile', icon: Smartphone, size: 12 },
                { id: 'tablet', icon: Tablet, size: 12 },
                { id: 'desktop', icon: Monitor, size: 13 }
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDevice(v.id)
                    setShowPreview(true)
                  }}
                  className={`p-1.5 rounded hover:bg-[var(--color-bg-tertiary)] transition-all ${device === v.id && showPreview ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
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
          className="ml-2 p-1.5 rounded-md bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all"
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
      width={showPreview ? 1100 : 800} // Numeric width for smoother JS interpolation
      height={800}
      noOverlay={true}
      customKey="flow_workspace_position"
      isMaximized={isStationMaximized}
      className={`flow-ghost-modal no-padding transition-all duration-300 ease-in-out ${!isZenFocused ? 'snap-frame' : ''}`}
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
