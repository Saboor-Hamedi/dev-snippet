import React, { useState, useEffect } from 'react'

// Default settings structure
const DEFAULT_SETTINGS = {
  editor: {
    zoomLevel: 1.0,
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    lineNumbers: true,
    wordWrap: 'on',
    tabSize: 2,
    theme: 'dark'
  },
  ui: {
    compactMode: false,
    showPreview: false,
    sidebarWidth: 250,
    previewPosition: 'right'
  },
  behavior: {
    autoSave: true,
    autoSaveDelay: 2000,
    confirmDelete: true,
    restoreSession: true
  },
  advanced: {
    enableCodeFolding: true,
    enableAutoComplete: true,
    enableLinting: false,
    maxFileSize: 1048576 // 1MB
  }
}

// Settings manager class
class SettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS }
    this.listeners = new Set()
    this.watchingEnabled = false
    this.unsubscribeWatcher = null
  }

  // Start watching settings file
  async startWatching() {
    if (this.watchingEnabled) return
    try {
      // Listen for file changes using the correct API
      if (window.api?.onSettingsChanged) {
        this.unsubscribeWatcher = window.api.onSettingsChanged((data) => {
          try {
            const newSettings = JSON.parse(data)
            // Merge with defaults to ensure structure
            this.settings = { 
              ...DEFAULT_SETTINGS, 
              ...newSettings,
              editor: { ...DEFAULT_SETTINGS.editor, ...newSettings.editor },
              ui: { ...DEFAULT_SETTINGS.ui, ...newSettings.ui },
              behavior: { ...DEFAULT_SETTINGS.behavior, ...newSettings.behavior },
              advanced: { ...DEFAULT_SETTINGS.advanced, ...newSettings.advanced }
            }
            console.log('🔄 Settings updated from file:', this.settings)
            this.notifyListeners()
          } catch (err) {
            console.warn('Failed to parse settings from file:', err)
          }
        })
        
        this.watchingEnabled = true
        console.log('✅ Settings file watching enabled')
      }
    } catch (err) {
      console.error('Failed to start watching settings file:', err)
    }
  }

  // Stop watching
  async stopWatching() {
    if (!this.watchingEnabled) return

    try {
      if (this.unsubscribeWatcher) {
        this.unsubscribeWatcher()
        this.unsubscribeWatcher = null
      }
      this.watchingEnabled = false
      console.log('⏹️ Settings file watching disabled')
    } catch (err) {
      console.warn('Failed to stop settings watching:', err)
    }
  }

  // Load settings from JSON file
  async load() {
    try {
      if (window.api?.readSettingsFile) {
        const data = await window.api.readSettingsFile()
        if (data) {
          const newSettings = JSON.parse(data)
          this.settings = { 
            ...DEFAULT_SETTINGS, 
            ...newSettings,
            editor: { ...DEFAULT_SETTINGS.editor, ...newSettings.editor },
            ui: { ...DEFAULT_SETTINGS.ui, ...newSettings.ui },
            behavior: { ...DEFAULT_SETTINGS.behavior, ...newSettings.behavior },
            advanced: { ...DEFAULT_SETTINGS.advanced, ...newSettings.advanced }
          }
          this.notifyListeners()
        }
      }
      // Start watching after load
      this.startWatching()
    } catch (error) {
      this.settings = { ...DEFAULT_SETTINGS }
      // Start watching even if load failed (file might be created later)
      this.startWatching()
    }
  }

  // Save settings to JSON file
  async save() {
    try {
      if (window.api?.writeSettingsFile) {
        const settingsJson = JSON.stringify(this.settings, null, 2)
        await window.api.writeSettingsFile(settingsJson)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Get a setting value
  get(path) {
    const keys = path.split('.')
    let value = this.settings
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }
    return value
  }

  // Set a setting value
  async set(path, value) {
    const keys = path.split('.')
    let target = this.settings
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {}
      }
      target = target[key]
    }
    
    // Set the final value
    target[keys[keys.length - 1]] = value
    
    // Save and notify
    await this.save()
    this.notifyListeners()
  }

  // Subscribe to setting changes
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.settings)
      } catch (error) {
        console.error('Error in settings listener:', error)
      }
    })
  }

  // Reset to defaults
  async reset() {
    this.settings = { ...DEFAULT_SETTINGS }
    await this.save()
    this.notifyListeners()
  }

  // Get all settings
  getAll() {
    return { ...this.settings }
  }
}

// Global settings manager instance
const settingsManager = new SettingsManager()

// Initialize settings on first import
settingsManager.load().catch(err => {
  console.error('Failed to initialize settings:', err)
})

export { settingsManager, DEFAULT_SETTINGS }
export default settingsManager