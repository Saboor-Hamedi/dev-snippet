import React from 'react'
import PropTypes from 'prop-types'
import { Settings, Birdhouse, FolderKanban, Files, Search, SquareM } from 'lucide-react'

// Helper Component for the Icons
const ActivityBarIcon = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    title={label}
    className={`
      w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 border-l-2
      ${
        active
          ? 'border-primary-500 text-primary-600 dark:text-white bg-slate-100 dark:bg-slate-800'
          : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
      }
    `}
  >
    {icon}
  </div>
)

const ActivityBar = ({ activeView, setActiveView, toggleSidebar }) => {
  // Logic: If clicking the active view, toggle the sidebar.
  // Otherwise, switch to the new view and ensure sidebar is open.
  const handleItemClick = (viewName) => {
    if (activeView === viewName) {
      toggleSidebar()
    } else {
      setActiveView(viewName)
      // You might need to pass 'false' to toggleSidebar if your logic expects a boolean,
      // but based on your previous code, toggleSidebar was a simple toggle function.
    }
  }

  return (
    <div className="w-12 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 h-full shrink-0 z-20 transition-colors duration-200">
      {/* --- TOP ICONS --- */}

      {/* Snippets (formerly Explorer) */}
      <ActivityBarIcon
        label="Snippets"
        active={activeView === 'snippets'}
        onClick={() => handleItemClick('snippets')}
        icon={<Files size={12} />}
      />

      {/* Projects */}
      <ActivityBarIcon
        label="Projects"
        active={activeView === 'projects'}
        onClick={() => handleItemClick('projects')}
        icon={<FolderKanban size={12} />}
      />

      {/* --- SPACER --- */}
      <div className="flex-1" />
      {/* Settings */}
      <ActivityBarIcon
        label="Settings"
        active={activeView === 'settings'}
        onClick={() => setActiveView('settings')}
        icon={<Settings size={12} />}
      />
    </div>
  )
}

ActivityBarIcon.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
}

ActivityBar.propTypes = {
  activeView: PropTypes.string.isRequired,
  setActiveView: PropTypes.func.isRequired,
  toggleSidebar: PropTypes.func.isRequired
}

export default ActivityBar
