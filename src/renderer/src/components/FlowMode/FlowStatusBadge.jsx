import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Timer, Eye, EyeOff, LogOut, Play, Pause, RotateCcw } from 'lucide-react'

const FlowStatusBadge = ({ onExit, onTogglePreview, isPreviewVisible, snippet }) => {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    let interval = null
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleReset = (e) => {
    e.stopPropagation()
    setSeconds(0)
  }

  const toggleTimer = (e) => {
    e.stopPropagation()
    setIsActive(!isActive)
  }

  return ReactDOM.createPortal(
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[1000]"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <div className="flex items-center gap-2 bg-[#0d1117] border border-white/10 rounded-none pl-5 pr-3 py-2 shadow-2xl hover:border-blue-500/40 group">
        {/* Snippet Info */}
        <div className="flex flex-col mr-4 border-r border-white/10 pr-4 max-w-[140px]">
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] leading-none mb-1 truncate opacity-80">
            {snippet?.language || 'Plain Text'}
          </span>
          <span className="text-[13px] font-bold text-white truncate leading-tight tracking-tight">
            {snippet?.title || 'Untitled'}
          </span>
        </div>

        {/* Timer Info */}
        <div className="flex items-center gap-3 mr-2 border-r border-white/10 pr-4">
          <div
            className={`p-1.5 rounded-none ${isActive ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 text-white/20'}`}
          >
            <Timer size={14} className={isActive ? 'animate-[pulse_2s_infinite]' : ''} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] leading-none mb-1">
              Focus
            </span>
            <span className="text-[14px] font-mono font-black text-white leading-none tabular-nums tracking-tight">
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Pause/Play */}
          <button
            onClick={toggleTimer}
            className="p-2 rounded-none hover:bg-white/10 text-white/50 hover:text-white"
            title={isActive ? 'Pause Session' : 'Resume Session'}
          >
            {isActive ? <Pause size={14} /> : <Play size={14} />}
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-2 rounded-none hover:bg-white/10 text-white/50 hover:text-white"
            title="Reset Timer"
          >
            <RotateCcw size={14} />
          </button>

          {/* Preview Toggle */}
          <button
            onClick={onTogglePreview}
            className={`p-2 rounded-none ${
              isPreviewVisible
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'hover:bg-white/10 text-white/50 hover:text-white'
            }`}
            title={
              isPreviewVisible ? 'Hide Floating Preview' : 'Show Floating Preview (Ghost Mode)'
            }
          >
            {isPreviewVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          {/* Exit Button */}
          <button
            onClick={onExit}
            className="ml-2 p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-none shadow-lg border border-red-500/20"
            title="Exit Flow Mode"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default FlowStatusBadge
