import React from 'react'
import LivePreview from '../livepreview/LivePreview'

const FlowPreview = ({ selectedSnippet, snippets, currentTheme, fontFamily, show }) => {
  if (!show || !selectedSnippet) return null

  return (
    <div
      className="fixed top-8 right-8 w-[300px] h-[400px] z-[999] animate-in fade-in zoom-in-95 duration-500"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <div className="w-full h-full bg-[#0d1117]/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/5 pointer-events-auto">
        <div className="absolute top-0 left-0 right-0 h-8 bg-black/40 flex items-center px-3 z-10 border-b border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-2" />
          <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
            Ghost Live Preview
          </span>
        </div>
        <div className="w-full h-full opacity-60 contrast-[1.2] brightness-[1.1] scale-95 origin-center">
          <LivePreview
            code={selectedSnippet?.code || ''}
            language={selectedSnippet?.language || 'markdown'}
            snippets={snippets}
            theme={currentTheme}
            fontFamily={fontFamily}
            showHeader={false}
          />
        </div>
      </div>
    </div>
  )
}

export default FlowPreview
