import React from 'react'
import ThemeComponent from '../../components/ThemeComponent'
// Helper Component for the Icons
const ActivityBarIcon = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    title={label}
    className={`
      w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 border-l-2
      ${
        active
          ? 'border-primary-500 text-white bg-slate-800'
          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
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
      // We assume if they switch views, they want to see the sidebar
      // You might need to pass 'false' to toggleSidebar if your logic expects a boolean,
      // but based on your previous code, toggleSidebar was a simple toggle function.
    }
  }

  return (
    <div className="w-12 flex flex-col bg-slate-900 border-r border-slate-700 h-full shrink-0 z-20">
      {/* --- TOP ICONS --- */}

      {/* Explorer */}
      <ActivityBarIcon
        label="Explorer"
        active={activeView === 'explorer'}
        onClick={() => handleItemClick('explorer')}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        }
      />

      {/* Projects */}
      <ActivityBarIcon
        label="Projects"
        active={activeView === 'projects'}
        onClick={() => handleItemClick('projects')}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
      />

      {/* Search (Optional: Only if you want a dedicated search view separate from explorer) */}
      {/* If search is just a filter in explorer, you might not need this icon, but here it is based on your original code */}
      {/* <ActivityBarIcon
        label="Search"
        active={activeView === 'search'}
        onClick={() => handleItemClick('search')}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      /> 
      */}

      {/* --- SPACER --- */}
      <div className="flex-1" />

      {/* --- BOTTOM ICONS --- */}

      {/* Theme Toggle */}
      <div className="flex items-center justify-center py-2">
        <ThemeComponent />
      </div>

      {/* Settings */}
      <ActivityBarIcon
        label="Settings"
        active={activeView === 'settings'}
        onClick={() => setActiveView('settings')}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        }
      />
    </div>
  )
}

export default ActivityBar
