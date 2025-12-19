// useVisualLineNumberMarker.js
// Build visual-line numbering gutter using modules provided by the caller.
// This avoids bundling/importing separate CodeMirror instances.
// useVisualLineNumberMarker.js
// The original implementation attempted to compute visual line counts
// (for wrapped lines) and supply a gutter that shows multiple numbers per
// logical line. That logic proved fragile with CodeMirror's DOM/tiles
// lifecycle and could throw inside internal DOMObserver/DocView code
// (see "No tile at position" / "tile of undefined" errors).

// To avoid runtime crashes while keeping imports stable, export a
// no-op that returns an empty extension list. Re-enable only after
// implementing a safe measurement strategy (e.g., offscreen measurement
// or using CodeMirror APIs that avoid touching tiles during DOM flush).
export function useVisualLineNumberMarker(/* viewModule */) {
  return []
}
