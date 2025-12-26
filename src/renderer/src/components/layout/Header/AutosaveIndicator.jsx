import React, { useState, useEffect } from 'react'

const AutosaveIndicator = ({ status }) => {
  const [localStatus, setLocalStatus] = useState(status)

  useEffect(() => {
    setLocalStatus(status)
  }, [status])

  useEffect(() => {
    const handleStatus = (e) => {
      setLocalStatus(e.detail?.status)
    }
    window.addEventListener('autosave-status', handleStatus)
    return () => window.removeEventListener('autosave-status', handleStatus)
  }, [])

  // Auto-hide "Saved" after 2 seconds
  useEffect(() => {
    if (localStatus === 'saved') {
      const timer = setTimeout(() => {
        setLocalStatus(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [localStatus])

  if (!localStatus) return null

  return (
    <div
      className="flex items-center ml-1 pl-2 transition-opacity duration-300"
      style={{ borderLeft: '1px solid var(--color-border)' }}
    >
      <small className="whitespace-nowrap opacity-60 text-[10px] font-medium">
        {localStatus === 'pending' && '...'}
        {localStatus === 'saving' && 'Saving...'}
        {localStatus === 'saved' && 'Saved'}
        {localStatus === 'error' && <span className="text-red-400">Error</span>}
      </small>
    </div>
  )
}

export default AutosaveIndicator
