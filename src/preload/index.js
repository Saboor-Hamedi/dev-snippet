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
  // Database
  getSnippets: () => electronAPI.ipcRenderer.invoke('db:getSnippets'),
  saveSnippet: (snippet) => electronAPI.ipcRenderer.invoke('db:saveSnippet', snippet),
  deleteSnippet: (id) => electronAPI.ipcRenderer.invoke('db:deleteSnippet', id),
  getProjects: () => electronAPI.ipcRenderer.invoke('db:getProjects'),
  saveProject: (project) => electronAPI.ipcRenderer.invoke('db:saveProject', project),
  deleteProject: (id) => electronAPI.ipcRenderer.invoke('db:deleteProject', id),
  getSetting: (key) => electronAPI.ipcRenderer.invoke('db:getSetting', key),
  saveSetting: (key, value) => electronAPI.ipcRenderer.invoke('db:saveSetting', key, value)
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
