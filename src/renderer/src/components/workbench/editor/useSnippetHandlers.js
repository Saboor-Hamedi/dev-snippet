import { useCallback } from 'react'

export const useSnippetHandlers = ({
  operations,
  snippetData,
  viewContext,
  modalContext,
  settingsContext,
  toastContext,
  themeContext,
  authContext // if any
}) => {
  const {
    saveSnippet,
    handleSelectSnippet,
    handleSearchSnippets,
    handlePing,
    createDraftSnippet,
    setIsCreatingSnippet,
    dirtySnippetIds
  } = operations

  const { snippets, setSelectedSnippet, setSnippets, deleteItem, deleteFolder, saveFolder } = snippetData
  const { navigateTo, togglePreview, activeView } = viewContext
  const { openRenameModal, openSettingsModal, openAIPilot, openImageExportModal } = modalContext
  const { settings, updateSetting } = settingsContext
  const { showToast } = toastContext
  const { setTheme } = themeContext

  const onCommandNew = useCallback(() => {
    // Logic for new snippet
    const parentId = null // or get from selection
    window.dispatchEvent(
      new CustomEvent('app:sidebar-start-creation', { detail: { type: 'snippet', parentId } })
    )
  }, [])

  const onCommandTheme = useCallback(() => {
    const current = settings?.theme || 'polaris'
    const next = current === 'polaris' ? 'midnight-pro' : 'polaris'
    setTheme(next)
    showToast(`Theme switched to ${next === 'polaris' ? 'Light' : 'Dark'}`, 'info')
  }, [settings?.theme, setTheme, showToast])

  const onCommandSidebar = useCallback(() => {
    const current = settings?.sidebar?.visible !== false
    updateSetting('sidebar.visible', !current)
  }, [settings?.sidebar?.visible, updateSetting])

  const onCommandPreview = useCallback(() => togglePreview(), [togglePreview])

  const onCommandSettings = useCallback((e) => {
    const params = e.detail || {}
    navigateTo('settings', params)
  }, [navigateTo])

  const onCommandAIPilot = useCallback(() => openAIPilot(), [openAIPilot])

  return {
    onCommandNew,
    onCommandTheme,
    onCommandSidebar,
    onCommandPreview,
    onCommandSettings,
    onCommandAIPilot
    // ... add all other handlers here
  }
}
