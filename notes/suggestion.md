# Flow Mode Performance Optimization Proposal

To achieve "Zero-Latency" performance in Flow Mode while maintaining its premium aesthetic, the following technical optimizations are proposed:

## 1. Visual Engine Optimizations (GPU)

* **Layer Isolation**: Apply `will-change: transform, top, left` and `contain: layout paint` to the Flow window. This instructs the browser to promote the window to a separate GPU compositor layer, preventing it from triggering layout calculations for the main application during movement.
* **Motion Decoupling**: During active dragging, the expensive `backdrop-filter: blur()` will be temporarily swapped for a high-performance semi-transparent solid background. This eliminates the heavy pixel-per-pixel blur recalculation while the window is in motion.
* **Frame Optimization**: Force `transition: none !important` on the entire Flow window tree during movement to ensure the window follows the cursor position instantly without "rubber-banding" lag.

## 2. Event & Logic Optimizations (CPU)

* **Interaction Lockdown**: Disable all pointer-events on children inside the Flow window during a drag. This prevents the browser from checking for hover-states and firing script-based listeners while the window is moving.
* **Throttled Rendering**: Implement an adaptive debounce for the preview update.
  * Small Files: Instant Refresh.
  * Large Files (>10k chars): Throttled to 300ms-500ms to prevent CPU saturation.

## 3. Implementation Plan

* Update `universalStyle.css` with layer promotion and motion-aware styling.
* Refine `draggable.js` to handle global state hints for the CSS engine.
* Tune `FlowPreview.jsx` logic to respect file-size based rendering delays.

---

**Goal**: Reduce the performance overhead of Flow Mode by ~70% during active interaction, making the desktop experience feel lightweight and native.

---

# 🚀 DevSnippet Evolution Suggestions (Next Steps)

## 1. Virtualize Editor & Large File Optimization (Priority: P0 - Critical)

* **Why**: Currently, opening files >5MB or 10k lines may cause UI jank.
* **Plan**: Implement viewport-only rendering (virtual windowing) for the editor content. CodeMirror supports this, but we need to tune the `chunk` loading logic to be seamless with our custom markdown parser.

## 2. [x] Workspace Session Restoration (Priority: P1 - High)

* **Why**: Users lose context when closing the app. They have to re-open tabs manually.
* **Plan**: Serialize the state of `openTabs` (file paths, scroll positions, Flow Mode toggle) to `localStorage` or `SQLite` and re-hydrate on launch.

## 3. Git Status Indicators (Priority: P1 - High)

* **Why**: Users need to know if their local changes are synced without opening a terminal.
* **Plan**: Add visual cues (dots/colors) in the Sidebar for 'Modified', 'New', and 'Conflict' states by hooking into a lightweight `git status` check loop.

## 4. "Zen Focus" Dimming Mode (Priority: P2 - Medium)

* **Why**: Enhance the writing experience by reducing visual noise.
* **Plan**: Add a toggle that opacity-fades the sidebar, header, and non-active lines in the editor (focusing only on the current paragraph).

## 5. Smart Tag Autocomplete (Priority: P2 - Medium)

* **Why**: Tagging is powerful but hard to remember.
* **Plan**: Create a background indexer that scans all `#tags` in the workspace and offers them as autocomplete suggestions when typing `#`.

## 6. PDF & HTML Export (Priority: P2 - Medium)

* **Why**: Sharing content with non-users is currently difficult (copy-paste only).
* **Plan**: Implement a "Print/Export" feature that generates a styled PDF or a standalone HTML file with the current theme CSS inlined.

## 7. Multi-Cursor & Block Selection Polish (Priority: P2 - Medium)

* **Why**: Power users rely on `Alt+Click`. Ensure our custom widgets (like Tables/Mermaid) don't break when edited by multiple cursors simultaneously.
* **Plan**: rigorous testing suite for multi-cursor edge cases and disabling complex widgets during multi-cursor active states.

## 8. Integrated Command Palette Visuals (Priority: P2 - Medium)

* **Why**: The current generic `Ctrl+P` is functional but basic.
* **Plan**: Redesign the Command Palette to look like `VS Code` or `Raycast`, grouping commands by category (Editor, Git, System) with icon support.

## 9. Custom Theme Builder UI (Priority: P3 - Low)

* **Why**: Users love personalization beyond just "Dark/Light".
* **Plan**: A settings UI that lets users define: Accent Color, Background Color, and Font Face, saving to a `custom-theme.json`.

## 10. Plugin Architecture Prep (Priority: P3 - Low)

* **Why**: Future-proofing for community extensions.
* **Plan**: Refactor the `useSnippetData` and `Editor` hooks to expose a global `API` object, allowing potential future JS plugins to register commands or sidebar views safely.

---

## ✅ SOLVED: Hybrid Selection System (Custom Cursor + Text-Only Selection)

### The Challenge

We faced a seemingly impossible requirement:

1. **Custom cursor shapes** (block, underline) with configurable width from `settings.json`
2. **Text-only selection highlighting** (no full-width blocks on headers/paragraphs)

These requirements were mutually exclusive in CodeMirror 6:

* Enabling `drawSelection` → Custom cursors ✅ but full-width selection ❌
* Disabling `drawSelection` → Text-only selection ✅ but native bar cursor only ❌
* Hiding selection layer + forcing native `::selection` → Transparent/invisible selection ❌

### The Solution: 3-Part Hybrid System

#### Part 1: Custom Extension (`forceSelection.js`)

Created a CodeMirror ViewPlugin that uses **Decoration.mark** to manually highlight selected text:

* Listens to selection changes via `update()` lifecycle
* Applies `.cm-force-selection` class to selected text ranges
* Decorations wrap only the text (not full line width)

```javascript
const selectionMark = Decoration.mark({ class: 'cm-force-selection' })
// Applied to selection ranges in getDecorations()
```

#### Part 2: Extension Integration (`buildExtensions.js`)

Both extensions work together:

```javascript
exts.push(drawSelection({ cursorBlinkRate: 0 }))  // Custom cursor
exts.push(forceSelection())                         // Text-only highlight
```

#### Part 3: CSS Layer (`CodeEditor.css`)

Three critical CSS rules:

1. **Hide CM's selection background**: `.cm-selectionBackground { display: none }`
2. **Force text selectability**: `user-select: text !important`
3. **Style our decoration**: `.cm-force-selection` with `--cursor-selection-bg` variable

### Result

* ✅ Custom cursor width/shape from settings
* ✅ Text-only selection (no full-width blocks)
* ✅ Visible, colored selection using user's configured color
* ✅ No transparency issues
* ✅ No performance impact

### Files Modified

* `src/renderer/src/components/CodeEditor/extensions/forceSelection.js` (NEW)
* `src/renderer/src/components/CodeEditor/extensions/buildExtensions.js`
* `src/renderer/src/components/CodeEditor/CodeEditor.css`
* `src/renderer/src/components/CodeEditor/extensions/buildTheme.js`
* `src/renderer/src/components/CodeEditor/CodeEditor.jsx`
* `src/renderer/src/hook/settings/useCursorProp.js`

### Key Insight

CodeMirror's Decoration API allows us to bypass both native selection and CM's built-in selection layer, giving us pixel-perfect control over what gets highlighted and how.
