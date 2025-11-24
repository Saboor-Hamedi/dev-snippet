import React, { useState, useEffect, useRef, useCallback } from 'react'
import SnippetCard from './SnippetCard'
import ThemeComponent from './ThemeComponent'
import DeleteModel from '../utils/DeleteModel'
import { useToast } from '../utils/ToastNotification'
const STORAGE_KEY = 'codeSnippets'

const SnippetLibrary = () => {
  const [snippets, setSnippets] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [newSnippetCode, setNewSnippetCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    snippetId: null,
    snippetTitle: ''
  })

  // show notification
  const [toast, showToast] = useToast()
  const saveTimeoutRef = useRef(null)

  // Load Data from LocalStorage
  useEffect(() => {
    const storedSnippets = localStorage.getItem(STORAGE_KEY)
    if (storedSnippets) {
      try {
        const loadedSnippets = JSON.parse(storedSnippets)
        const sortedSnippets = loadedSnippets.sort((a, b) => b.timestamp - a.timestamp)
        setSnippets(sortedSnippets)
      } catch (e) {
        console.error('Error loading snippets from local storage:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Save New Snippet
  const handleSaveSnippet = (e) => {
    e.preventDefault()
    if (!newSnippetCode.trim()) {
      showToast('❌ Please enter some code')
      return
    }

    const codePreview =
      newSnippetCode.trim().substring(0, 40) + (newSnippetCode.length > 40 ? '...' : '')

    const newEntry = {
      id: Date.now(),
      title: `Snippet: ${codePreview}`,
      code: newSnippetCode,
      language: language,
      timestamp: Date.now()
    }

    const updatedSnippets = [newEntry, ...snippets]
    setSnippets(updatedSnippets)
    setNewSnippetCode('')

    // Save with debounce but show toast immediately (optimistic update)
    showToast('✓ Snippet saved successfully!')
    saveSnippetsToStorage(updatedSnippets)
  }

  // Debounced save
  const saveSnippetsToStorage = useCallback((updatedSnippets) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSnippets))
        // Optional: Verify save worked
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) {
          console.error('Save verification failed')
        }
      } catch (err) {
        console.error('Failed to save snippets to localStorage:', err)
      }
    }, 300)
  }, [])

  // Toast Notification
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
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [deleteModal.isOpen]) //  modal states as dependencies

  // Request delete (triggers modal)
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
  const handleConfirmDelete = () => {
    if (deleteModal.snippetId) {
      const updatedSnippets = snippets.filter((snippet) => snippet.id !== deleteModal.snippetId)
      setSnippets(updatedSnippets)
      saveSnippetsToStorage(updatedSnippets)
      showToast('Successfully Delete.')
    }
    setDeleteModal({
      isOpen: false,
      snippetId: null,
      snippetTitle: ''
    })
  }

  // Filter Snippets
  const filteredSnippets = React.useMemo(() => {
    if (!searchTerm.trim()) return snippets
    const searchLower = searchTerm.toLowerCase()
    return snippets.filter(
      (snippet) =>
        snippet.title.toLowerCase().includes(searchLower) ||
        snippet.code.toLowerCase().includes(searchLower)
    )
  }, [snippets, searchTerm])

  return (
    <div className="app-container">
      {toast && <div className="toast">{toast}</div>}
      {/* Header with Search */}
      <div className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Quick Snippets</h1>
            <p>Save and organize your code snippets</p>
          </div>
          <div className="header-right">
            <ThemeComponent />

            <div className="header-search-container">
              <input
                type="text"
                placeholder="Search snippets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="header-search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
            <div className="snippet-count-header">
              {filteredSnippets.length} {filteredSnippets.length === 1 ? 'snippet' : 'snippets'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Left Column - Snippets List */}
        <div className="snippets-column">
          <div className="snippet-list">
            {filteredSnippets.length === 0 ? (
              <div className="empty-state">
                <p>
                  {snippets.length === 0
                    ? 'No snippets saved yet. Add one using the form!'
                    : `No snippets found matching "${searchTerm}"`}
                </p>
              </div>
            ) : (
              filteredSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  onRequestDelete={handleRequestDelete}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column - Add Snippet Form */}
        <div className="form-column">
          <form onSubmit={handleSaveSnippet} className="save-form-container">
            <div className="form-header">
              <h3>Add New Snippet</h3>
            </div>

            <div className="form-group">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="code">Code</label>
              <textarea
                id="code"
                placeholder="// Paste your code here..."
                value={newSnippetCode}
                onChange={(e) => setNewSnippetCode(e.target.value)}
                rows="12"
                className="code-area-input"
              />
            </div>

            <button type="submit" className="save-button" disabled={!newSnippetCode.trim()}>
              Save Snippet
            </button>
          </form>
        </div>
      </div>

      {/* ✅ Delete Confirmation Modal */}
      <DeleteModel
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, snippetId: null, snippetTitle: '' })}
        onConfirm={handleConfirmDelete}
        snippetTitle={deleteModal.snippetTitle}
      />
    </div>
  )
}

export default SnippetLibrary
