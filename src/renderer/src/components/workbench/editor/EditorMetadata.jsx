import React from 'react'
import PropTypes from 'prop-types'
import { X } from 'lucide-react'

const EditorMetadata = ({
  title,
  setTitle,
  titleInputRef,
  isDuplicate,
  tags,
  setTags,
  currentTagInput,
  setCurrentTagInput,
  setIsDirty,
  initialSnippet,
  onSave,
  code,
  titleUpdateTimerRef
}) => {
  return (
    <div className="flex-none snippet-metadata-header pt-8 pb-4 border-none">
      <div className="metadata-inner px-[30px]">
        <input
          ref={titleInputRef}
          className={`snippet-title-input theme-exempt ${isDuplicate ? 'text-red-500' : ''}`}
          value={title}
          onChange={(e) => {
            const val = e.target.value.replace(/\.md$/i, '')
            setTitle(val)
            setIsDirty(true)

            if (initialSnippet?.id && onSave) {
              if (titleUpdateTimerRef.current) clearTimeout(titleUpdateTimerRef.current)
              titleUpdateTimerRef.current = setTimeout(() => {
                onSave(
                  {
                    ...initialSnippet,
                    title: val,
                    code: code,
                    tags: tags,
                    is_draft: false
                  },
                  true
                )
                titleUpdateTimerRef.current = null
              }, 300)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const nextInput = document.querySelector('.snippet-tags-input')
              if (nextInput) nextInput.focus()
            }
          }}
          onWheel={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          spellCheck="false"
          placeholder="Untitled Snippet"
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
                <button
                  onClick={() => {
                    setTags((prev) => prev.filter((_, i) => i !== idx))
                    setIsDirty(true)
                  }}
                  className="snippet-tag-remove"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <input
              className="snippet-tags-input theme-exempt"
              value={currentTagInput}
              onChange={(e) => {
                const val = e.target.value
                if (val.endsWith(',')) {
                  const newTag = val.replace(',', '').trim().toLowerCase()
                  if (newTag && !tags.includes(newTag) && !/^\d+$/.test(newTag)) {
                    setTags((prev) => [...prev, newTag])
                    setCurrentTagInput('')
                    setIsDirty(true)
                  }
                } else {
                  setCurrentTagInput(val)
                  setIsDirty(true)
                }
              }}
              onKeyDown={(e) => {
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
                  } else {
                    const editorElement = document.querySelector('.cm-editor .cm-content')
                    if (editorElement) editorElement.focus()
                  }
                } else if (e.key === 'Backspace' && !currentTagInput) {
                  if (tags.length > 0) {
                    setTags((prev) => prev.slice(0, -1))
                    setIsDirty(true)
                  }
                }
              }}
              spellCheck="false"
              placeholder={tags.length === 0 ? 'add tags...' : ''}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

EditorMetadata.propTypes = {
  title: PropTypes.string.isRequired,
  setTitle: PropTypes.func.isRequired,
  titleInputRef: PropTypes.object,
  isDuplicate: PropTypes.bool,
  tags: PropTypes.array.isRequired,
  setTags: PropTypes.func.isRequired,
  currentTagInput: PropTypes.string.isRequired,
  setCurrentTagInput: PropTypes.func.isRequired,
  setIsDirty: PropTypes.func.isRequired,
  initialSnippet: PropTypes.object,
  onSave: PropTypes.func,
  code: PropTypes.string,
  titleUpdateTimerRef: PropTypes.object
}

export default EditorMetadata
