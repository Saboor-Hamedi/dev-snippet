# How to Add a New Tab (View) to the Project

This guide explains how to add a new sidebar tab (like Explorer, Projects, Settings) to the application.

## 1. Update the State Management

The active view is managed in `src/renderer/src/components/SnippetLibrary.jsx`.

1.  Open `src/renderer/src/components/SnippetLibrary.jsx`.
2.  Look for the `activeView` state:
    ```javascript
    const [activeView, setActiveView] = useState('explorer')
    ```
    _You don't strictly need to change code here, but keep in mind this is where the value changes (e.g., 'explorer', 'projects', 'settings', 'new-tab')._

## 2. Add the Icon to the Activity Bar

The side navigation bar is located in `src/renderer/src/components/layout/ActivityBar.jsx`.

1.  Open `src/renderer/src/components/layout/ActivityBar.jsx`.
2.  Import an icon for your new tab (e.g., from `lucide-react` or an SVG).
3.  Add a new `<ActivityBarIcon />` component in the return statement.

```javascript
{
  /* New Tab Name */
}
;<ActivityBarIcon
  label="My New Tab"
  active={activeView === 'new-tab'}
  onClick={() => setActiveView('new-tab')}
  icon={
    <svg>...</svg> // Or <MyIcon />
  }
/>
```

## 3. Create the Component

Create the new component you want to display when this tab is active.

1.  Create a new file, e.g., `src/renderer/src/components/MyNewView.jsx`.
2.  Build your component:

    ```javascript
    import React from 'react'

    const MyNewView = () => {
      return (
        <div className="p-8 text-white">
          <h1>My New View</h1>
          <p>This is the content of the new tab.</p>
        </div>
      )
    }

    export default MyNewView
    ```

## 4. Render the Component in the Workbench

The `Workbench` component decides what to display in the main area based on the `activeView`.

1.  Open `src/renderer/src/components/workbench/Workbench.jsx`.
2.  Import your new component:
    ```javascript
    import MyNewView from '../MyNewView'
    ```
3.  Add a condition to render it:

    ```javascript
    const Workbench = ({ activeView, ...props }) => {
      // ... existing code

      if (activeView === 'settings') {
        return <SettingsPanel />
      }

      // Add this block:
      if (activeView === 'new-tab') {
        return <MyNewView />
      }

      // ... existing code (default explorer view)
    }
    ```

## 5. (Optional) Update the Sidebar

If your new tab needs a specific list in the sidebar (like "Projects" does), you need to update `Sidebar.jsx`.

1.  Open `src/renderer/src/components/layout/Sidebar.jsx`.
2.  Update the header or list logic to handle your new view name:
    ```javascript
    // In the render method
    {
      activeView === 'new-tab' && (
        // Render specific sidebar content for this view
        <div>My Tab Sidebar Items</div>
      )
    }
    ```
