## Quick Context

- Project: Electron + React (Vite) desktop app for managing code snippets.
- Processes: `main` (Electron Node), `preload` (contextBridge), `renderer` (React/Vite).
- Key paths: `src/main/index.js`, `src/preload/index.js`, `src/renderer/src`, `electron.vite.config.mjs`, `electron-builder.yml`, `package.json`.

## Big-picture architecture (what you need to know)

- Main process (`src/main/index.js`): creates BrowserWindow, initializes SQLite (`better-sqlite3`), registers IPC handlers with `ipcMain.handle(...)`, watches `settings.json`, and selects platform icons.
- Preload (`src/preload/index.js`): exposes safe methods on `window.api` via `contextBridge` — use `window.api.*` in renderer for actions like DB access, file I/O, dialogs and window controls.
- Renderer (`src/renderer/src`): React SPA. Components under `components/`, hooks in `hook/`, and utilities in `utils/`. `App.jsx` wraps `SettingsProvider` and mounts `SnippetLibrary`.

## Developer workflows & commands (explicit)

- Dev: `npm run dev` — electron-vite hot reload for renderer + main.
- Build: `npm run build` then packaging via `electron-builder` (see `npm run build:win|mac|linux`).
- Tests: `npm test` (Vitest). UI tests: `npm run test:ui`.
- Native modules: `better-sqlite3` is rebuilt via `postinstall` and `npm run rebuild` if needed.
- Generate icons: `npm run make:icons` (source: `src/renderer/public/icon.png`).

## Project-specific conventions & patterns

- IPC pattern: always use `ipcMain.handle` in main and `window.api.method()` in renderer (invoke/handle). Avoid exposing raw Node APIs to renderer.
- Debounced autosave: editor changes use a 5s debounce; manual save via Ctrl/Cmd+S bypasses debounce. Draft content stored in `code_draft`.
- Snippet model: `snippets` table includes `id, title, code, code_draft, language, timestamp, type, tags, is_draft, sort_index`.
- Settings: stored in `settings.json` under `app.getPath('userData')` and watched by main. Renderer listens for `settings:changed` events.
- DevTools toggle: controlled by `ENABLE_DEVTOOLS` in `src/main/index.js` — flip for production.
- Packaging: `asar` is enabled and native modules are added to `asarUnpack` (`**/*.node`).

## Integration points & examples (copyable)

- Add an IPC handler (main):

```js
ipcMain.handle('my:action', async (event, arg) => {
  /* ... */
})
```

- Expose via preload:

```js
contextBridge.exposeInMainWorld('api', { myAction: (arg) => ipcRenderer.invoke('my:action', arg) })
```

- Use in renderer:

```js
const result = await window.api.myAction(payload)
```

- Existing IPC examples to reference: `fs:readFile`, `fs:writeFile`, `dialog:openFile`, `window:minimize`, `window:toggle-maximize`, `settings:changed`.

## Editor & language extension patterns

- CodeMirror is wrapped at `src/renderer/src/components/CodeEditor/CodeEditor.jsx` using `@uiw/react-codemirror` and dynamic extensions from `extensions/buildExtensions.js`.
- Languages are registered in `src/renderer/src/components/language/languageRegistry.js` — follow its `loader` pattern when adding new languages.

## Where to make common changes

- Add IPC: `src/main/index.js` → expose in `src/preload/index.js` → call from `src/renderer/src` components.
- Add UI component: `src/renderer/src/components/` and update `SnippetLibrary` or appropriate view under `workbench/`.
- Add theme: insert row into `theme` table (colors JSON), renderer reads via `window.api.getTheme()`; App applies theme before React mounts (`src/renderer/src/main.jsx`).

## Testing & debugging tips

- To debug renderer theme flash: see `applyThemeFromDB()` in `src/renderer/src/main.jsx` — it applies theme CSS variables before mounting React.
- If `better-sqlite3` fails in dev, run `npm run rebuild` and ensure Electron version matches.
- Use `ENABLE_DEVTOOLS` in `src/main/index.js` or run `ELECTRON_RENDERER_URL` env to use dev server URL.

## When unsure — quick references

- DB schema and initialization: `src/main/index.js` (search `initDB`).
- Autosave and editor behavior: `src/renderer/src/components/CodeEditor` and `useSnippetData` hook.
- Settings manager: `src/renderer/src/config/settingsManager` and `SettingsProvider` in `App.jsx`.

---

If any section is unclear or you'd like more concrete examples (e.g., adding an IPC + unit test or creating a new language loader), tell me which area to expand.
