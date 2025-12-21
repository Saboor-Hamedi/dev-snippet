import React from 'react'
import { Info, AlertTriangle, Lightbulb, FileWarning, AlertOctagon } from 'lucide-react'
import './admonition.css'

const ICONS = {
  note: Info,
  tip: Lightbulb,
  important: AlertOctagon, // or MessageSquare
  warning: AlertTriangle,
  caution: FileWarning
}

const Admonition = ({ type, title, children }) => {
  const normalizedType = (type || 'note').toLowerCase()
  const Icon = ICONS[normalizedType] || ICONS.note
  const label = title || normalizedType

  return (
    <div className={`admonition admonition-${normalizedType}`}>
      <div className="admonition-header">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <div className="admonition-content">{children}</div>
    </div>
  )
}

export default React.memo(Admonition)
