import { useEffect } from 'react'

export const useGlobalCommands = ({
  handlers,
  dependencies
}) => {
  const {
    onCommandNew,
    onBulkDelete,
    onCommandTheme,
    onCommandSidebar,
    onCommandPreview,
    onCommandSettings,
    onCommandJsonEditor,
    onCommandDefaultSettingsEditor,
    onCommandSyncCenter,
    onCommandActivityBar,
    onCommandZen,
    onCommandZenFocus,
    onCommandReset,
    onCommandCopyImage,
    onCommandOverlay,
    onCommandExportPDF,
    onCommandStatusBar,
    onCommandHeader,
    onResetWindow,
    onCommandFavorite,
    onCommandPing,
    onCommandAIPilot,
    onOpenSnippet
  } = handlers

  useEffect(() => {
    window.addEventListener('app:command-new-snippet', onCommandNew)
    window.addEventListener('app:command-bulk-delete', onBulkDelete)
    window.addEventListener('app:toggle-theme', onCommandTheme)
    window.addEventListener('app:toggle-sidebar', onCommandSidebar)
    window.addEventListener('app:toggle-preview', onCommandPreview)
    window.addEventListener('app:open-settings', onCommandSettings)
    window.addEventListener('app:open-json-editor', onCommandJsonEditor)
    window.addEventListener('app:open-default-settings-editor', onCommandDefaultSettingsEditor)
    window.addEventListener('app:open-sync-center', onCommandSyncCenter)
    window.addEventListener('app:toggle-activity-bar', onCommandActivityBar)
    window.addEventListener('app:toggle-zen', onCommandZen)
    window.addEventListener('app:toggle-zen-focus', onCommandZenFocus)
    window.addEventListener('app:reset-layout', onCommandReset)
    window.addEventListener('app:command-copy-image', onCommandCopyImage)
    window.addEventListener('app:toggle-overlay', onCommandOverlay)
    window.addEventListener('app:export-pdf', onCommandExportPDF)
    window.addEventListener('app:toggle-status-bar', onCommandStatusBar)
    window.addEventListener('app:toggle-header', onCommandHeader)
    window.addEventListener('app:reset-window', onResetWindow)
    window.addEventListener('app:toggle-favorite', onCommandFavorite)
    window.addEventListener('app:ping-snippet', onCommandPing)
    window.addEventListener('app:toggle-ai-pilot', onCommandAIPilot)
    window.addEventListener('app:open-snippet', onOpenSnippet)

    return () => {
      window.removeEventListener('app:open-snippet', onOpenSnippet)
      window.removeEventListener('app:command-new-snippet', onCommandNew)
      window.removeEventListener('app:command-bulk-delete', onBulkDelete)
      window.removeEventListener('app:toggle-theme', onCommandTheme)
      window.removeEventListener('app:toggle-sidebar', onCommandSidebar)
      window.removeEventListener('app:toggle-preview', onCommandPreview)
      window.removeEventListener('app:open-settings', onCommandSettings)
      window.removeEventListener('app:open-json-editor', onCommandJsonEditor)
      window.removeEventListener('app:open-default-settings-editor', onCommandDefaultSettingsEditor)
      window.removeEventListener('app:open-sync-center', onCommandSyncCenter)
      window.removeEventListener('app:toggle-activity-bar', onCommandActivityBar)
      window.removeEventListener('app:toggle-zen', onCommandZen)
      window.removeEventListener('app:toggle-zen-focus', onCommandZenFocus)
      window.removeEventListener('app:reset-layout', onCommandReset)
      window.removeEventListener('app:command-copy-image', onCommandCopyImage)
      window.removeEventListener('app:toggle-overlay', onCommandOverlay)
      window.removeEventListener('app:export-pdf', onCommandExportPDF)
      window.removeEventListener('app:toggle-status-bar', onCommandStatusBar)
      window.removeEventListener('app:toggle-header', onCommandHeader)
      window.removeEventListener('app:reset-window', onResetWindow)
      window.removeEventListener('app:toggle-favorite', onCommandFavorite)
      window.removeEventListener('app:ping-snippet', onCommandPing)
      window.removeEventListener('app:toggle-ai-pilot', onCommandAIPilot)
    }
  }, dependencies)
}
