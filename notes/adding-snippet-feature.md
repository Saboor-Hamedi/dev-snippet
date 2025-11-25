# Adding Snippet Feature to Sidebar

This guide explains how we transformed the "Explorer" view into a dedicated "Snippets" view with a creation button, similar to the Projects view.

## 1. Renaming the View

We renamed the default view from `'explorer'` to `'snippets'` to be more explicit about its purpose.

- **File:** `src/renderer/src/components/SnippetLibrary.jsx`
- **Change:**
  ```javascript
  const [activeView, setActiveView] = useState('snippets') // Was 'explorer'
  ```

## 2. Updating the Activity Bar

We updated the sidebar navigation icon to reflect the change.

- **File:** `src/renderer/src/components/layout/ActivityBar.jsx`
- **Change:** Renamed "Explorer" to "Snippets" and updated the icon to a file-code style icon.

## 3. Adding the "Create Snippet" Button

We added a "+" button to the sidebar header when in the "Snippets" view, allowing users to create snippets directly from the sidebar (just like they can for Projects).

- **File:** `src/renderer/src/components/layout/Sidebar.jsx`
- **Logic:**
  ```javascript
  {activeView === 'snippets' && (
    <button onClick={onCreateSnippet} ... >
      <PlusIcon />
    </button>
  )}
  ```

## 4. Wiring It Up

We had to ensure the `onCreateSnippet` function was passed down correctly.

- **File:** `src/renderer/src/components/SnippetLibrary.jsx`
- **Action:** Passed `onCreateSnippet={() => setIsCreatingSnippet(true)}` to the `Sidebar` component.

Now, users can easily create both Projects and Snippets directly from their respective sidebar views!
