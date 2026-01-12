import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import AIPilot from './AIPilot'
import { Sparkles, Smartphone, Tablet, Monitor, X } from 'lucide-react'
import { useSettings } from '../../hook/useSettingsContext'

/**
 * AIPilotModal
 *
 * A specialized, standalone floating modal for the AI Pilot.
 * Completely decoupled from UniversalModal to ensure maximum layout stability.
 */
const AIPilotModal = ({ isOpen, onClose, selectedSnippet }) => {
  const { settings, updateSetting } = useSettings()
  const [scale, setScale] = useState(settings.ai?.pilotScale || 75)
  const modalRef = useRef(null)
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Sync with settings
  useEffect(() => {
    if (settings.ai?.pilotScale) {
      setScale(settings.ai.pilotScale)
    }
  }, [settings.ai?.pilotScale])

  if (!isOpen) return null

  // Calculate Dimensions based on scale
  const getStyle = () => {
    const common = {
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5), 0 30px 60px -30px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        zIndex: 9999, // Always on top
        color: 'var(--color-text-primary)'
    }

    if (scale === 100) {
        return {
            ...common,
            width: '100vw',
            height: '100vh',
            top: 0,
            left: 0,
            borderRadius: 0,
            transform: 'none'
        }
    }

    if (scale === 50) {
        return {
            ...common,
            width: '450px',
            height: '80vh',
            top: '50%',
            left: '50%',
            borderRadius: '12px',
            transform: 'translate(-50%, -50%)'
        }
    }

    // Default 75%
    return {
        ...common,
        width: '80vw',
        height: '80vh',
        top: '50%',
        left: '50%',
        borderRadius: '12px',
        transform: 'translate(-50%, -50%)'
    }
  }

  // Simple Drag Logic
  const handleMouseDown = (e) => {
    if (scale === 100) return // No drag in full screen
    if (e.target.closest('button') || e.target.closest('.no-drag')) return

    isDragging.current = true
    const rect = modalRef.current.getBoundingClientRect()
    dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    }
    
    // Crucial: Disable transition during drag for instant response
    modalRef.current.style.transition = 'none'
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current || !modalRef.current) return
    e.preventDefault()

    const x = e.clientX - dragOffset.current.x
    const y = e.clientY - dragOffset.current.y

    modalRef.current.style.left = `${x}px`
    modalRef.current.style.top = `${y}px`
    modalRef.current.style.transform = 'none' // Remove center transform once dragged
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (modalRef.current) {
        modalRef.current.style.transition = 'width 0.3s, height 0.3s' // Re-enable transitions for resizing
    }
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  // Render via Portal to Body to escape all parent stacking contexts
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9000] pointer-events-none">
      {/* Overlay (only active for full screen or if we want modal blocking) */}
      {/* We keep overlay transparent and non-blocking for 'floating' feel except in full screen maybe? 
          Actually, standard modal usually has overlay. Let's add a subtle one that closes on click?
          User didn't specify, but for safety let's make it non-blocking so they can see snippet behind it?
          Wait, if it's a "Pilot", maybe they want to type in editor while this is open.
          Let's make overlay pointer-events-none unless we decide otherwise. 
          Actually current implementation had UniversalModal which usually blocks. 
          Let's assume NO blocking overlay for true 'Pilot' feel, just the window.
      */}
      
      <div 
        ref={modalRef}
        style={{ ...getStyle(), pointerEvents: 'auto', transition: 'width 0.3s, height 0.3s, border-radius 0.3s' }}
        className="ai-pilot-standalone-window font-sans"
      >
        {/* HEADER */}
        <div 
            className="flex items-center justify-between h-9 px-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] select-none cursor-grab active:cursor-grabbing flex-shrink-0"
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest opacity-80 uppercase">
                <Sparkles size={12} className="text-[var(--color-accent-primary)]" />
                <span>AI Pilot</span>
            </div>

            <div className="flex items-center gap-2 no-drag">
                <div className="flex items-center bg-[var(--color-bg-primary)] rounded border border-[var(--color-border)] overflow-hidden h-6">
                    <button 
                        onClick={() => updateSetting('ai.pilotScale', 50)}
                        className={`px-2 h-full flex items-center justify-center hover:bg-white/5 transition-colors ${scale === 50 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)]'}`}
                        title="Mobile"
                    >
                        <Smartphone size={10} />
                    </button>
                    <div className="w-[1px] h-full bg-[var(--color-border)]" />
                    <button 
                        onClick={() => updateSetting('ai.pilotScale', 75)}
                        className={`px-2 h-full flex items-center justify-center hover:bg-white/5 transition-colors ${scale === 75 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)]'}`}
                        title="Tablet"
                    >
                        <Tablet size={10} />
                    </button>
                    <div className="w-[1px] h-full bg-[var(--color-border)]" />
                    <button 
                         onClick={() => updateSetting('ai.pilotScale', 100)}
                         className={`px-2 h-full flex items-center justify-center hover:bg-white/5 transition-colors ${scale === 100 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)]'}`}
                         title="Desktop"
                    >
                        <Monitor size={10} />
                    </button>
                </div>
                
                <button 
                    onClick={onClose}
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-500 text-[var(--color-text-tertiary)] transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-h-0 relative isolate flex flex-col overflow-hidden bg-[var(--color-primary-bg)]">
            <AIPilot scale={scale} selectedSnippet={selectedSnippet} />
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AIPilotModal
