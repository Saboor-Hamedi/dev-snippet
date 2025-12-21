import React, { useState, useEffect } from 'react'
import { DEFAULT_SETTINGS } from '../config/defaults.js'
import settingsManager from '../config/settings.js'

const Settings = () => {
  const [state, setState] = React.useState(settingsManager.settings)

  React.useEffect(() => {
    return settingsManager.subscribe(setState)
  }, [])

  const handleToggle = () => {
    settingsManager.set('editor.wordWrap', state.editor.wordWrap === 'on' ? 'off' : 'on')
  }

  return (
    <div>
      <label>
        <input type="checkbox" checked={state.editor.wordWrap === 'on'} onChange={handleToggle} />
        Word Wrap
      </label>
    </div>
  )
}

export default Settings
