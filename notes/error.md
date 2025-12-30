# Zero-Jump Layout & Stability Guide 🚀 (#fucker)

This document serves as the "Source of Truth" for maintaining the Obsidian-like premium editing experience in the DevSnippet editor.

## 1. What NEVER to touch (The "Do Not Touch" List)

If you modify these, the editor will start **JUMPING** or trigger **Measure Loop** errors.

*   **Marker Display Strategy**: Never change `.cm-marker-hidden` to `display: none` within the editor classes. Doing so removes the character's width, causing the whole line to shift left/right when the cursor moves.
*   **Font Weights & Families**: Do not apply different font families to Source Mode vs. Preview Mode. Differences in character widths (even sub-pixels) between fonts like 'Outfit' and 'Inter' will cause document-wide vibration.
*   **Line Heights**: Never use ad-hoc line heights for headers. If H1 is `1.8em`, its line-height must be strictly stabilized (currently `1.6` or fixed `px`).
*   **Active Line Borders**: Do not add borders or outlines to `.cm-activeLine` that are larger than `0px`. Even a `1px` border pushes the text inward, causing a horizontal stutter.

---

## 2. Common Errors & How to Fix Them

### ❌ Error: "Measure loop restarted more than 5 times"
*   **Why it happens**: CodeMirror applies a decoration -> The browser says "Wait, that changed the height" -> CodeMirror re-measures -> Applies decoration again.
*   **The Fix**: 
    1.  Ensure all Heading levels in `CodeEditor.css` have identical `line-height` and `vertical-align`.
    2.  Check `structure.js`: Every line must have **exactly one** `Decoration.line`. Use a `Map` to deduplicate them.
    3.  Disable heavy widgets (Mermaid, Tables) in `SOURCE` mode to prevent measurement conflicts.

### ❌ Error: "Cursor jumping horizontally on headers"
*   **Why it happens**: The `#` symbols are being hidden/shown, and they take up space.
*   **The Fix**: 
    1.  Use the **Ghost Footprint** (in `CodeEditor.css`): `.cm-marker-hidden { opacity: 0; color: transparent; }`.
    2.  Ensure markers have `user-select: none` and `pointer-events: none` so the selection logic ignores them.

### ❌ Error: "Whole editor shifts slightly on mode switch"
*   **Why it happens**: The gutter width is changing, or the scroller padding is inconsistent.
*   **The Fix**: 
    1.  Force a fixed gutter anchor: `.cm-gutters { min-width: 48px !important; }`.
    2.  Standardize the scroller behavior: `.cm-scroller { scroll-behavior: auto !important; }`.

---

## 3. The "Obsidian Secret" Implementation Details

| Feature | File | Strategy |
| :--- | :--- | :--- |
| **Stability** | `CodeEditor.css` | Fixed `min-width` on gutters; opacity-based hiding. |
| **Consolidation** | `structure.js` | Single-pass Viewport walking; deduplicated line styles. |
| **Logic** | `index.js` | Mode detection and high-level extension orchestration. |

---
*Technical reference for DevSnippet stability. Do not deviate from these rules unless you are prepared for layout shudders.*
