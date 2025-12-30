import { EditorView } from '@codemirror/view'

/**
 * Handles asset saving.
 * Checks for images, saves them via IPC, and inserts markdown syntax.
 *
 * @param {File} file - The file object from clipboard or dragdrop
 * @param {EditorView} view - The CodeMirror instance
 * @param {number} pos - The position to insert the markdown
 */
const handleFile = async (file, view, pos) => {
  if (!file || !file.type.startsWith('image/')) return false

  // Basic "Working..." UI feedback could go here, but for now we rely on speed.

  try {
    const buffer = await file.arrayBuffer()
    // Generate filename: image-TIMESTAMP.ext
    // Use original name but sanitize, or timestamp? Timestamp is safer for duplicates.
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `img-${Date.now()}.${ext}`

    // Call Main Process to save
    const assetPath = await window.api.saveAsset(fileName, buffer)

    if (assetPath) {
      const insertText = `![Image](${assetPath})`

      const transaction = view.state.update({
        changes: {
          from: pos,
          insert: insertText
        }
      })
      view.dispatch(transaction)
      return true
    }
  } catch (err) {
    console.error('Asset save failed:', err)
  }
  return false
}

export const assetExtensions = EditorView.domEventHandlers({
  paste(event, view) {
    // Check if clipboard has files
    const files = event.clipboardData?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        event.preventDefault()
        const pos = view.state.selection.main.head
        handleFile(file, view, pos)
        return true
      }
    }
    return false
  },
  drop(event, view) {
    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        event.preventDefault()
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
        if (pos !== null) {
          handleFile(file, view, pos)
          return true
        }
      }
    }
    return false
  }
})
