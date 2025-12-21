// visualLineGutter.js
// This module previously provided a CodeMirror gutter extension that
// displayed visual line numbers for wrapped lines. It has been disabled
// because the measurement logic interacts with CodeMirror's DOM lifecycle
// and can trigger internal errors (tiles/DOM observer crashes) when the
// editor is updating rapidly (paste/scroll large documents).

// Keep a no-op export so imports remain valid. If you want to re-enable
// the visual-line gutter, restore the implementation in
// `useVisualLineNumberMarker.js` and return that extension here.
export function useVisualLineNumberGutter() {
  return []
}
