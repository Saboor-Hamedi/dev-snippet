# dev-snippet

dev-snippet is a desktop application built with Electron and React for creating, editing, and managing code/text snippets. It features a CodeMirror-based editor with syntax highlighting, markdown preview, autosave functionality, and SQLite storage. The app provides a clean, frameless window with custom controls and supports building native installers for Windows, macOS, and Linux.

This README explains how the project works, how to develop and build it, the architecture behind it, useful keyboard shortcuts, and troubleshooting tips for common issues.

**Friendly note:** this README is written to be published on a website. If you'd like shorter or localized versions, tell me which sections to trim or translate.

**Table of contents**
- **Getting started** (dev & build)
- **Development Commands**
- **How the app works (architecture)**
- **Keyboard shortcuts**
- **Icons & Packaging**
- **Development workflow & tooling**
- **Where to make common changes**
- **Troubleshooting**
- **File Locations**

---

**Getting started**

Prerequisites
- Node.js 18+ (LTS recommended)
- npm (or your package manager of choice)
- On macOS: Xcode command line tools (for packaging)

Install dependencies (this automatically runs `electron-rebuild` for better-sqlite3):

```bash
npm install
```

Run in development mode with hot reload:

```bash
npm run dev
```

Build the application (compiles with electron-vite):

```bash
npm run build
```

---

**Development Commands**

Core Development
```bash
# Run in development mode (hot reload enabled)
npm run dev

# Build the application (compiles with electron-vite)
npm run build
```

Testing
```bash
# Run tests with Vitest
npm test

# Run tests with UI
npm test:ui
```

Code Quality
```bash
# Lint code with ESLint
npm run lint

# Format code with Prettier
npm run format
```

Native Module Rebuild
```bash
# Rebuild native modules (e.g., better-sqlite3) if installation fails
npm run rebuild
```

Building Distributables
```bash
# Build for Windows (produces NSIS installer)
npm run build:win

# Build for macOS (run on macOS only)
npm run build:mac

# Build for Linux (AppImage, snap, deb)
npm run build:linux

# Build unpacked (for testing)
npm run build:unpack
```

Icon Generation
```bash
# Generate platform-specific icons from source PNG (requires 1024x1024 PNG)
npm run make:icons
```

Build notes: the build scripts run the Vite build for the renderer and then run `electron-builder` to produce platform installers. See `package.json` scripts.

---

**Icons & Packaging**

- During development, the window uses a platform-appropriate icon (`resources/icon.ico` on Windows and `renderer/public/icon.png` on other platforms).
- OS-level icons (Start menu, pinned shortcuts, installer exe, .app bundle) are embedded at packaging time.
- `electron-builder` is configured to use resources from the `build/` folder (see `electron-builder.yml`).

To generate icons from a high-resolution source PNG (recommended 1024×1024):

```bash
npm run make:icons
```

This runs `npx electron-icon-maker --input src/renderer/public/icon.png --output build` and produces `build/icon.ico` and `build/icon.icns`. After packaging, the installers will show your custom icon.

If you want the dev BrowserWindow to display the custom Windows icon immediately, copy `build/icon.ico` to `resources/icon.ico` and restart `npm run dev`.

---

**Development workflow & tooling**

- Linting & formatting: Prettier and ESLint are recommended in your editor.
- Native modules: `better-sqlite3` is used in the main process. After `npm install`, we run `electron-rebuild` in `postinstall` (see `package.json`). If you encounter native build issues, run:

```bash
npm run rebuild
```

---

**How the app works (architecture)**

Electron Multi-Process Architecture

This application follows the standard Electron multi-process model:

Main Process (`src/main/index.js`)
- Creates and manages the BrowserWindow with frameless design for custom window controls
- Initializes SQLite database (`snippets.db`) in userData directory using better-sqlite3
- Exposes IPC handlers for:
  - File system operations (read, write, dialogs)
  - Database CRUD operations (snippets, settings, themes)
  - Window controls (minimize, maximize, close, custom resize)
  - Settings file management with live watching
- Handles platform-specific icon selection (`.ico` on Windows, `.png` elsewhere)
- **Note:** DevTools are controlled by `ENABLE_DEVTOOLS` constant (line 2 of main process)

Preload Script (`src/preload/index.js`)
- Bridges main and renderer processes with context isolation
- Exposes safe API to renderer via `contextBridge`:
  - `window.api.*` - IPC invocations for DB, file system, dialogs
  - `window.electron.*` - Electron toolkit utilities
  - `window.api.onSettingsChanged` - Event listener for external settings changes

Renderer Process (`src/renderer/src`)
- React application built with Vite
- Single-page application with view-based navigation
- Key folders:
  - `components/` — UI components (editor, modals, settings)
  - `hook/` — custom hooks (`useSnippetData`, `useToast`, `useKeyboardShortcuts`)
  - `utils/` — utilities like `ToastNotification`

Key Component Hierarchy
```
App.jsx (SettingsProvider)
  └── SnippetLibrary.jsx (Main orchestrator)
      ├── Workbench.jsx (View container)
      │   ├── Header.jsx (Title bar with window controls)
      │   ├── SnippetEditor.jsx (Code editing view)
      │   │   ├── AdvancedSplitPane.jsx
      │   │   │   ├── CodeEditor.jsx (CodeMirror wrapper)
      │   │   │   └── LivePreview.jsx (Markdown rendering)
      │   │   ├── StatusBar.jsx
      │   │   └── NamePrompt.jsx (Save dialog)
      │   ├── WelcomePage.jsx
      │   └── SettingsModal.jsx
      ├── CommandPalette.jsx (Cmd/Ctrl+P)
      ├── RenameModal.jsx
      └── DeleteModel.jsx
```

Data Flow Pattern

1. **Loading Data:**
   - `useSnippetData` hook fetches snippets from main process via IPC on mount
   - Data flows: SQLite DB → Main Process → IPC → Renderer State

2. **Saving Data:**
   - User edits trigger debounced autosave (5 seconds)
   - Manual save via Ctrl+S bypasses debounce
   - Data flows: Renderer State → IPC → Main Process → SQLite DB
   - Local state updated immediately to prevent flicker

3. **Settings Management:**
   - Settings stored in two places:
     - `settings.json` in userData (for persistence and external editing)
     - SQLite DB `settings` table (legacy)
   - `SettingsProvider` context provides global settings access
   - File watcher in main process detects external changes and broadcasts to renderer

Database Schema (SQLite via better-sqlite3)

**snippets Table:**
- `id` (TEXT, PK) - Timestamp-based unique ID
- `title` (TEXT) - Snippet name with extension
- `code` (TEXT) - Saved content
- `code_draft` (TEXT) - Unsaved draft content (for autosave)
- `language` (TEXT) - Syntax highlighting language key
- `timestamp` (INTEGER) - Creation/modification time
- `type` (TEXT) - Always 'snippet'
- `tags` (TEXT) - Auto-extracted from content
- `is_draft` (INTEGER) - Boolean flag for unsaved snippets
- `sort_index` (INTEGER) - User-defined sort order

**settings Table:**
- `key` (TEXT, PK)
- `value` (TEXT)

**theme Table:**
- `id` (TEXT, PK)
- `name` (TEXT)
- `colors` (TEXT) - JSON string

CodeMirror Editor Integration

The editor (`src/renderer/src/components/CodeEditor/CodeEditor.jsx`) wraps `@uiw/react-codemirror` with:
- **Extensions loaded dynamically** from `extensions/buildExtensions.js`:
  - Language support (via `languageRegistry.js`)
  - Theme (dark/light mode aware)
  - Zoom controls (Ctrl+MouseWheel, Ctrl+Plus/Minus)
  - Word wrap configuration
  - Custom keymaps
- **Language detection:**
  - Based on file extension in title
  - Fallback to 'text' if unknown
  - See `src/renderer/src/components/language/languageRegistry.js`

Autosave Mechanism
1. Debounced 5-second timer starts on any code change
2. `onAutosave` callback notifies parent of status: `'pending'` → `'saving'` → `'saved'`
3. Cancellation via global map `window.__autosaveCancel` (keyed by snippet ID)
4. Autosave disabled if:
   - Snippet is being deleted (`isDeletingRef`)
   - Snippet has no title (drafts)
   - User toggled autosave off in settings

---

**Keyboard shortcuts**

The app provides global keyboard shortcuts managed by the `useKeyboardShortcuts` hook. These shortcuts are intentionally conservative to avoid interfering when typing in inputs:

- **Escape** - Close modals/command palette (doesn't close editor)
- **Ctrl/Cmd + N** - Create new snippet
- **Ctrl/Cmd + S** - Save snippet (opens name prompt if untitled)
- **Ctrl/Cmd + P** - Toggle command palette
- **Ctrl/Cmd + R** - Rename selected snippet
- **Ctrl/Cmd + Delete** - Delete selected snippet
- **Ctrl/Cmd + Shift + W** - Close editor/go to welcome
- **Ctrl/Cmd + Shift + C** - Copy snippet code to clipboard
- **Ctrl/Cmd + Shift + R** - Restore default window size (in App.jsx)
- **Ctrl + MouseWheel** - Zoom in/out (in editor)

---

**Where to make common changes**

Adding a New IPC Handler

1. **Main process** (`src/main/index.js`):
```js
ipcMain.handle('my:action', async (event, arg) => {
  // Your logic here
  return result
})
```

2. **Preload** (`src/preload/index.js`):
```js
const api = {
  myAction: (arg) => electronAPI.ipcRenderer.invoke('my:action', arg),
  // ...
}
```

3. **Renderer** (any component):
```js
const result = await window.api.myAction(arg)
```

Adding a New Language

Edit `src/renderer/src/components/language/languageRegistry.js`:
```js
export const EditorLanguages = {
  mylang: {
    name: 'My Language',
    extensions: ['ml', 'mylang'],
    loader: async () => {
      const { myLang } = await import('@codemirror/lang-mylang')
      return myLang()
    }
  },
  // ...
}
```

Adding a Global Keyboard Shortcut

1. In `SnippetLibrary.jsx`:
```js
useKeyboardShortcuts({
  onMyAction: () => {
    // Your action logic
  },
  // ...
})
```

2. Then implement in `src/renderer/src/hook/useKeyboardShortcuts.js`:
```js
if (isMod && e.key === 'x') {
  e.preventDefault()
  callbacks.onMyAction?.()
}
```

---

**Troubleshooting**

1. **DevTools Toggle**
   - DevTools are controlled by `ENABLE_DEVTOOLS` constant in `src/main/index.js` (line 2)
   - Set to `true` for development, `false` for production builds

2. **Icon Display Issues**
   - Development: Icons loaded from `resources/` folder
   - Production: Icons embedded from `build/` folder during packaging
   - Use `npm run make:icons` to generate from `src/renderer/public/icon.png`

3. **Native Module Errors**
   - Symptom: "better-sqlite3 module not found" or segfault
   - Fix: Run `npm run rebuild` to recompile for current Electron version
   - Ensure you're not running dev mode with wrong architecture (x64 vs arm64)
   - **Important:** better-sqlite3 is externalized in `electron.vite.config.mjs` and unpacked in ASAR (see `electron-builder.yml`)

4. **IPC Communication**
   - Always use `invoke/handle` pattern, never `send/on` for request-response
   - Main process handlers return values synchronously or as promises
   - Never expose Node.js APIs directly to renderer

5. **State Sync Issues**
   - Snippets list updated immediately after save to prevent UI flicker
   - Use `skipSelectedUpdate` option in `saveSnippet` if you don't want to refresh `selectedSnippet`
   - Deleted snippet IDs stored temporarily in `window.__deletedIds` to prevent autosave race conditions

6. **Draft vs. Saved Snippets**
   - **Draft:** `is_draft = true`, no title or unsaved changes
   - **Saved:** `is_draft = false`, has title, persisted to DB
   - Draft content stored in `code_draft` column until committed

---

**File Locations**

On Windows:
- **Database:** `%APPDATA%\dev-snippet\snippets.db`
- **Settings:** `%APPDATA%\dev-snippet\settings.json`
- **User data:** Retrieved via `app.getPath('userData')` in main process

Build Outputs:
- **Build output:** `out/` (after `npm run build`)
- **Distributable:** `dist/` (after `npm run build:win`)

Configuration Files:
- `electron.vite.config.mjs` - Vite configuration for main, preload, renderer
- `electron-builder.yml` - Packaging configuration (NSIS, DMG, AppImage)
- `eslint.config.mjs` - Flat ESLint config with React plugins
- `vitest.config.js` - Test configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.prettierrc.yaml` - Prettier formatting rules
