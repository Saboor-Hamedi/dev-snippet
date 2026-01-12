import React, { useRef } from 'react'
import { X } from 'lucide-react'
import PropTypes from 'prop-types'
import { sanitizeTitle } from '../../../utils/snippetUtils'

/**
 * EditorMetadataHeader - Title and tags input component
 * 
 * This component renders the Obsidian-style metadata header with:
 * - Title input (with duplicate detection)
 * - Tags chip system with inline input
 */
// EditorMetadataHeader: Now delegates saving to the central useEditorSave hook
const EditorMetadataHeader = ({
  title,
  setTitle,
  tags,
  setTags,
  currentTagInput,
  setCurrentTagInput,
  isDuplicate,
  setIsDirty,
  initialSnippet,
  onSave,
  code,
  titleInputRef,
  readOnly,
  scheduleSave // New prop
}) => {
  // const titleUpdateTimerRef = useRef(null) // Removed: Centralized scheduling

  const handleTitleChange = (e) => {
    if (readOnly) return
    const rawVal = e.target.value.replace(/\.md$/i, '')
    const val = sanitizeTitle(rawVal)
    setTitle(val)
    setIsDirty(true)
    
    // Trigger centralized autosave (respects user delay setting)
    if (scheduleSave) {
      scheduleSave()
    }
  }

  const handleTitleKeyDown = (e) => {
    if (readOnly) return
    if (e.key === 'Enter') {
      const nextInput = document.querySelector('.snippet-tags-input')
      if (nextInput) nextInput.focus()
    }
  }

  const handleTagInputChange = (e) => {
    if (readOnly) return
    const val = e.target.value
    if (val.endsWith(',')) {
      const newTag = val.replace(',', '').trim().toLowerCase()
      if (newTag && !tags.includes(newTag) && !/^\d+$/.test(newTag)) {
        setTags((prev) => [...prev, newTag])
        setCurrentTagInput('')
        setIsDirty(true)
        if (scheduleSave) scheduleSave()
      }
    } else {
      setCurrentTagInput(val)
      setIsDirty(true)
      if (scheduleSave) scheduleSave()
    }
  }

  const handleTagInputKeyDown = (e) => {
    if (readOnly) return
    if (e.key === 'Enter') {
      e.preventDefault()
      const newTag = currentTagInput.trim().toLowerCase()
      if (newTag) {
        if (!tags.includes(newTag) && !/^\d+$/.test(newTag)) {
          setTags((prev) => [...prev, newTag])
          setCurrentTagInput('')
        } else {
          setCurrentTagInput('')
        }
        setIsDirty(true)
        if (scheduleSave) scheduleSave()
      } else {
        const editorElement = document.querySelector('.cm-editor .cm-content')
        if (editorElement) editorElement.focus()
      }
    } else if (e.key === 'Backspace' && !currentTagInput) {
      if (tags.length > 0) {
        setTags((prev) => prev.slice(0, -1))
        setIsDirty(true)
        if (scheduleSave) scheduleSave()
      }
    }
  }

  const handleRemoveTag = (idx) => {
    if (readOnly) return
    setTags((prev) => prev.filter((_, i) => i !== idx))
    setIsDirty(true)
    if (scheduleSave) scheduleSave()
  }

  return (
    <div className="flex-none snippet-metadata-header pt-12 pb-0 border-none">
      <div className="metadata-inner px-[30px] flex justify-center">
        <div className="w-full max-w-[850px]">
          <input
            ref={titleInputRef}
            className={`snippet-title-input theme-exempt ${isDuplicate ? 'text-red-500' : ''}`}
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            spellCheck="false"
            placeholder="Untitled"
            readOnly={readOnly}
            disabled={readOnly}
          />
          {isDuplicate && (
            <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">
              Snippet name already exists
            </div>
          )}
          <div className="snippet-tags-container">
            <span className="snippet-tags-label">Tags</span>

            <div className="snippet-tags-list flex flex-wrap gap-2 items-center">
              {tags.map((tag, idx) => (
                <div key={idx} className="snippet-tag-chip group">
                  <span>{String(tag)}</span>
                  {!readOnly && (
                    <button onClick={() => handleRemoveTag(idx)} className="snippet-tag-remove">
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}

              <input
                className="snippet-tags-input theme-exempt"
                value={currentTagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                spellCheck="false"
                placeholder={tags.length === 0 ? 'add tags...' : ''}
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

EditorMetadataHeader.propTypes = {
  title: PropTypes.string.isRequired,
  setTitle: PropTypes.func.isRequired,
  tags: PropTypes.array.isRequired,
  setTags: PropTypes.func.isRequired,
  currentTagInput: PropTypes.string.isRequired,
  setCurrentTagInput: PropTypes.func.isRequired,
  isDuplicate: PropTypes.bool.isRequired,
  setIsDirty: PropTypes.func.isRequired,
  initialSnippet: PropTypes.object,
  onSave: PropTypes.func,
  code: PropTypes.string,
  titleInputRef: PropTypes.object
}

export default EditorMetadataHeader
