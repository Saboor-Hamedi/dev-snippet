// settingManager.js
// Manages application settings: load, save, watch for changes, notify subscribers

import { DEFAULT_SETTINGS } from './defaultSettings.js'
class SettingManager {
  constructor(defaultSettings) {
    this.DEFAULT_SETTINGS = defaultSettings || DEFAULT_SETTINGS
    this.settings = JSON.parse(JSON.stringify(this.DEFAULT_SETTINGS))
    this.listeners = new Set()
    this.watchingEnabled = false
    this.unsubscribeWatcher = null
    this.saveTimeout = null
  }
  // 1. Schema validation

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
              return
            }
            const newSettings = JSON.parse(data)

            // Merge with defaults to ensure structure
            this.settings = {
              ...DEFAULT_SETTINGS,
              ...newSettings
            }

            // Deep merge for key objects
            for (const key of [
              'editor',
              'ui',
              'behavior',
              'advanced',
              'gutter',
              'livePreview',
              'welcome',
              'cursor'
            ]) {
              if (DEFAULT_SETTINGS[key] && typeof DEFAULT_SETTINGS[key] === 'object') {
                this.settings[key] = {
                  ...DEFAULT_SETTINGS[key],
                  ...(newSettings[key] || {})
                }
              }
            }
            this.notifyListeners()
          } catch (err) {}
        })
        // Mark as watching
        this.watchingEnabled = true
      }
    } catch (err) {}
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
    } catch (err) {}
  }

  // Load settings from JSON file
  async load() {
    try {
      if (window.api?.readSettingsFile) {
        const data = await window.api.readSettingsFile()
        if (data && data.trim()) {
          try {
            const newSettings = JSON.parse(data)

            // Create a fresh object from defaults
            const nextSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))

            // Shallow merge the new settings
            Object.assign(nextSettings, newSettings)

            // Deep merge key sections to preserve sub-keys from defaults
            const sections = [
              'editor',
              'ui',
              'behavior',
              'advanced',
              'gutter',
              'livePreview',
              'welcome',
              'cursor'
            ]
            for (const key of sections) {
              if (DEFAULT_SETTINGS[key] && typeof DEFAULT_SETTINGS[key] === 'object') {
                nextSettings[key] = {
                  ...DEFAULT_SETTINGS[key],
                  ...(newSettings[key] || {})
                }
              }
            }

            this.settings = nextSettings
            this.notifyListeners()
          } catch (parseErr) {
            this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
            this.notifyListeners()
          }
        } else {
          // File is empty or does not exist, initialize with defaults
          this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
          await this.save(true) // Immediate save for new file
          this.notifyListeners()
        }
      }
      this.startWatching()
    } catch (error) {
      this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
      this.notifyListeners()
      this.startWatching()
    }
  }

  // Debounced save
  async save(immediate = false) {
    if (this.saveTimeout) clearTimeout(this.saveTimeout)

    const performSave = async () => {
      try {
        if (window.api?.writeSettingsFile) {
          const json = JSON.stringify(this.settings, null, 2)
          await window.api.writeSettingsFile(json)
        }
      } catch (e) {}
    }

    if (immediate) {
      await performSave()
    } else {
      this.saveTimeout = setTimeout(performSave, 250)
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
    // Deep clone state to avoid mutation issues
    const nextSettings = JSON.parse(JSON.stringify(this.settings))
    const keys = path.split('.')
    let target = nextSettings

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {}
      }
      target = target[key]
    }

    const lastKey = keys[keys.length - 1]
    const sanitized = this.sanitizeValue(value)

    // Only update and notify if value actually changed
    if (target[lastKey] === sanitized) return

    target[lastKey] = sanitized
    this.settings = nextSettings

    // Zoom updates save immediately, others use debounce
    await this.save(path.includes('zoomLevel'))
    this.notifyListeners()
  }

  // Subscribe to setting changes
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Notify all listeners
  notifyListeners() {
    const current = this.getAll()
    this.listeners.forEach((cb) => {
      try {
        cb(current)
      } catch (e) {}
    })
  }

  // Reset to defaults
  async reset() {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
    await this.save(true)
    this.notifyListeners()
  }

  // Get all settings
  getAll() {
    return JSON.parse(JSON.stringify(this.settings))
  }

  // Validate settings structure - more forgiving to allow partial config files
  validateSettings(settings) {
    if (!settings || typeof settings !== 'object') return false
    // Just ensure it's an object. Missing sections will be filled by defaults during merge.
    return true
  }

  // Sanitize input values
  sanitizeValue(value) {
    if (typeof value === 'string') {
      return value.slice(0, 10000) // Prevent extremely long strings
    }
    if (typeof value === 'number') {
      // Relaxed bounds: 100MB max for any numeric setting (like maxFileSize)
      return Math.max(-100000000, Math.min(100000000, value))
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
