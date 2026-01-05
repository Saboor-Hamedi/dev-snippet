import React, { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const ViewContext = createContext()

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                            VIEW CONTEXT                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * FILE LOCATION:
 *   src/renderer/src/context/ViewContext.jsx
 *
 * PARENT COMPONENTS:
 *   - SnippetLibrary.jsx (Wraps the entire app tree)
 *
 * CORE RESPONSIBILITY:
 *   Manages the global navigation state of the application. It acts as a lightweight
 *   "Router" for the app, tracking which main view is currently active.
 *
 * STATES MANAGED:
 *   - activeView: 'editor' | 'welcome' | 'settings' | 'markdown'
 *   - viewParams: Object containing extra data for the view (e.g., { tab: 'sync' })
 *   - showPreview: Boolean (persisted to localStorage) for markdown preview
 *   - previousViews: Stack for history/back navigation
 *
 * HOW TO USE:
 *   ```javascript
 *   import { useView } from '../../context/ViewContext'
 *
 *   const Component = () => {
 *     const { navigateTo, activeView, showPreview } = useView()
 *
 *     // Navigate to Editor
 *     const openEditor = () => navigateTo('editor')
 *
 *     // Deep Link to Settings Tab
 *     const openSync = () => navigateTo('settings', { tab: 'sync' })
 *   }
 *   ```
 *
 * ARCHITECTURE NOTES:
 *   - We use a custom Context Router instead of `react-router` because this is an
 *     Electron app with a very flat "Workbench" hierarchy.
 *   - `navigateTo` automagically handles parameter updates even if the view
 *     doesn't change (useful for tab switching).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ViewProvider = ({ children }) => {
  const [activeView, setActiveView] = useState('snippets') // 'snippets' | 'editor' | 'welcome' | 'settings' | 'markdown' | 'graph'
  const [viewParams, setViewParams] = useState({})
  const [previousViews, setPreviousViews] = useState([])
  const [showPreview, setShowPreview] = useState(() => {
    try {
      const v = localStorage.getItem('showPreview')
      if (v === null) return false
      return v === 'true'
    } catch (e) {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('showPreview', showPreview)
    } catch (e) {}
  }, [showPreview])

  const navigateTo = (view, params = {}) => {
    // Allow re-navigation to same view if params changed
    if (view === activeView && JSON.stringify(params) === JSON.stringify(viewParams)) return
    setPreviousViews((prev) => [...prev, activeView])
    setActiveView(view)
    setViewParams(params)
  }

  const goBack = () => {
    setPreviousViews((prev) => {
      const copy = [...prev]
      const last = copy.pop()
      if (last) setActiveView(last)
      return copy
    })
  }

  const togglePreview = () => setShowPreview((prev) => !prev)

  return (
    <ViewContext.Provider
      value={{
        activeView,
        viewParams,
        setActiveView: navigateTo, // Alias for clearer intent
        navigateTo,
        goBack,
        showPreview,
        setShowPreview,
        togglePreview
      }}
    >
      {children}
    </ViewContext.Provider>
  )
}

ViewProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export const useView = () => {
  const context = useContext(ViewContext)
  if (!context) throw new Error('useView must be used within a ViewProvider')
  return context
}
