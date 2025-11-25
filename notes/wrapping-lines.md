# How to Wrap Lines in Code Snippets

This guide explains how to enable line wrapping for code snippets in the application.

## 1. The CSS Solution

The core logic for wrapping lines is handled in the global CSS file.

1.  Open `src/renderer/src/assets/index.css`.
2.  Locate or add the `.code-content` class.
3.  Ensure it has the following properties:

```css
.code-content {
  /* ... other styles ... */
  white-space: pre-wrap; /* Allows text to wrap */
  word-break: break-word; /* Breaks long words if necessary */
}
```

- `white-space: pre-wrap`: Preserves whitespace (like indentation) but allows wrapping when the line reaches the container's width.
- `word-break: break-word`: Ensures that very long strings (like URLs or long variable names) don't overflow horizontally.

## 2. Handling Line Numbers

When lines wrap, standard line numbers (which usually assume 1 line of code = 1 visual line) will become misaligned.

### Option A: Remove Line Numbers (Recommended for Wrapped Code)

This is the simplest approach and what is currently implemented in `SnippetViewModal.jsx`.

1.  Open the component displaying the code (e.g., `SnippetViewModal.jsx`).
2.  Remove the separate column/div that renders line numbers.
3.  Render the code content directly in a single container.

```javascript
// Before (with line numbers)
<div className="flex">
  <div className="line-numbers">...</div>
  <div className="code">...</div>
</div>

// After (simplified)
<div className="code-container">
  {highlightedContent}
</div>
```

### Option B: Complex Line Number Calculation (Advanced)

If you strictly need line numbers _and_ wrapping, you would need a JavaScript solution to calculate the height of each wrapped line and adjust the line number height accordingly. This is complex and often requires a library or ResizeObserver.

## 3. Applying to Other Components

If you want to apply this to other parts of the app (like the `SnippetCard` or `SnippetEditor`):

1.  Ensure the element displaying the code has the `.code-content` class.
2.  Or, manually add the CSS properties to its specific class.
