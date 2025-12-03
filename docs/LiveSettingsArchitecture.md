# Live Settings Architecture & Documentation

This document explains the "Live Settings" architecture in the application, how it works, and how to extend it.

## Overview

The application uses a **Live Settings** system where `settings.json` acts as the single source of truth. Changes made to this file (either via the application UI or by editing the file externally) are instantly reflected in the application without requiring a reload.

### Core Components

1.  **`settings.json`**: The JSON file stored in the user's data directory. This is the database for all configuration.
2.  **Main Process (`main/index.js`)**: Watches `settings.json` for changes using `fs.watch`. When a change is detected, it broadcasts a `settings:changed` IPC event to all renderer windows.
3.  **Renderer Process**:
    *   **`SettingsManager` (`Settings.jsx`)**: Listens for the `settings:changed` event. It parses the new JSON, merges it with default settings, and notifies the application.
    *   **`useSettingsContext`**: A React context that subscribes to `SettingsManager`. It provides the current `settings` object to React components.
    *   **`useFontSettings`**: A specialized hook that applies font and caret styles (like `font-family`, `font-size`) directly to the DOM using CSS variables (`--editor-font-size`, etc.).

---

## Detailed File Breakdown

### 1. `src/renderer/src/components/settings/Settings.jsx`
**Role**: The Brain.
*   **SettingsManager Class**: Manages the in-memory state of settings.
*   **File Watching**: It subscribes to `window.api.onSettingsChanged` to receive updates from the main process.
*   **Deep Merging**: When new settings arrive, it deeply merges them with `DEFAULT_SETTINGS`. This ensures that if `settings.json` is partial (e.g., only contains `{ "editor": { "fontSize": 18 } }`), other editor settings (like `zoomLevel`) are preserved and not reset to defaults.
*   **Persistence**: When you change a setting in the UI, it calls `save()`, which writes to `settings.json`.

### 2. `src/renderer/src/components/SettingsModal.jsx`
**Role**: The Editor UI.
*   This component provides a user-friendly interface (GUI) to modify `settings.json`.
*   **Why keep it?** Even though you *can* edit `settings.json` manually, this modal provides a convenient way to toggle switches and slide sliders without worrying about JSON syntax errors.
*   **Live Preview**: It shows a "Live Settings JSON" preview so you can see exactly what data will be saved.

### 3. `src/renderer/src/hook/useFontSettings.js`
**Role**: The Stylist.
*   This hook bridges the gap between React state and CSS.
*   It reads font/caret settings from `useSettingsContext`.
*   It updates CSS variables on the `document.documentElement` (root):
    *   `--editor-font-size`
    *   `--editor-font-family`
    *   `--caret-width`
    *   `--caret-style`
*   This allows the CodeMirror editor (and other parts of the UI) to update their appearance *instantly* via CSS, which is much faster than re-rendering the entire editor component.

### 4. `src/renderer/src/components/SplitPane.jsx`
**Role**: The Layout Manager.
*   Handles the resizable split between the Editor and the Preview.
*   **Smart Restoration**: It remembers the user's last manual drag position (`userSplitRef`). When you toggle the Preview pane off and on, it restores exactly to where you left it, rather than resetting to 50/50 or getting stuck.

---

## FAQ

### Q: Why keep `SettingsModal.jsx` if I have `settings.json`?
**A:** You don't *have* to use it, but it's a helpful tool. Think of `settings.json` as the engine and `SettingsModal.jsx` as the dashboard.
*   **Power Users**: Can edit `settings.json` directly in VS Code or Notepad. The app will update live!
*   **Casual Usage**: Can use `SettingsModal` to quickly change themes or font sizes.
*   **Validation**: The Modal ensures you don't input invalid values (like a negative font size).

### Q: How do I add more features or components to `settings.json`?
To add a new setting (e.g., "Show Line Numbers"):

1.  **Define the Default**:
    Open `src/renderer/src/components/settings/Settings.jsx` and add it to `DEFAULT_SETTINGS`:
    ```javascript
    const DEFAULT_SETTINGS = {
      editor: {
        // ... existing settings
        showLineNumbers: true // <--- Add this
      },
      // ...
    }
    ```

2.  **Use the Setting**:
    In your component (e.g., `CodeEditor.jsx`), use the hook:
    ```javascript
    import { useSettings } from '../hook/useSettingsContext'

    const MyComponent = () => {
      const { settings } = useSettings()
      const showLines = settings.editor.showLineNumbers

      return <div>{showLines ? <LineNumbers /> : null}</div>
    }
    ```

3.  **(Optional) Add to UI**:
    If you want to change it via the GUI, update `SettingsModal.jsx`:
    ```javascript
    <div className="setting-item">
      <label>Show Line Numbers</label>
      <input 
        type="checkbox" 
        checked={localSettings.editor.showLineNumbers}
        onChange={(e) => updateSetting('editor.showLineNumbers', e.target.checked)}
      />
    </div>
    ```

That's it! The system handles saving, loading, and live-updating automatically.
