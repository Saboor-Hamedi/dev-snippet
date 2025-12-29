// Command Palette entry for Word export
export const wordExportCommand = {
  id: 'cmd-export-word',
  title: 'Export All to Word',
  icon: 'FileWord',
  description: 'Generate a professional Word document of all snippets',
  action: () => window.api.invoke('export:word')
}
