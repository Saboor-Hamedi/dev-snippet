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
  Layout,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import AutosaveIndicator from '../layout/Header/AutosaveIndicator'

const FlowPreview = ({ selectedSnippet, snippets, fontFamily, show }) => {
  const [device, setDevice] = useState('mini') // mini, mobile, tablet, desktop
  const [liveCode, setLiveCode] = useState(selectedSnippet?.code || '')
  const [opacity, setOpacity] = useState(0.7)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLocked, setIsLocked] = useState(true) // Start locked (click-through) for non-blocking
  const [showStats, setShowStats] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [customWidth, setCustomWidth] = useState(null)
  
  // External Scroll Container Ref for Custom Sync
  const containerRef = React.useRef(null)

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

  // --- External Custom Scroll Sync (Direct & Stable) ---
  useEffect(() => {
    const handleSync = (e) => {
      const percentage = e.detail?.percentage
      const container = containerRef.current
      if (typeof percentage !== 'number' || !container) return

      const maxScroll = container.scrollHeight - container.clientHeight
      // Math.round is crucial - it stops the "sub-pixel" vibrating/shaking
      container.scrollTop = Math.round(maxScroll * percentage)
    }

    window.addEventListener('app:editor-scroll', handleSync)
    return () => window.removeEventListener('app:editor-scroll', handleSync)
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
    if (customWidth) return `${customWidth}px`
    switch (device) {
      case 'mobile':
        return '320px'
      case 'tablet':
        return '520px'
      case 'desktop':
        return '850px'
      case 'desktop':
        return '850px'
      case 'mini':
      default:
        return '1000px'
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
        return '800px'
    }
  }

  const header = (
    <div
      className="flex items-center justify-between w-full pr-1"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-blue-500/60" />
          <span className="text-[9px] font-bold text-white/20 tracking-widest uppercase hidden sm:block">
            Scientist Station
          </span>
        </div>
        <AutosaveIndicator />
      </div>

      <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
        {!isMinimized && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowControls(!showControls)
            }}
            className={`p-1.5 rounded-none border ${showControls ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            title="Toggle Controls"
          >
            <Settings size={12} />
          </button>
        )}
        {/* Global Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsMinimized(!isMinimized)
          }}
          className="p-2 rounded-none bg-white/5 hover:bg-white/10 text-white/60 hover:text-white ml-1 border border-white/5"
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
      hideCloseButton={true}
    >
      <div
        className="w-full h-full flex flex-col relative overflow-hidden"
        style={{ opacity: isMinimized ? 0.3 : opacity }}
      >
        <div
          className={`flex-1 w-full bg-[#0d1117]/60 backdrop-blur-3xl relative ${isMinimized ? 'opacity-0 scale-95' : 'opacity-100'}`}
        >
          {showControls && (
             <div className="absolute top-0 left-0 right-0 z-50 bg-[#0d1117]/90 border-b border-white/10 p-2 flex flex-wrap items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                {/* Ghost Icon Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsLocked(!isLocked)
                  }}
                  className={`p-2 rounded border ${isLocked ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`}
                  title={isLocked ? 'Disable Click-Through' : 'Enable Click-Through'}
                >
                  <Ghost size={14} />
                </button>

                {/* Stats Icon Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowStats(!showStats)
                  }}
                  className={`p-2 rounded border ${showStats ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/20'}`}
                  title="Toggle Statistics"
                >
                  <Hash size={14} />
                </button>

                <div className="h-4 w-px bg-white/10 mx-1"></div>

                {/* Device Size Selectors */}
                <div className="flex items-center gap-1">
                  {[
                    { id: 'mini', icon: Layout, size: 14, label: 'Default' },
                    { id: 'mobile', icon: Smartphone, size: 14, label: 'Mobile' },
                    { id: 'tablet', icon: Tablet, size: 14, label: 'Tablet' },
                    { id: 'desktop', icon: Monitor, size: 14, label: 'Desktop' }
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDevice(v.id)
                        setCustomWidth(null)
                      }}
                       className={`p-2 rounded ${device === v.id && !customWidth ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                      title={v.label}
                    >
                      <v.icon size={v.size} />
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-white/10 mx-1"></div>

                {/* Siders */}
                <div className="flex items-center gap-4">
                   <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold text-white/30 uppercase">Width</span>
                      <input
                        type="range"
                        min="250"
                        max="1200"
                        step="10"
                        value={customWidth || (device === 'mini' ? 1000 : device === 'mobile' ? 320 : device === 'tablet' ? 520 : 850)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation()
                          setCustomWidth(parseInt(e.target.value))
                        }}
                        className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                   </div>
                   <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold text-white/30 uppercase">Opacity</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={opacity}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation()
                          setOpacity(parseFloat(e.target.value))
                        }}
                        className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                   </div>
                </div>
             </div>
          )}
          <LivePreview
            code={liveCode}
            language={selectedSnippet?.language || 'markdown'}
            snippets={snippets}
            theme="midnight-pro"
            fontFamily={fontFamily}
            showHeader={false}
            enableScrollSync={false} /* Disabled Internal Sync to use External Optimized Sync */
            onContentReady={(el) => (containerRef.current = el)}
            fontSize={device === 'mini' || device === 'mobile' ? 16 : null}
          />
        </div>

        {/* Technical HUD Overlay */}
        {showStats && !isMinimized && (
          <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-none border border-white/10 pointer-events-none flex items-center justify-between font-mono text-[9px] text-blue-400">
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
