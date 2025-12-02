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
  }

  // Load settings from JSON file
  async load() {
    try {
      if (window.api?.readSettingsFile) {
        const data = await window.api.readSettingsFile()
        if (data) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
          this.notifyListeners()
        }
      }
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error)
      this.settings = { ...DEFAULT_SETTINGS }
    }
  }

  // Save settings to JSON file
  async save() {
    try {
      console.log('💾 SettingsManager.save: Starting save process')
      console.log('💾 SettingsManager.save: Current settings:', this.settings)
      if (window.api?.writeSettingsFile) {
        console.log('💾 SettingsManager.save: Calling window.api.writeSettingsFile...')
        const settingsJson = JSON.stringify(this.settings, null, 2)
        console.log('💾 SettingsManager.save: JSON to write:', settingsJson)
        const result = await window.api.writeSettingsFile(settingsJson)
        console.log('✅ SettingsManager.save: Settings saved successfully:', result)
      } else {
        console.warn('⚠️ SettingsManager.save: writeSettingsFile API not available')
      }
    } catch (error) {
      console.error('❌ SettingsManager.save: Failed to save settings:', error)
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
    console.log('🎯 SettingsManager.set: Setting', path, 'to', value)
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
    console.log('🎯 SettingsManager.set: Value set in memory, calling save...')
    
    // Save and notify
    await this.save()
    console.log('🎯 SettingsManager.set: Save completed, notifying listeners...')
    this.notifyListeners()
    console.log('🎯 SettingsManager.set: All done!')
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
        console.error('Settings listener error:', error)
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
console.log('Initializing settings manager...')
settingsManager.load().then(() => {
  console.log('Settings loaded:', settingsManager.getAll())
  // Show the actual settings path
  if (window.api?.getSettingsPath) {
    window.api.getSettingsPath().then(path => {
      console.log('Settings file is located at:', path)
      alert(`Settings file location: ${path}`)
    })
  }
}).catch(err => {
  console.error('Failed to load settings:', err)
})

export { settingsManager, DEFAULT_SETTINGS }
export default settingsManager