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

  // Helper for deep merging
  deepMerge(target, source) {
    const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj)

    if (!isObject(target) || !isObject(source)) {
      return source
    }

    const output = { ...target }
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = this.deepMerge(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
    return output
  }

  // Start watching settings file
  async startWatching() {
    if (this.watchingEnabled) return
    try {
      // Listen for file changes
      if (window.api?.onSettingsChanged) {
        this.unsubscribeWatcher = window.api.onSettingsChanged((data) => {
          try {
            if (!data || data.trim() === '') return

            const newSettings = JSON.parse(data)

            // Generic deep merge with defaults to preserve ALL user keys
            this.settings = this.deepMerge(DEFAULT_SETTINGS, newSettings)

            this.notifyListeners()
          } catch (err) {}
        })
        this.watchingEnabled = true
      }
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
            // Generic deep merge
            this.settings = this.deepMerge(DEFAULT_SETTINGS, newSettings)
            this.notifyListeners()
          } catch (parseErr) {
            this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
            this.notifyListeners()
          }
        } else {
          this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
          await this.save(true)
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
    // Note: Shallow comparison might be enough for primitives
    if (target[lastKey] === sanitized) return

    target[lastKey] = sanitized
    this.settings = nextSettings

    await this.save(path.includes('zoomLevel'))
    this.notifyListeners()
  }

  // Replace all settings (e.g. from JSON editor)
  async replace(newSettings) {
    if (!this.validateSettings(newSettings)) return
    // Deep merge with defaults to ensure missing keys are filled
    this.settings = this.deepMerge(DEFAULT_SETTINGS, newSettings)
    await this.save(true)
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

  validateSettings(settings) {
    return settings && typeof settings === 'object'
  }

  // Sanitize input values
  sanitizeValue(value) {
    if (typeof value === 'string') {
      return value.slice(0, 10000)
    }
    if (typeof value === 'number') {
      return Math.max(-100000000, Math.min(100000000, value))
    }
    return value
  }
}
export default SettingManager
