# System Architecture & Design Decisions

## 1. SystemStatusFooter vs. StatusBar

### Why `SystemStatusFooter.jsx` was created?

The `SystemStatusFooter` component was created to provide a consistent "system-level" status display across different views of the application, specifically the **Welcome Page** and the **Empty State** (when no snippet is selected).

**Key Responsibilities:**

- **System Health**: Displays "System Ready" and version number.
- **Global Stats**: Shows total number of snippets and languages.
- **Welcome Page Toggle**: Houses the specific "Don't show again" toggle for the Welcome Page visibility.

### Why not use `StatusBar.jsx`?

The existing `StatusBar.jsx` serves a fundamentally different purpose. It is context-aware and tied specifically to the **Code Editor**.

**StatusBar Responsibilities:**

- **Editor Context**: Shows the language of the _currently open_ file.
- **Editor Controls**: Displays and controls the zoom level of the editor.
- **Settings Access**: Provides a quick link to settings.

**Comparison:**
| Feature | SystemStatusFooter | StatusBar |
| :--- | :--- | :--- |
| **Context** | Global / System | Active Editor |
| **Content** | Version, Total Snippets, Welcome Toggle | Language, Zoom Level |
| **Usage** | Welcome Page, Empty State | Snippet Editor |

Mixing these two would have violated the "Separation of Concerns" principle, as one tracks global app state and the other tracks local editor state.

## 2. Settings Persistence (`settings.json`)

### How Settings are Saved

We moved away from `localStorage` for critical UI preferences to ensure a more robust and portable configuration system.

**The Flow:**

1.  **Default Settings**: Defined in `src/renderer/src/config/defaultSettings.js`. This file acts as the schema and initial state for the application.
    - _Added_: `ui.hideWelcomePage: false`
2.  **Settings Context**: `useSettingsContext.jsx` provides the `useSettings` hook.
3.  **Settings Manager**: The context uses `settingsManager.js` (in the backend/main process via IPC) to read and write to `settings.json` on the user's disk.

### Implementation Details

- **Reading**: Components use `const { getSetting } = useSettings()` to retrieve values.
  - Example: `const hideWelcomePage = getSetting('ui.hideWelcomePage')`
- **Writing**: Components use `const { updateSetting } = useSettings()` to save changes.
  - Example: `updateSetting('ui.hideWelcomePage', true)`
- **Persistence**: When `updateSetting` is called, it sends an IPC message to the main process, which writes the updated JSON object to the `settings.json` file.

## 3. Welcome Page Logic

### Hiding the Welcome Page

1.  **Startup Check**: `SnippetLibrary.jsx` reads the `ui.hideWelcomePage` setting on initialization.
2.  **View Routing**:
    - If `hideWelcomePage` is `false` (default): The app defaults to the `'welcome'` view.
    - If `hideWelcomePage` is `true`: The app defaults to the `'snippets'` view (which renders the Empty State if no snippet is selected).
3.  **Empty State**: `Workbench.jsx` checks the same setting. If the Welcome Page is hidden and no snippet is selected, it renders the `EmptyState` UI (with the `SystemStatusFooter`) instead of falling back to the `WelcomePage`.

### Toggling Back On

Because we included `SystemStatusFooter` in the Empty State, the "Don't show again" toggle is always accessible. Unchecking it updates `settings.json`, and the next time the app starts (or the view resets), the Welcome Page will appear.
