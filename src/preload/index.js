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
  readSettingsFile: () => electronAPI.ipcRenderer.invoke('settings:read'),
  writeSettingsFile: (content) => electronAPI.ipcRenderer.invoke('settings:write', content),
  getSettingsPath: () => electronAPI.ipcRenderer.invoke('settings:getPath'),
  forceCreateSettings: () => electronAPI.ipcRenderer.invoke('settings:forceCreate'),

  // Database
  getSnippets: () => electronAPI.ipcRenderer.invoke('db:getSnippets'),
  saveSnippet: (snippet) => electronAPI.ipcRenderer.invoke('db:saveSnippet', snippet),
  deleteSnippet: (id) => electronAPI.ipcRenderer.invoke('db:deleteSnippet', id),
  getSetting: (key) => electronAPI.ipcRenderer.invoke('db:getSetting', key),
  saveSetting: (key, value) => electronAPI.ipcRenderer.invoke('db:saveSetting', key, value),
  getTheme: () => electronAPI.ipcRenderer.invoke('db:getTheme'),
  saveTheme: (theme) => electronAPI.ipcRenderer.invoke('db:saveTheme', theme),
  // Drafts
  saveSnippetDraft: (payload) => electronAPI.ipcRenderer.invoke('db:saveSnippetDraft', payload),
  commitSnippetDraft: (id) => electronAPI.ipcRenderer.invoke('db:commitSnippetDraft', id),
  // Window controls
  minimize: () => electronAPI.ipcRenderer.invoke('window:minimize'),
  maximize: () => electronAPI.ipcRenderer.invoke('window:maximize'),
  unmaximize: () => electronAPI.ipcRenderer.invoke('window:unmaximize'),
  toggleMaximize: () => electronAPI.ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => electronAPI.ipcRenderer.invoke('window:close'),
  // Bounds helpers for custom resize handles (renderer will call these)
  getWindowBounds: () => electronAPI.ipcRenderer.invoke('window:getBounds'),
  setWindowBounds: (bounds) => electronAPI.ipcRenderer.invoke('window:setBounds', bounds),
  restoreDefaultSize: () => electronAPI.ipcRenderer.invoke('window:restore-default-size'),
  
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
