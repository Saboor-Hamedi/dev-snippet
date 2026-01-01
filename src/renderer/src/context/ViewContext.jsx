import React, { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const ViewContext = createContext()

export const ViewProvider = ({ children }) => {
  const [activeView, setActiveView] = useState('snippets') // 'snippets' | 'editor' | 'welcome' | 'settings' | 'markdown'
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

  const navigateTo = (view) => {
    if (view === activeView) return
    setPreviousViews((prev) => [...prev, activeView])
    setActiveView(view)
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
