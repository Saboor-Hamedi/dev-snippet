import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import AIPilot from './AIPilot'
import { Sparkles, Smartphone, Tablet, Monitor } from 'lucide-react' // X is handled by WindowControls
import { useSettings } from '../../hook/useSettingsContext'
import WindowControls from '../universal/WindowControls'

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

  // Handle Escape Key to Close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Calculate Dimensions based on scale
  const getStyle = () => {
    const common = {
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        boxShadow: 'none', /* No shadow as requested */
        overflow: 'hidden',
        zIndex: 9999, // Always on top
        color: 'var(--color-text-primary)'
    }

    if (scale === 100) {
        return {
            ...common,
            width: '95vw',
            height: '95vh',
            top: '50%',
            left: '50%',
            borderRadius: 0,
            transform: 'translate(-50%, -50%)'
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
        transform: 'translate(-50%, -50%)',
        borderRadius: 0
    }
  }

  // Simple Drag Logic
  const handleMouseDown = (e) => {
    // Removed scale === 100 restrict
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
        // Re-enable transitions for resizing, but carefully to avoid jumpiness
        modalRef.current.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
    }
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  // Render via Portal to Body to escape all parent stacking contexts
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9000] pointer-events-none">
      <div 
        ref={modalRef}
        style={{ 
            ...getStyle(), 
            pointerEvents: 'auto', 
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: 0 // Explicitly Square
        }}
        className="ai-pilot-standalone-window font-sans"
      >
        {/* HEADER */}
        <div 
            className="flex items-center justify-between h-9 px-0 bg-[var(--color-bg-secondary)] select-none cursor-grab active:cursor-grabbing flex-shrink-0"
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center gap-2 pl-3 text-[13px] font-semibold text-[var(--color-text-primary)]">
                <Sparkles size={14} className="text-[var(--color-accent-primary)]" />
                <span>AI PILOT</span>
            </div>

            <div className="flex items-center gap-1 pr-0 no-drag h-full">
                <div className="flex items-center gap-0.5 mr-0">
                    <button 
                        onClick={() => updateSetting('ai.pilotScale', 50)}
                        className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${scale === 50 ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
                        title="Mobile View (50%)"
                    >
                        <Smartphone size={14} />
                    </button>
                    <button 
                        onClick={() => updateSetting('ai.pilotScale', 75)}
                        className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${scale === 75 ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
                        title="Tablet View (75%)"
                    >
                        <Tablet size={14} />
                    </button>
                    <button 
                            onClick={() => updateSetting('ai.pilotScale', 100)}
                            className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${scale === 100 ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
                            title="Desktop View (100%)"
                    >
                        <Monitor size={14} />
                    </button>
                </div>

                {/* Standard Window Controls for Close - 'app' variant gives wider hit target */}
                <div className="h-full flex items-center">
                    <WindowControls 
                        showMinimize={false}
                        showMaximize={false}
                        showClose={true}
                        onClose={onClose}
                        variant="app" 
                    />
                </div>
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
