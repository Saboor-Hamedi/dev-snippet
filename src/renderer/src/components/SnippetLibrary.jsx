import React, { useState, useEffect, useRef, useCallback } from 'react'
import ThemeComponent from './ThemeComponent'
import DeleteModel from '../utils/DeleteModel'
import { useToast } from '../utils/ToastNotification'
import CreateProjectModal from './CreateProjectModal'

// Activity Bar Icons Component
const ActivityBarIcon = ({ icon, label, active, onClick }) => (
  <div className={`activity-bar-item ${active ? 'active' : ''}`} onClick={onClick} title={label}>
    {icon}
  </div>
)

const SnippetLibrary = () => {
  const [snippets, setSnippets] = useState([])
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [newSnippetCode, setNewSnippetCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState('explorer') // Default to explorer
  const [selectedSnippet, setSelectedSnippet] = useState(null) // Track selected snippet for workbench
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    snippetId: null,
    snippetTitle: ''
  })
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)
  const [toast, showToast] = useToast()

  // Load Data from DB
  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.api && window.api.getSnippets && window.api.getProjects) {
          const loadedSnippets = await window.api.getSnippets()
          setSnippets(loadedSnippets)

          const loadedProjects = await window.api.getProjects()
          setProjects(loadedProjects)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        showToast('❌ Failed to load data')
      }
    }
    loadData()
  }, [])

  const detectLanguage = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase()
    const map = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      html: 'html',
      css: 'css',
      java: 'java',
      cpp: 'cpp',
      c: 'cpp',
      php: 'php',
      rb: 'ruby',
      md: 'markdown',
      go: 'go',
      rs: 'rust'
    }
    return map[ext] || 'other'
  }

  const handleOpenFile = async () => {
    try {
      if (window.api && window.api.openFile && window.api.readFile && window.api.saveSnippet) {
        const path = await window.api.openFile()
        if (path) {
          const content = await window.api.readFile(path)
          const fileName = path.split('\\').pop().split('/').pop()

          const newEntry = {
            id: Date.now().toString(),
            title: fileName,
            code: content,
            language: detectLanguage(fileName),
            timestamp: Date.now(),
            type: 'snippet'
          }

          const updatedSnippets = [newEntry, ...snippets]
          setSnippets(updatedSnippets)
          await window.api.saveSnippet(newEntry)
          setSelectedSnippet(newEntry)
          showToast('✓ File opened successfully')
        }
      } else {
        console.warn('API not available for opening file')
      }
    } catch (error) {
      console.error('Error opening file:', error)
      showToast('❌ Failed to open file')
    }
  }

  const handleExportData = async () => {
    try {
      if (window.api && window.api.saveFileDialog && window.api.writeFile) {
        const path = await window.api.saveFileDialog()
        if (path) {
          const data = {
            snippets,
            projects
          }
          await window.api.writeFile(path, JSON.stringify(data, null, 2))
          showToast('✓ Data exported successfully')
        }
      } else {
        console.warn('API not available for exporting data')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      showToast('❌ Failed to export data')
    }
  }

  const handleSaveSnippet = async (e) => {
    e.preventDefault()
    if (!newSnippetCode.trim()) {
      showToast('❌ Please enter some code')
      return
    }

    const codePreview =
      newSnippetCode.trim().substring(0, 40) + (newSnippetCode.length > 40 ? '...' : '')

    const newEntry = {
      id: Date.now().toString(),
      title: `Snippet: ${codePreview}`,
      code: newSnippetCode,
      language: language,
      timestamp: Date.now(),
      type: 'snippet'
    }

    const updatedSnippets = [newEntry, ...snippets]
    setSnippets(updatedSnippets)
    setNewSnippetCode('')
    setSelectedSnippet(newEntry) // Open the new snippet

    try {
      if (window.api && window.api.saveSnippet) {
        await window.api.saveSnippet(newEntry)
        showToast('✓ Snippet saved successfully!')
      } else {
        console.warn('API not available for saving snippet')
      }
    } catch (error) {
      console.error('Failed to save snippet:', error)
      showToast('❌ Failed to save snippet')
    }
  }

  const handleCreateProject = async (projectData) => {
    const newProject = {
      id: `p-${Date.now()}`,
      title: projectData.title,
      code: projectData.description
        ? `// ${projectData.description}\n\n// Start coding...`
        : '// Start coding...',
      language: projectData.language,
      timestamp: Date.now(),
      type: 'project'
    }
    const updatedProjects = [newProject, ...projects]
    setProjects(updatedProjects)

    try {
      if (window.api && window.api.saveProject) {
        await window.api.saveProject(newProject)
        showToast('✓ Project created successfully!')
        setSelectedSnippet(newProject)
      } else {
        console.warn('API not available for saving project')
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      showToast('❌ Failed to save project')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        if (deleteModal.isOpen) {
          setDeleteModal({
            isOpen: false,
            snippetId: null,
            snippetTitle: ''
          })
        }
      }
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [deleteModal.isOpen, sidebarCollapsed])

  // Request delete
  const handleRequestDelete = useCallback(
    (id) => {
      const snippet = snippets.find((s) => s.id === id)
      setDeleteModal({
        isOpen: true,
        snippetId: id,
        snippetTitle: snippet ? snippet.title : 'Snippet'
      })
    },
    [snippets]
  )

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (deleteModal.snippetId) {
      try {
        if (window.api && window.api.deleteProject && window.api.deleteSnippet) {
          if (deleteModal.snippetId.toString().startsWith('p-')) {
            // Handle project deletion
            await window.api.deleteProject(deleteModal.snippetId)
            const updatedProjects = projects.filter((p) => p.id !== deleteModal.snippetId)
            setProjects(updatedProjects)
            showToast('✓ Project deleted')
          } else {
            // Handle snippet deletion
            await window.api.deleteSnippet(deleteModal.snippetId)
            const updatedSnippets = snippets.filter(
              (snippet) => snippet.id !== deleteModal.snippetId
            )
            setSnippets(updatedSnippets)
            showToast('✓ Successfully deleted')
          }
        } else {
          console.warn('API not available for deletion')
        }
      } catch (error) {
        console.error('Failed to delete:', error)
        showToast('❌ Failed to delete')
      }
    }
    setDeleteModal({
      isOpen: false,
      snippetId: null,
      snippetTitle: ''
    })
  }

  // Filter Items based on Active View
  const filteredItems = React.useMemo(() => {
    const items = activeView === 'projects' ? projects : snippets
    if (!searchTerm.trim()) return items
    const searchLower = searchTerm.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        (item.code && item.code.toLowerCase().includes(searchLower)) ||
        (item.language && item.language.toLowerCase().includes(searchLower))
    )
  }, [snippets, projects, searchTerm, activeView])

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {toast && <div className="toast">{toast}</div>}

      {/* Activity Bar */}
      <div className="activity-bar">
        <ActivityBarIcon
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
          label="Explorer"
          active={activeView === 'explorer' && !sidebarCollapsed}
          onClick={() => {
            if (activeView === 'explorer' && !sidebarCollapsed) {
              setSidebarCollapsed(true)
            } else {
              setActiveView('explorer')
              setSidebarCollapsed(false)
            }
          }}
        />
        <ActivityBarIcon
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
          label="Projects"
          active={activeView === 'projects' && !sidebarCollapsed}
          onClick={() => {
            if (activeView === 'projects' && !sidebarCollapsed) {
              setSidebarCollapsed(true)
            } else {
              setActiveView('projects')
              setSidebarCollapsed(false)
            }
          }}
        />
        <ActivityBarIcon
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
          label="Search"
          active={activeView === 'search' && !sidebarCollapsed}
          onClick={() => {
            if (activeView === 'search' && !sidebarCollapsed) {
              setSidebarCollapsed(true)
            } else {
              setActiveView('search')
              setSidebarCollapsed(false)
            }
          }}
        />
        <div className="flex-1" />
        <div className="activity-bar-item">
          <ThemeComponent />
        </div>
        <ActivityBarIcon
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
          label="Settings"
          active={activeView === 'settings'}
          onClick={() => setActiveView('settings')}
        />
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {activeView === 'explorer'
                ? 'Explorer'
                : activeView === 'projects'
                  ? 'Projects'
                  : 'Search'}
            </h2>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Search Input in Sidebar */}
          {(activeView === 'explorer' || activeView === 'search') && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input pl-10"
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeView === 'projects' ? (
            <div className="text-center py-8 text-slate-400">
              {projects.length === 0 ? (
                <>
                  <p>No projects yet.</p>
                  <button
                    className="mt-4 btn-primary text-sm"
                    onClick={() => setCreateProjectModalOpen(true)}
                  >
                    + New Project
                  </button>
                </>
              ) : (
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      Projects
                    </span>
                    <button
                      onClick={() => setCreateProjectModalOpen(true)}
                      className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded transition-colors"
                    >
                      + New
                    </button>
                  </div>
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSnippet(item)}
                      className={`p-2 rounded-md cursor-pointer transition-colors flex items-center gap-2 group ${
                        selectedSnippet?.id === item.id
                          ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <svg
                        className="w-4 h-4 opacity-70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      <span className="text-sm truncate flex-1">{item.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRequestDelete(item.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {activeView === 'explorer' ? 'Snippets' : 'Results'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenFile}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors"
                    title="Open File"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSnippet(null)
                      setNewSnippetCode('')
                    }}
                    className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded transition-colors"
                  >
                    + New
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSnippet(item)}
                    className={`p-2 rounded-md cursor-pointer transition-colors flex items-center gap-2 group ${
                      selectedSnippet?.id === item.id
                        ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {item.type === 'project' ? (
                      <svg
                        className="w-4 h-4 opacity-70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 opacity-70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    )}
                    <span className="text-sm truncate flex-1">{item.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRequestDelete(item.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No {activeView === 'projects' ? 'projects' : 'snippets'} found.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area (Workbench) */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {activeView === 'settings' ? (
          <div className="p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="space-y-4 text-slate-400">
                <p>Settings panel coming soon...</p>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm">
                    <strong className="text-white">Keyboard Shortcuts:</strong>
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Ctrl/Cmd + B - Toggle Sidebar</li>
                    <li>• Escape - Close Modals</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm">
                    <strong className="text-white">Data Management:</strong>
                  </p>
                  <button
                    onClick={handleExportData}
                    className="mt-2 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    Export All Data (JSON)
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Workbench Tabs/Header */}
            <div className="bg-slate-900 border-b border-slate-700 flex items-center px-4 h-12">
              {selectedSnippet ? (
                <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-1.5 rounded-t-md border-t border-x border-slate-700 text-sm">
                  <span className="opacity-70 text-xs uppercase font-bold tracking-wider">
                    {selectedSnippet.language}
                  </span>
                  <span>{selectedSnippet.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSnippet(null)
                    }}
                    className="ml-2 hover:bg-slate-700 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-1.5 rounded-t-md border-t border-x border-slate-700 text-sm">
                  <span>New Snippet</span>
                </div>
              )}
            </div>

            {/* Workbench Editor Area */}
            <div className="flex-1 bg-slate-900 p-0 overflow-hidden relative">
              {selectedSnippet ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 relative">
                    <textarea
                      readOnly
                      value={selectedSnippet.code}
                      className="w-full h-full bg-[#0f172a] text-slate-300 p-6 font-mono text-sm resize-none focus:outline-none"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedSnippet.code)
                          showToast('Copied to clipboard!')
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors border border-slate-700"
                        title="Copy Code"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <form onSubmit={handleSaveSnippet} className="h-full flex flex-col">
                    <div className="flex-1 relative">
                      <textarea
                        placeholder="// Start typing your code here..."
                        value={newSnippetCode}
                        onChange={(e) => setNewSnippetCode(e.target.value)}
                        className="w-full h-full bg-[#0f172a] text-slate-300 p-6 font-mono text-sm resize-none focus:outline-none"
                        spellCheck="false"
                      />
                    </div>
                    <div className="border-t border-slate-700 p-4 bg-slate-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="html">HTML</option>
                          <option value="css">CSS</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                          <option value="php">PHP</option>
                          <option value="ruby">Ruby</option>
                          <option value="markdown">Markdown</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setNewSnippetCode('')}
                          className="px-4 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          type="submit"
                          disabled={!newSnippetCode.trim()}
                          className="px-6 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save Snippet
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModel
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, snippetId: null, snippetTitle: '' })}
        onConfirm={handleConfirmDelete}
        snippetTitle={deleteModal.snippetTitle}
      />

      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onSave={handleCreateProject}
      />
    </div>
  )
}

export default SnippetLibrary
