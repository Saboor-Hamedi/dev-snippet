// Singleton settings manager instance
//config/settings.js
import { DEFAULT_SETTINGS } from './defaults.js'
import SettingManager from './SettingManager.js'

const settingManager = new SettingManager(DEFAULT_SETTINGS)
await settingManager.load() // Note: top-level await not allowed in modules!

// Initialize once
settingManager.load().catch((err) => {
  console.error('Failed to initialize settings:', err)
})

export default settingManager