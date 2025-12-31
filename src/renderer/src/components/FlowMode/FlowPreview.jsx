import React, { useState, useEffect, useMemo } from 'react'
import LivePreview from '../livepreview/LivePreview'
import UniversalModal from '../universal/UniversalModal'
import {
  Smartphone,
  Tablet,
  Monitor,
  Ghost,
  Maximize2,
  Minimize2,
  Hash,
  Activity,
  Layout
} from 'lucide-react'
import AutosaveIndicator from '../layout/Header/AutosaveIndicator'

const FlowPreview = ({ selectedSnippet, snippets, fontFamily, show }) => {
  const [device, setDevice] = useState('mini') // mini, mobile, tablet, desktop
  const [liveCode, setLiveCode] = useState(selectedSnippet?.code || '')
  const [opacity, setOpacity] = useState(0.7)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLocked, setIsLocked] = useState(true) // Start locked (click-through) for non-blocking
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    setLiveCode(selectedSnippet?.code || '')
  }, [selectedSnippet?.id])

  // Sync on Real-time Edit from SnippetEditor
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.code !== undefined) {
        setLiveCode(e.detail.code)
      }
    }
    window.addEventListener('app:code-update', handler)
    return () => window.removeEventListener('app:code-update', handler)
  }, [])

  // Scientific Stats Calculation
  const stats = useMemo(() => {
    const chars = liveCode.length
    const words = liveCode.trim() ? liveCode.trim().split(/\s+/).length : 0
    return { chars, words }
  }, [liveCode])

  if (!show || !selectedSnippet) return null

  const getWidth = () => {
    if (isMinimized) return '240px'
    switch (device) {
      case 'mobile':
        return '320px'
      case 'tablet':
        return '520px'
      case 'desktop':
        return '850px'
      case 'mini':
      default:
        return '380px'
    }
  }

  const getHeight = () => {
    if (isMinimized) return '40px'
    switch (device) {
      case 'mobile':
        return '550px'
      case 'tablet':
        return '650px'
      case 'desktop':
        return '750px'
      case 'mini':
      default:
        return '480px'
    }
  }

  const header = (
    <div
      className="flex items-center justify-between w-full pr-1 h-full"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center gap-2">
        <Activity size={12} className="text-blue-500/60 animate-pulse" />
        <span className="text-[10px] font-bold text-white/20 tracking-widest uppercase">
          Scientist Station
        </span>
      </div>

      <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
        {!isMinimized && (
          <>
            {/* Ghost Icon Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsLocked(!isLocked)
              }}
              className={`p-1.5 rounded-md border transition-all ${isLocked ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`}
              title={isLocked ? 'Disable Click-Through' : 'Enable Click-Through'}
            >
              <Ghost size={12} />
            </button>

            {/* Stats Icon Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowStats(!showStats)
              }}
              className={`p-1.5 rounded-md border transition-all ${showStats ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/20'}`}
              title="Toggle Statistics"
            >
              <Hash size={12} />
            </button>

            {/* Device Size Selectors - 4 Working Buttons */}
            <div className="flex items-center gap-0.5 bg-black/40 rounded-md p-1 border border-white/5">
              {[
                { id: 'mini', icon: Layout, size: 10, label: 'Mini' },
                { id: 'mobile', icon: Smartphone, size: 12, label: 'Mobile' },
                { id: 'tablet', icon: Tablet, size: 12, label: 'Tablet' },
                { id: 'desktop', icon: Monitor, size: 14, label: 'Desktop' }
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDevice(v.id)
                  }}
                  className={`p-1.5 rounded-md transition-all ${device === v.id ? 'bg-blue-600 text-white shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                  title={v.label}
                >
                  <v.icon size={v.size} />
                </button>
              ))}
            </div>
          </>
        )}

        <AutosaveIndicator />

        {/* Global Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsMinimized(!isMinimized)
          }}
          className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all ml-1 border border-white/5"
          title={isMinimized ? 'Expand' : 'Collapse'}
        >
          {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
        </button>
      </div>
    </div>
  )

  return (
    <UniversalModal
      isOpen={show}
      onClose={() => {}}
      title={header}
      width={getWidth()}
      height={getHeight()}
      noOverlay={true}
      customKey="flow_preview_position"
      className={`flow-ghost-modal no-padding ${isLocked && !isMinimized ? 'click-through' : ''}`}
    >
      <div
        className="w-full h-full flex flex-col relative overflow-hidden transition-all duration-300"
        style={{ opacity: isMinimized ? 0.3 : opacity }}
      >
        <div
          className={`flex-1 w-full bg-[#0d1117]/60 backdrop-blur-3xl transition-all duration-500 ${isMinimized ? 'opacity-0 scale-95' : 'opacity-100'}`}
        >
          <LivePreview
            code={liveCode}
            language={selectedSnippet?.language || 'markdown'}
            snippets={snippets}
            theme="midnight-pro"
            fontFamily={fontFamily}
            showHeader={false}
            enableScrollSync={true}
          />
        </div>

        {/* Technical HUD Overlay */}
        {showStats && !isMinimized && (
          <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded border border-white/10 pointer-events-none flex items-center justify-between font-mono text-[9px] text-blue-400">
            <div className="flex gap-4">
              <span>CHARS: {stats.chars}</span>
              <span>WORDS: {stats.words}</span>
              <span>DEV: {device.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>
    </UniversalModal>
  )
}

export default FlowPreview
