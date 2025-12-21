// Singleton settings manager instance
//config/settings.js
import { DEFAULT_SETTINGS } from './defaultSettings.js'
import SettingManager from './SettingManager.js'

const settingManager = new SettingManager(DEFAULT_SETTINGS)
// Initialize once
settingManager.load().catch((err) => {
  console.error('Failed to initialize settings:', err)
})

export default settingManager
