import React, { useState, useEffect } from 'react'
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

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-500"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <div className="flex items-center gap-3 bg-[#0d1117]/80 backdrop-blur-2xl border border-white/10 rounded-2xl pl-5 pr-3 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-blue-500/30 transition-all group">
        {/* Snippet Info */}
        <div className="flex flex-col mr-4 border-r border-white/5 pr-4 max-w-[120px]">
          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1 truncate">
            {snippet?.language || 'Plain Text'}
          </span>
          <span className="text-[12px] font-semibold text-white truncate leading-tight">
            {snippet?.title || 'Untitled'}
          </span>
        </div>

        {/* Timer Info */}
        <div className="flex items-center gap-3 mr-2 border-r border-white/5 pr-4">
          <div
            className={`p-1.5 rounded-full ${isActive ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-white/5 text-white/40'}`}
          >
            <Timer size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">
              Focus Time
            </span>
            <span className="text-[14px] font-mono font-bold text-white leading-none tabular-nums">
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Pause/Play */}
          <button
            onClick={toggleTimer}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={isActive ? 'Pause Session' : 'Resume Session'}
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="Reset Timer"
          >
            <RotateCcw size={16} />
          </button>

          {/* Preview Toggle */}
          <button
            onClick={onTogglePreview}
            className={`p-2 rounded-full transition-all ${
              isPreviewVisible
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'hover:bg-white/10 text-white/60 hover:text-white'
            }`}
            title={
              isPreviewVisible ? 'Hide Floating Preview' : 'Show Floating Preview (Ghost Mode)'
            }
          >
            {isPreviewVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          {/* Exit Button */}
          <button
            onClick={onExit}
            className="ml-1 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all shadow-lg"
            title="Exit Flow Mode"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default FlowStatusBadge
