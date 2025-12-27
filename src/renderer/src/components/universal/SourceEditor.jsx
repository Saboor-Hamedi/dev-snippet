import React, { useState } from 'react'

const SourceEditor = ({ initialCode, onSave, onCancel }) => {
  const [code, setCode] = useState(initialCode)

  return (
    <div className="source-editor-container">
      <textarea
        className="cm-md-source-modal-input"
        style={{
          width: '100%',
          minHeight: '300px',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          outline: 'none',
          resize: 'none'
        }}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoFocus
      />
      <div style={{ display: 'none' }}>
        {/* We use the modal footer for the save button, but we can also trigger onSave from here */}
      </div>
    </div>
  )
}

export default SourceEditor
