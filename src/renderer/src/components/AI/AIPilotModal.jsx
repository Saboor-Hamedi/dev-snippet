import React, { useState, useEffect } from 'react'
import UniversalModal from '../universal/UniversalModal'
import AIPilot from './AIPilot'
import { Maximize2, Minimize2, Sparkles, WifiOff, ShieldAlert, Smartphone, Tablet, Monitor } from 'lucide-react'
import { useSettings } from '../../hook/useSettingsContext'
import { useToast } from '../../hook/useToast'

/**
 * AIPilotModal
 *
 * A specialized floating modal for the AI Pilot with percentage-based sizing.
 */
const AIPilotModal = ({ isOpen, onClose, selectedSnippet }) => {
  const { settings, updateSetting } = useSettings()
  // 50, 75, or 100
  const [scale, setScale] = useState(settings.ai?.pilotScale || 75)

  const { showToast } = useToast()

  // Sync with settings when they change
  useEffect(() => {
    if (settings.ai?.pilotScale) {
      setScale(settings.ai.pilotScale)
    }
  }, [settings.ai?.pilotScale])

  // Security & Connectivity Check skipped here; handled within AIPilot internally for better UX

  const getDimensions = () => {
    if (scale === 100) return { width: '100vw', height: '100vh', noRadius: true }
    if (scale === 75) return { width: '75vw', height: '75vh', noRadius: false }
    return { width: '50vw', height: '50vh', noRadius: false }
  }

  const dim = getDimensions()

  if (!isOpen) return null

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--color-accent-primary)]" />
          <span>AI PILOT</span>
        </div>
      }
      width={dim.width}
      height={dim.height}
      noRadius={dim.noRadius}
      className="ai-pilot-modal-wrapper"
      noTab={true}
      headerHeight={40}
      hideHeaderBorder={true}
      hideBorder={true}
      allowMaximize={false}
      headerContent={
        <div className="flex items-center gap-1.5 px-4 no-drag">
          <button
            onClick={() => updateSetting('ai.pilotScale', 50)}
            className={`p-1 rounded-none transition-colors ${scale === 50 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
            title="Mobile View (50%)"
          >
            <Smartphone size={14} />
          </button>
          <button
            onClick={() => updateSetting('ai.pilotScale', 75)}
            className={`p-1 rounded-none transition-colors ${scale === 75 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
            title="Tablet View (75%)"
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => updateSetting('ai.pilotScale', 100)}
            className={`p-1 rounded-none transition-colors ${scale === 100 ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-tertiary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
            title="Desktop View (100%)"
          >
            <Monitor size={14} />
          </button>
        </div>
      }
    >
      <AIPilot scale={scale} selectedSnippet={selectedSnippet} />
    </UniversalModal>
  )
}

export default AIPilotModal
