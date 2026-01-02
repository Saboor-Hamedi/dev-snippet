# Zero-Jump Layout & Stability Guide 🚀 (#fucker)

This document serves as the "Source of Truth" for maintaining the Obsidian-like premium editing experience in the DevSnippet editor.

## 1. What NEVER to touch (The "Do Not Touch" List)

If you modify these, the editor will start **JUMPING** or trigger **Measure Loop** errors.

* **Marker Display Strategy**: Never change `.cm-marker-hidden` to `display: none` within the editor classes. Doing so removes the character's width, causing the whole line to shift left/right when the cursor moves.
* **Font Weights & Families**: Do not apply different font families to Source Mode vs. Preview Mode. Differences in character widths (even sub-pixels) between fonts like 'Outfit' and 'Inter' will cause document-wide vibration.
* **Line Heights**: Never use ad-hoc line heights for headers. If H1 is `1.8em`, its line-height must be strictly stabilized (currently `1.6` or fixed `px`).
* **Active Line Borders**: Do not add borders or outlines to `.cm-activeLine` that are larger than `0px`. Even a `1px` border pushes the text inward, causing a horizontal stutter.

---

## 2. Common Errors & How to Fix Them

### ❌ Error: "Measure loop restarted more than 5 times"

* **Why it happens**: CodeMirror applies a decoration -> The browser says "Wait, that changed the height" -> CodeMirror re-measures -> Applies decoration again.
* **The Fix**:
  1. Ensure all Heading levels in `CodeEditor.css` have identical `line-height` and `vertical-align`.
  2. Check `structure.js`: Every line must have **exactly one** `Decoration.line`. Use a `Map` to deduplicate them.
  3. Disable heavy widgets (Mermaid, Tables) in `SOURCE` mode to prevent measurement conflicts.

### ❌ Error: "Cursor jumping horizontally on headers"

* **Why it happens**: The `#` symbols are being hidden/shown, and they take up space.
* **The Fix**:
  1. Use the **Ghost Footprint** (in `CodeEditor.css`): `.cm-marker-hidden { opacity: 0; color: transparent; }`.
  2. Ensure markers have `user-select: none` and `pointer-events: none` so the selection logic ignores them.

### ❌ Error: "Whole editor shifts slightly on mode switch"

* **Why it happens**: The gutter width is changing, or the scroller padding is inconsistent.
* **The Fix**:
  1. Force a fixed gutter anchor: `.cm-gutters { min-width: 48px !important; }`.
  2. Standardize the scroller behavior: `.cm-scroller { scroll-behavior: auto !important; }`.

### ❌ Error: "Active line background bleeds into padding/gutter"

* **Why it happens**: Default CodeMirror styling applies a background color to `.cm-activeLine` which spans the full width of the editor line, including padding and gutter areas.
* **The Fix**:
  1. **Global Variable Reset**: Set `--active-line-bg: transparent` in `:root`.
  2. **Explicit Removal**: Ensure `.cm-activeLine` and `.cm-activeLineGutter` are explicitly set to `transparent !important` to prevent override (or accidental coloring during selection).
  3. **Selection Tightness**: To prevent selection "ghosting" into empty space, remove `padding` from `.cm-content` and manage layout via margins/max-width instead.

### ❌ Error: "Title selection highlights full width block"

* **Why it happens**: CodeMirror's `drawSelection()` is required for custom caret shapes, but it renders selection backgrounds as absolute-positioned blocks that fill the line width (ugly on headers).
* **The Fix (Hybrid Selection Hack)**:
  1. **Enable `drawSelection()`**: Keep it on for custom cursor width/shape.
  2. **The `forceSelection.js` extension**: Create a custom ViewPlugin that applies `Decoration.mark` to selected ranges. This paints selection exactly over the text.
  3. **CSS Masking**: Set `.cm-selectionBackground { display: none !important; }` to hide the blocky layer, while styling `.cm-force-selection` with the user's color.

### ❌ Error: "Caret stays on screen or loses position during zoom"

* **Why it happens**: Global Zoom is applied via CSS variables (`--zoom-level`). CodeMirror's DOM measurements don't automatically update when these CSS variables change, causing the caret to get caught at old pixel offsets.
* **The Fix**:
  1. **Zoom Observer**: Use `useZoomLevel` and `useEditorZoomLevel` hooks in `CodeEditor.jsx`.
  2. **Reactive Measurement**: Use a `useEffect` watching those levels to trigger `view.requestMeasure()`. This forces CodeMirror to recalculate char widths for the new scale.
  3. **Auto-Centering**: Call `view.dispatch({ effects: [EditorView.scrollIntoView(..., {y: 'center'})] })` during zoom to keep the user's context locked.

### 🧪 "Scientist Mode": Removing Transparency & Blur

* **The Goal**: Transition from "Glassmorphism" to a solid, high-contrast, focused aesthetic (ZDR - Zero Distraction Rendering).
* **The Fix Strategy**:
  1. **Foundation**: Update all `variables.css` backgrounds for themes like `glass-blue`, `obsidian`, etc., to use solid Hex or `rgb()` instead of `rgba()`.
  2. **Explicit Enforcement**: In core components like `UniversalModal`, `Prompt`, and `CommandPalette`, use inline `style` with `rgb(var(--color-bg-primary-rgb))` to override any potential theme transparency inheritance.
  3. **Filter Removal**: In `universalStyle.css` and `PinPopover.css`, explicitly set `backdrop-filter: none !important;`.
  4. **Overlay Darkening**: Standardize `universal-modal-overlay` with a solid `rgba(0, 0, 0, 0.9)` to provide absolute focus on the active task.
  5. **Theme Variable Reset**: Convert all legacy `rgba` values in `themes.js` to solid `rgb` to ensure no transparency leaks during theme switching.

### 🧩 Layout Stability: Fixing Jumps & Flickers

* **Header Override Failures**:
  * **Problem**: Custom settings (like `header.bgColor`) were ignored or flickered back to theme defaults.
  * **The Fix**: Use `root.style.setProperty(cssVar, value, 'important')` in `themeOverrides.js`. Theme definitions in `themes.js` use `!important` by default, so user overrides must match that specificity to win.
* **Tooltip Position "Jumping"**:
  * **Problem**: WikiLink tooltips appeared, then immediately "moved up" or flipped as images and Mermaid diagrams finished rendering.
  * **The Fix (Asynchronous Pre-Render)**:
    1. **Wait for Assets**: Inside the `hoverTooltip` async block, scan for `img` tags and wait for `img.onload`.
    2. **Deep Mermaid Pre-render**: Render Mermaid diagrams into a hidden document-attached anchor *before* returning the tooltip object to CodeMirror.
    3. **Deterministic Sizing**: By the time CodeMirror calls `.create()`, the DOM has its final dimensions, allowing the engine to place it perfectly on the first frame.

### ❌ Error: "Inconsistent Header Sizes & Selection Background"

* **Why it happens**: 
  1. **Theme Isolation**: Standard CodeMirror selectors like `.cm-content .cm-h1` are often prioritized differently in Light vs. Dark themes. Light themes (like Polaris) may apply styles successfully while Dark themes might filter out or override `fontSize` in their internal highlighting logic.
  2. **Relative Sizing (em vs. rem)**: Using `em` for headers makes them relative to the theme's base editor font size, causing headers to look different across themes even with the same CSS.
  3. **Selection Height Mismatch**: Browsers often treat `padding` on editor lines as being "outside" the core text selection box. If a header has `padding-top: 0.8em`, the selection background stays tight to the letters while the caret (which follows the line box) looks much taller, causing a vertical mismatch.

* **The Fix**:
  1. **Line-Level Priority**: Apply `fontSize` directly to the **line container** classes (`.cm-line-h1`, `.cm-line-h2`, etc.) in `buildTheme.js`. These are injected by our custom engine (`structure.js`) and bypass the fragile token-based syntax highlighting system.
  2. **Absolute Units**: Use `rem` for all header font sizes to ensure they are identical regardless of theme-specific base font settings.
  3. **Standardized Line-Height**: To make the selection background **perfectly match the caret height**:
     - Set all header line `padding` to `0 !important`.
     - Use `line-height` (e.g., `1.4 !important`) to create the vertical spacing. 
     - Because `line-height` expands the actual text box, both the selection highlight and the caret will naturally adopt the same height.
  4. **CSS Cleanup**: Ensure `CodeEditor.css` does not have any legacy `.cm-line-h* .cm-force-selection` padding rules, as these will manually "stretch" the selection background and break the alignment.

### ❌ Error: "Discard doesn't close tab or Modal re-appears"

* **Why it happens**:
  1. **Async State Drift**: Calling `setIsDirty(false)` right before `onCancel()` can cause the editor to re-render in a "clean" state, which might skip the cleanup logic.
  2. **Window vs Tab mismatch**: The main process native dialog used to handle window close, while the renderer handled tab close, leading to inconsistent UX.
* **The Fix**:
  1. **Unified Flow**: Use a single `handleTriggerCloseCheck` that handles both tab and window closures (via `isWindowClose` flag).
  2. **Intercept Main Close**: Prevent default window close in Main, send `app:request-close` to Renderer, and let the custom `UniversalModal` handle the confirmation.
  3. **Explicit Dirty Reset**: Always `await api.setWindowDirty(false)` before calling `api.closeWindow()` to ensure the Main process allows the exit.
  4. **Ghost Draft Cleanup**: Added logic to `onCloseSnippet` to prune empty or untitled "Draft" snippets that haven't been modified yet.

---

### ❌ Error: "Sidebar items flash or animate on theme switch"

* **Why it happens**:
  1. **Global CSS Conflicts**: Global rules like `button:not(.theme-exempt)` apply styles to all buttons. Sidebar rows are buttons but need to remain transparent.
  2. **Re-triggering Animations**: CSS entrance animations (`animate-in`) with `style={{ animationDelay: ... }}` inside `VirtualList` rows get re-triggered whenever the parent re-renders (like during a theme context update), causing a "wave" effect.
* **The Fix**:
  1. **Class Exemption**: Explicitly add `.theme-exempt` to the sidebar row `className`.
  2. **Animation Removal**: Remove entrance animations from virtualized list rows. They are computationally expensive and visually distracting during state updates.

---

## 3. The "Obsidian Secret" Implementation Details

| Feature | File | Strategy |
| :--- | :--- | :--- |
| **Stability** | `CodeEditor.css` | Fixed `min-width` on gutters; opacity-based hiding. |
| **Solid UI** | `UniversalModal.jsx` | Forced `rgb()` background; no-blur overlay. |
| **Consolidation** | `structure.js` | Single-pass Viewport walking; deduplicated line styles. |
| **Logic** | `index.js` | Mode detection and high-level extension orchestration. |

---

---

## 4. Lifecycle & Interaction Regressions

### ❌ Error: "Dragging files or folders into folders does nothing" (v1.3.1)

*   **Why it happened**: During the "Premium Theme" refactor of `SnippetSidebarRow.jsx`, the `onDragStart` handler was inadvertently removed from the snippet row buttons. While the browser allowed the drag gesture to initiate, no `sourceIds` or `sourceTypes` metadata was being attached to the `dataTransfer` object. Consequently, the folder drop zones (`handleDrop`) received empty data and aborted the move operation silently.
*   **The Fix**:
    1.  **Re-attach `onDragStart`**: Ensured that every draggable element in the sidebar (Snippets, Pinned Snippets, Folders) explicitly calls the `handleDragStart` provided by the logic hook.
    2.  **Metadata Verification**: The `handleDragStart` function was verified to correctly stringify and set `sourceIds` and `sourceTypes` on the event.
    3.  **Visual Feedback**: Restored the `isDragOver` state logic to ensure folders provide visual "Open" or "Glow" cues during a valid drag operation.

*Technical reference for DevSnippet stability. Last updated: January 2, 2026. v1.3.1*
