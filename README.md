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

- Main process: `src/main/index.js` — creates BrowserWindow, registers IPC handlers for file dialogs and database access, and initializes a small SQLite DB (`snippets.db`) stored in the user's appData (`app.getPath('userData')`). The window icon is chosen per-platform in `createWindow()`.
- Preload: `src/preload/index.js` — exposes a small safe API to the renderer for IPC operations (open file, read/write, DB RPC).
- Renderer: `src/renderer/src` — React app built with Vite. Key folders:
  - `components/` — UI components (Workbench, SnippetEditor, SnippetLibrary, StatusBar, SettingsPanel, modal dialogs, etc.)
  - `hook/` — custom hooks (`useSnippetData`, `useToast`, `useKeyboardShortcuts`, etc.)
  - `utils/` — small utilities such as `ToastNotification`

Data flow summary:

- `SnippetLibrary` is the top-level view manager: it holds active view state (`snippets`, `editor`, `settings`, `welcome`) and orchestrates opening the editor, creating drafts, and showing modals.
- `SnippetEditor` renders the editor and live preview. It contains an autosave timer, a `textareaRef` and focuses the editor reliably when a snippet is opened or created.
- Database access (CRUD for snippets and settings) is performed in the main process via better-sqlite3 and exposed to the renderer by IPC handlers.

---

**Keyboard shortcuts & focus behavior**

The app provides global keyboard shortcuts that are intentionally conservative (they avoid interfering when typing in inputs):

- Escape — close modals (rename/delete/command palette) or cancel editor
- Ctrl/Cmd + N — Create a new snippet (opens editor in create mode). The editor `textarea` is focused by `SnippetEditor`'s `textareaRef` effects.
- Ctrl/Cmd + R — Open Rename modal for the selected snippet
- Ctrl/Cmd + Delete — Open Delete confirmation for selected snippet
- Ctrl/Cmd + S — Save (opens save/name prompt when needed)
- Ctrl/Cmd + P — Toggle Command Palette
- Ctrl/Cmd + Shift + W — Go to Welcome page
- Ctrl/Cmd + Shift + C — Copy selected snippet's code to clipboard

Implementation notes:

- Global shortcuts are implemented in `src/renderer/src/hook/useKeyboardShortcuts.js`. The hook ignores shortcuts while an editable field (input/textarea/contenteditable) has focus — except Escape which always works — so typing is never interrupted.
- The editor focus is handled by React refs inside `SnippetEditor.jsx` rather than ad-hoc DOM queries; this makes Ctrl+N focus reliable.

---

**Where to make common changes**

- Change DB schema: `src/main/index.js` sets up the SQLite DB and runs simple migrations. Be careful when changing columns; add a migration block in `initDB()`.
- Change keyboard shortcuts: `src/renderer/src/hook/useKeyboardShortcuts.js`.
- Change editor UI or behavior: `src/renderer/src/components/SnippetEditor.jsx`.
- Change top-level view flow (open/close settings): `src/renderer/src/components/SnippetLibrary.jsx` and `src/renderer/src/components/workbench/Workbench.jsx`.
- Toasts: `src/renderer/src/hook/useToast.js` and `src/renderer/src/utils/ToastNotification.jsx`.

---

**Troubleshooting & tips**

- If the dev window still shows the Electron icon: packaging is required to replace OS-level icons; copy `build/icon.ico` → `resources/icon.ico` for immediate dev-window changes and restart `npm run dev`.
- If you see `The symbol 'join' has already been declared` during build: there's a duplicate import in `src/main/index.js`. Keep a single `import { join } from 'path'` at the top of the file.
- Native modules (e.g. better-sqlite3) may need rebuilding after Node or Electron version changes: run `npm run rebuild`.
- If global shortcuts don't fire while typing: that is intentional — the shortcuts ignore editable elements to avoid interrupting input. If you want a shortcut to work inside an input, update the hook but be cautious.

---

**Contributing**

Pull requests are welcome. Keep changes small and focused. Follow these guidelines:

- Run `npm run lint` and `npm run format` before committing.
- If adding UI, include screenshots or a short GIF in the PR description.
- If changing DB schema, include migration code in `initDB()`.

---

**License & authorship**

**License**

- **License:** This project is licensed under the MIT License. See the `LICENSE` file for details.
- **Badge:** [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
