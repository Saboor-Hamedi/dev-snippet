import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer

const api = {
  confirmDelete: () => electronAPI.ipcRenderer.invoke('confirm-delete'),
  openFile: () => electronAPI.ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: () => electronAPI.ipcRenderer.invoke('dialog:saveFile'),
  openDirectory: () => electronAPI.ipcRenderer.invoke('dialog:openDirectory'),
  readFile: (path) => electronAPI.ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path, content) => electronAPI.ipcRenderer.invoke('fs:writeFile', path, content),
  readDirectory: (path) => electronAPI.ipcRenderer.invoke('fs:readDirectory', path),

  // Settings JSON file
  //  This take are of life watch setttings.json file changes from outside the app

  // Settings JSON file
  readSettingsFile: () => electronAPI.ipcRenderer.invoke('settings:read'),
  writeSettingsFile: (content) => electronAPI.ipcRenderer.invoke('settings:write', content),
  getSettingsPath: () => electronAPI.ipcRenderer.invoke('settings:getPath'),
  forceCreateSettings: () => electronAPI.ipcRenderer.invoke('settings:forceCreate'),
  onSettingsChanged: (callback) => {
    const subscription = (event, content) => callback(content)
    electronAPI.ipcRenderer.on('settings:changed', subscription)
    // Return unsubscribe function
    return () => electronAPI.ipcRenderer.removeListener('settings:changed', subscription)
  },

  // Database
  getSnippets: (options) => electronAPI.ipcRenderer.invoke('db:getSnippets', options),
  getSnippetById: (id) => electronAPI.ipcRenderer.invoke('db:getSnippetById', id),
  searchSnippets: (query) => electronAPI.ipcRenderer.invoke('db:searchSnippets', query),
  saveSnippet: (snippet) => electronAPI.ipcRenderer.invoke('db:saveSnippet', snippet),
  deleteSnippet: (id) => electronAPI.ipcRenderer.invoke('db:deleteSnippet', id),
  getSetting: (key) => electronAPI.ipcRenderer.invoke('db:getSetting', key),
  saveSetting: (key, value) => electronAPI.ipcRenderer.invoke('db:saveSetting', key, value),
  // Drafts
  saveSnippetDraft: (payload) => electronAPI.ipcRenderer.invoke('db:saveSnippetDraft', payload),
  commitSnippetDraft: (id) => electronAPI.ipcRenderer.invoke('db:commitSnippetDraft', id),
  // Window controls
  minimize: () => electronAPI.ipcRenderer.invoke('window:minimize'),
  maximize: () => electronAPI.ipcRenderer.invoke('window:maximize'),
  unmaximize: () => electronAPI.ipcRenderer.invoke('window:unmaximize'),
  toggleMaximize: () => electronAPI.ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => electronAPI.ipcRenderer.invoke('window:close'),
  relaunch: () => electronAPI.ipcRenderer.invoke('window:relaunch'),
  // Bounds helpers for custom resize handles (renderer will call these)
  getWindowBounds: () => electronAPI.ipcRenderer.invoke('window:getBounds'),
  setWindowBounds: (bounds) => electronAPI.ipcRenderer.invoke('window:setBounds', bounds),
  restoreDefaultSize: () => electronAPI.ipcRenderer.invoke('window:restore-default-size'),
  setZoom: (factor) => electronAPI.ipcRenderer.invoke('window:setZoom', factor),
  getZoom: () => electronAPI.ipcRenderer.invoke('window:getZoom'),
  // Backup Management
  listBackups: () => electronAPI.ipcRenderer.invoke('backup:list'),
  restoreBackup: (backupPath) => electronAPI.ipcRenderer.invoke('backup:restore', backupPath),

  // Auto-Update
  checkForUpdates: () => electronAPI.ipcRenderer.invoke('updates:check'),
  downloadUpdate: () => electronAPI.ipcRenderer.invoke('updates:download'),
  installUpdate: () => electronAPI.ipcRenderer.invoke('updates:install'),
  onUpdateAvailable: (callback) => {
    const sub = (e, info) => callback(info)
    electronAPI.ipcRenderer.on('updates:available', sub)
    return () => electronAPI.ipcRenderer.removeListener('updates:available', sub)
  },
  onUpdateNotAvailable: (callback) => {
    const sub = () => callback()
    electronAPI.ipcRenderer.on('updates:not-available', sub)
    return () => electronAPI.ipcRenderer.removeListener('updates:not-available', sub)
  },
  onDownloadProgress: (callback) => {
    const sub = (e, progress) => callback(progress)
    electronAPI.ipcRenderer.on('updates:progress', sub)
    return () => electronAPI.ipcRenderer.removeListener('updates:progress', sub)
  },
  onUpdateDownloaded: (callback) => {
    const sub = (e, info) => callback(info)
    electronAPI.ipcRenderer.on('updates:downloaded', sub)
    return () => electronAPI.ipcRenderer.removeListener('updates:downloaded', sub)
  },
  onUpdateError: (callback) => {
    const sub = (e, message) => callback(message)
    electronAPI.ipcRenderer.on('updates:error', sub)
    return () => electronAPI.ipcRenderer.removeListener('updates:error', sub)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {}
} else {
  window.electron = electronAPI
  window.api = api
}
