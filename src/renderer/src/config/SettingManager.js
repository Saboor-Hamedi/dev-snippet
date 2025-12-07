// settingManager.js
// Manages application settings: load, save, watch for changes, notify subscribers

import { DEFAULT_SETTINGS } from "./defaultSettings.js"
class SettingManager {
  constructor(defaultSettings) {
    this.DEFAULT_SETTINGS = defaultSettings || DEFAULT_SETTINGS
    this.settings = { ...this.DEFAULT_SETTINGS }
    this.listeners = new Set()
    this.watchingEnabled = false
    this.unsubscribeWatcher = null
  }
  // 1. Schema validation

  validateSettingsEarly(settings) {
    const required = ['editor', 'ui', 'behavior', 'advanced']
    return required.every((key) => settings && typeof settings[key] === 'object')
  }

  // 2. Sanitize and watch for changes
  sanitizeValueEarly(value) {
    if (typeof value === 'string') {
      return value.slice(0, 1000) // Prevent extremely long strings
    }
    if (typeof value === 'number') {
      return Math.max(-1000, Math.min(1000, value)) // Reasonable bounds
    }
    return value
  }
  // Start watching settings file
  async startWatching() {
    if (this.watchingEnabled) return
    try {
      // Listen for file changes using the correct API
      if (window.api?.onSettingsChanged) {
        this.unsubscribeWatcher = window.api.onSettingsChanged((data) => {
          try {
            // Validation on zoom level
            if (!data || data.trim() === '') {
              console.debug('[Settings] Skipping empty update')
              return
            }
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
            // console.log('🔄 Settings updated from file:', this.settings)
            this.notifyListeners()
          } catch (err) {
            console.warn('Failed to parse settings from file:', err)
          }
        })
        // Mark as watching
        this.watchingEnabled = true
        // console.log('✅ Settings file watching enabled')
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
      let shouldSave = false;

     
      if (window.api?.readSettingsFile) {
        const data = await window.api.readSettingsFile();
        if (data) {
          const newSettings = JSON.parse(data);
          // Use proper validation method
          if (!this.validateSettings(newSettings)) {
            console.warn('Invalid settings structure in file, using defaults');
            this.settings = { ...DEFAULT_SETTINGS };
            shouldSave = true;
          } else {
            // Merge settings
            this.settings = {
              ...DEFAULT_SETTINGS,
              ...newSettings,
              editor: { ...DEFAULT_SETTINGS.editor, ...newSettings.editor },
              ui: { ...DEFAULT_SETTINGS.ui, ...newSettings.ui },
              behavior: { ...DEFAULT_SETTINGS.behavior, ...newSettings.behavior },
              advanced: { ...DEFAULT_SETTINGS.advanced, ...newSettings.advanced }
            };
          }
          this.notifyListeners();
          if (shouldSave) await this.save();
                  console.log('Settings saved with cursorColor and cursorWidth:', this.settings.editor)
        }
      }
      // Start watching after load
      this.startWatching();
    } catch (error) {
      this.settings = { ...DEFAULT_SETTINGS };
      await this.save();
      // Start watching even if load failed (file might be created later)
      this.startWatching();
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

  // Backup before changes
  async set(path, value) {
    const backup = { ...this.settings }

    try {
      // Sanitize the input value
      const sanitizedValue = this.sanitizeValue(value)
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
      target[keys[keys.length - 1]] = sanitizedValue

      // Skip validation for zoom level updates (allow rapid changes)
      if (!path.includes('zoomLevel') && !this.validateSettings(this.settings)) {
        this.settings = backup // Restore backup
        throw new Error('Invalid settings structure after update')
      }

      // Save and notify
      await this.save()
      this.notifyListeners()
    } catch (err) {
      this.settings = backup // Restore backup on any error
      console.error('Failed to set setting:', err)
      throw err
    }
  }

  // Subscribe to setting changes
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach((callback) => {
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

  // Validate settings structure
  validateSettings(settings) {
    if (!settings || typeof settings !== 'object') return false

    const required = ['editor', 'ui', 'behavior', 'advanced']
    return required.every((key) => settings[key] && typeof settings[key] === 'object')
  }

  // Sanitize input values
  sanitizeValue(value) {
    if (typeof value === 'string') {
      return value.slice(0, 1000) // Prevent extremely long strings
    }
    if (typeof value === 'number') {
      return Math.max(-1000, Math.min(1000, value)) // Reasonable bounds
    }
    if (typeof value === 'boolean') {
      return value
    }
    if (Array.isArray(value)) {
      return value.slice(0, 100) // Limit array size
    }
    if (typeof value === 'object' && value !== null) {
      return value // Objects are allowed
    }
    return value
  }
}
export default SettingManager
