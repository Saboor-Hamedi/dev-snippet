import { useEffect } from 'react'
import PropTypes from 'prop-types'

const AltPHandler = ({ snippets = [], selectedSnippet, selectedIds = [], onOpen }) => {
  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey || e.key.toLowerCase() !== 'p') return
      try {
        e.preventDefault()
        try {
          e.stopImmediatePropagation()
        } catch (err) {}
      } catch {}
      const targetId =
        selectedSnippet?.id || (selectedIds && selectedIds.length === 1 ? selectedIds[0] : null) ||
        (snippets && snippets.length > 0 ? snippets[0].id : null)
      try {
        console.debug('[AltPHandler] Alt+P pressed, targetId=', targetId)
      } catch (err) {}
      if (!targetId) return
      // Attempt to get active element rect to position popover near focus; fallback to centered top area
      let rect = null
      try {
        const active = document.activeElement
        if (active && active.getBoundingClientRect) rect = active.getBoundingClientRect()
      } catch {}
      if (!rect) {
        rect = { left: window.innerWidth / 2 - 80, top: 60, x: window.innerWidth / 2 - 80, y: 60 }
      }
      try {
        onOpen && onOpen(targetId, rect, 'keyboard')
      } catch (err) {
        try {
          console.error('[AltPHandler] onOpen threw', err)
        } catch {}
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [snippets, selectedSnippet, selectedIds, onOpen])

  return null
}

AltPHandler.propTypes = {
  snippets: PropTypes.array,
  selectedSnippet: PropTypes.object,
  selectedIds: PropTypes.array,
  onOpen: PropTypes.func
}

export default AltPHandler
