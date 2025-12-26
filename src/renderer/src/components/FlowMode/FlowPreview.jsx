import React, { useState, useEffect } from 'react'
import LivePreview from '../livepreview/LivePreview'
import { Smartphone, Tablet, Monitor } from 'lucide-react'

const FlowPreview = ({ selectedSnippet, snippets, currentTheme, fontFamily, show }) => {
  const [device, setDevice] = useState('responsive') // responsive (default/ghost), mobile, tablet
  const [liveCode, setLiveCode] = useState(selectedSnippet?.code || '')

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

  if (!show || !selectedSnippet) return null

  const getDimensions = () => {
    const isMobileUI = window.innerWidth <= 768
    if (isMobileUI) {
      return { width: window.innerWidth - 32, height: window.innerHeight * 0.7 }
    }

    switch (device) {
      case 'mobile':
        return { width: 320, height: 580 }
      case 'tablet':
        return { width: 480, height: 600 }
      case 'responsive':
      default:
        return { width: 300, height: 400 }
    }
  }

  const { width, height } = getDimensions()
  const isMobileUI = window.innerWidth <= 768

  return (
    <div
      className={`fixed ${isMobileUI ? 'bottom-20 left-4 right-4' : 'top-8 right-8'} z-[999] animate-in fade-in zoom-in-95 duration-500 transition-all ease-in-out`}
      style={{
        WebkitAppRegion: 'no-drag',
        width: isMobileUI ? 'auto' : `${width}px`,
        height: `${height}px`
      }}
    >
      <div className="w-full h-full bg-[#0d1117]/60 rounded-2xl border border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/5 pointer-events-auto flex flex-col">
        {/* Header */}
        <div className="flex-none h-8 bg-black/40 flex items-center justify-between px-3 z-10 border-b border-white/5">
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-2" />
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
              Ghost Preview
            </span>
          </div>

          {/* Device Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDevice('responsive')}
              className={`p-1 rounded transition-colors ${device === 'responsive' ? 'text-blue-400 bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              title="Mini Ghost"
            >
              <Monitor size={10} />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1 rounded transition-colors ${device === 'mobile' ? 'text-blue-400 bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              title="Mobile"
            >
              <Smartphone size={10} />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1 rounded transition-colors ${device === 'tablet' ? 'text-blue-400 bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              title="Tablet"
            >
              <Tablet size={10} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full transition-opacity duration-300 contrast-[1.1] brightness-[1.1]">
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
      </div>
    </div>
  )
}

export default FlowPreview
