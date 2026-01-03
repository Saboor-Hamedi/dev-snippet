// ...existing code...
// ...existing code...
// Prevent caret from stretching to table width
// This must be inside the theme object, not at the top level
// (move this block below, inside the EditorView.theme style object)
const buildTheme = (EditorView, options = {}) => {
  const {
    isDark = false,
    fontSize = 'var(--editor-font-size, 12px)',
    fontFamily = 'var(--editor-font-family, "Outfit", "Inter", sans-serif)',
    caretColor = 'var(--caret-color, #ffffff)',
    cursorShape = 'bar',
    cursorShadowBoxColor = 'var(--shadow-box-bg, var(--caret-color))',
    cursorActiveLineBg = 'var(--active-line-bg, transparent)',
    cursorSelectionBg = 'rgba(88,166,255,0.28)',
    disableComplexCM = false
  } = options

  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'var(--editor-bg, transparent) !important',
        color: 'var(--editor-text, var(--color-text-primary, #0f172a))',
        fontFamily: fontFamily,
        fontSize: fontSize,
        lineHeight: '1.6',
        height: '100%',
        paddingLeft: '0',
        textAlign: 'left',
        transition: 'none !important' // Fixed: Stop theme-switching "fades" or jumps
      },
      '.cm-line': {
        textAlign: 'left'
      },
      '.cm-content .cm-line-h1, .cm-content .cm-line-h2, .cm-content .cm-line-h3, .cm-content .cm-line-h4, .cm-content .cm-line-h5, .cm-content .cm-line-h6':
        {
          textAlign: 'left !important',
          transition: 'none !important' // Stop layout-shifts during theme change
        },
      '.cm-code-block, .cm-code-block *': {
        textAlign: 'left !important'
      },
      '.cm-scroller': {
        display: 'flex !important',
        height: '100% !important',
        overflow: 'auto !important',
        backgroundColor: 'transparent !important',
        fontFamily: 'inherit',
        minWidth: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        scrollbarGutter: 'stable !important'
      },
      // Height of the content should be 100% of the scroller
      '.cm-content': {
        width: '100%',
        maxWidth: 'var(--editor-max-width, 1000px) !important',
        margin: '0 auto !important', // Center in strict flex/block context
        marginRight: 'auto',
        flex: '1 1 auto !important',
        // centered content with auto margins

        minHeight: '100%',
        backgroundColor: 'transparent',
        // Let CSS handle padding (CodeEditor.css)
        // padding: '0',
        paddingBottom: '0',
        position: 'relative',
        fontFamily: 'inherit',
        lineHeight: '1.6',
        fontSize: fontSize, // Use the dynamic font size option
        boxSizing: 'border-box',
        caretColor: caretColor
      },
      '.cm-content::before': {
        content: "''",
        position: 'absolute',
        left: '0',
        top: '0',
        bottom: '0',
        width: '24px',
        pointerEvents: 'none',
        background: 'transparent'
      },
      '.cm-gutters': {
        flex: '0 0 auto !important',
        minHeight: '100%',
        backgroundColor: 'transparent !important',
        borderRight: 'none !important',
        marginRight: '16px',
        position: 'sticky',
        left: 0,
        zIndex: 10
      },

      // Syntax Highlighting is now handled by HighlightStyle in buildExtensions.js
      // Using variables from :root for maximum performance and theme sync

      // Hide whitespace/special char highlighting (tabs, spaces, etc) - Global suppression
      '.cm-specialChar, .cm-whitespace, .cm-highlightWhitespace, .cm-tab': {
        color: 'inherit !important',
        backgroundColor: 'transparent !important',
        textDecoration: 'none !important',
        opacity: '1 !important',
        backgroundImage: 'none !important'
      },
      // Ensure specific suppression inside code contexts
      '.cm-content *': {
        '&.cm-whitespace, &.cm-tab, &.cm-specialChar': {
          color: 'inherit !important',
          backgroundColor: 'transparent !important',
          display: 'inline !important'
        }
      },

      // Table Row (Obsidian-like)
      // Extend the background left into the editor padding so the
      // highlight appears flush (avoids a visible "tab" gap).
      '.cm-md-table-row': {
        backgroundColor: 'rgba(88, 166, 255, 0.08) !important',
        borderLeft: '3px solid var(--color-accent-primary)',
        marginLeft: '0',
        paddingLeft: '24px',
        paddingRight: '48px',
        width: '100%'
      },

      '.cm-mermaid-block': {
        backgroundColor: 'rgba(190, 80, 255, 0.08) !important',
        borderLeft: '3px solid #be50ff'
      },

      // Syntax Hiding (Live Preview)
      '.cm-hide-syntax': {
        display: 'none !important'
      },

      // Inline Code (Premium Highlight)
      '.inline-code, .cm-inline-code': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: 'var(--color-accent-primary, #58a6ff)',
        padding: '0 4px',
        borderRadius: '4px',
        fontFamily: 'var(--editor-font-mono, monospace)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'inline-block',
        lineHeight: '1.4',
        verticalAlign: 'middle'
      },

      // Header Sizing (Obsidian-like Live Decorative)
      /* Headings consolidated below */

      // Custom Markdown Elements (Inline decorations)
      '.cm-wikilink': {
        color: 'var(--color-accent-secondary, #58a6ff) !important',
        textDecoration: 'underline'
      },
      '.cm-mention, .cm-hashtag': {
        color: 'var(--color-accent-primary, #d2a8ff) !important',
        backgroundColor: 'rgba(210, 168, 255, 0.1)',
        padding: '0 2px',
        borderRadius: '3px'
      },

      // Header Lines (Layout/Spacing) - Use PADDING instead of MARGIN to ensure correct line height measurement
      '.cm-line-h1': {
        lineHeight: '1.4 !important',
        paddingTop: '0 !important',
        paddingBottom: '0 !important'
      },
      '.cm-line-h2': {
        lineHeight: '1.4 !important',
        paddingTop: '0 !important',
        paddingBottom: '0 !important'
      },
      '.cm-line-h3': {
        lineHeight: '1.4 !important',
        paddingTop: '0 !important',
        paddingBottom: '0 !important'
      },
      '.cm-line-h4': {
        lineHeight: '1.4 !important',
        paddingTop: '0 !important',
        paddingBottom: '0 !important'
      },
      '.cm-line-h5': {
        lineHeight: '1.4 !important',
        paddingTop: '0 !important',
        paddingBottom: '0 !important'
      },
      '.cm-line-h6': {
        lineHeight: '1.4 !important',
        paddingTop: '0 !important',
        paddingBottom: '0 !important'
      },

      /* Header Text (Font/Color) - Apply size only to text spans, EXCLUDING markers */
      '.cm-line-h1 span:not(.cm-marker-hidden)': { fontSize: `calc(${fontSize} * 2.5) !important` },
      '.cm-line-h2 span:not(.cm-marker-hidden)': { fontSize: `calc(${fontSize} * 2.0) !important` },
      '.cm-line-h3 span:not(.cm-marker-hidden)': { fontSize: `calc(${fontSize} * 1.7) !important` },
      '.cm-line-h4 span:not(.cm-marker-hidden)': { fontSize: `calc(${fontSize} * 1.4) !important` },
      '.cm-line-h5 span:not(.cm-marker-hidden)': { fontSize: `calc(${fontSize} * 1.2) !important` },
      '.cm-line-h6 span:not(.cm-marker-hidden)': { fontSize: `calc(${fontSize} * 1.0) !important` },

      '.cm-content .cm-h1': {
        fontWeight: '700'
      },
      '.cm-content .cm-h2': {
        fontWeight: '700'
      },
      '.cm-content .cm-h3': {
        fontWeight: '700'
      },
      '.cm-content .cm-h4': {
        fontWeight: '700'
      },
      '.cm-content .cm-h5': {
        fontWeight: '600'
      },
      '.cm-content .cm-h6': {
        fontWeight: '600'
      },

      // Header Padding Compensation (For Stable Live Preview)
      // Removed to ensure headers align perfectly with paragraphs as per user request.
      '.cm-pad-h1': { paddingLeft: '0' },
      '.cm-pad-h2': { paddingLeft: '0' },
      '.cm-pad-h3': { paddingLeft: '0' },
      '.cm-pad-h4': { paddingLeft: '0' },
      '.cm-pad-h5': { paddingLeft: '0' },
      '.cm-pad-h6': { paddingLeft: '0' },

      '.cm-md-checkbox': {
        display: 'inline-flex',
        width: '1.1em',
        height: '1.1em',
        verticalAlign: 'middle',
        marginRight: '0.4em'
      },
      '.cm-md-checkbox input': {
        appearance: 'none',
        width: '100%',
        height: '100%',
        border: '1.5px solid var(--color-border)',
        borderRadius: '3px',
        cursor: 'pointer',
        backgroundColor: 'var(--editor-bg)',
        transition: 'none !important'
      },
      '.cm-md-checkbox input:checked': {
        backgroundColor: 'var(--color-accent-primary)',
        borderColor: 'var(--color-accent-primary)'
      },

      '.cm-code-block-header': {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 12px',
        background: 'rgba(255,255,255,0.05)',
        fontSize: '0.75em',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        userSelect: 'none',
        color: 'var(--color-text-tertiary)'
      },
      '.cm-code-copy-btn': {
        background: 'none',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        opacity: 0.6,
        transition: 'none !important'
      },
      '.cm-code-copy-btn:hover': {
        opacity: 1,
        color: 'var(--color-accent-primary)'
      },

      '.cm-md-rendered-table': {
        display: 'table !important',
        borderCollapse: 'collapse !important',
        borderSpacing: '0 !important',
        margin: '1.5rem 0',
        border: '1px solid var(--color-border, #30363d) !important',
        borderRadius: '6px',
        overflow: 'hidden',
        width: '100% !important',
        backgroundColor: 'transparent !important',
        fontSize: 'inherit !important' /* Sync font size with editor */
      },
      '.cm-md-rendered-table tr:nth-child(2n)': {
        backgroundColor: 'rgba(255, 255, 255, 0.02) !important'
      },
      '.cm-md-rendered-table th': {
        fontWeight: '600',
        backgroundColor: 'var(--color-bg-secondary, rgba(255, 255, 255, 0.05)) !important'
      },
      '.cm-md-rendered-table th, .cm-md-rendered-table td': {
        padding: '10px 14px !important' /* Sync with markdown.css */,
        border: '1px solid var(--color-border, #30363d) !important',
        position: 'relative',
        minWidth: '60px',
        color: 'var(--color-text-primary) !important'
      },
      '.cm-md-table-rendered-wrapper': {
        position: 'relative',
        display: 'block' /* Fixed: Ensure full width sync with sidebar */,
        width: '100%',
        padding: '1.5em 0'
      },
      '.cm-md-table-edge-plus': {
        position: 'absolute',
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-accent-primary)',
        color: 'var(--color-accent-primary)',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '14px',
        zIndex: 20,
        opacity: 0,
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      },
      '.cm-md-table-rendered-wrapper:hover .cm-md-table-edge-plus': {
        opacity: 1
      },
      '.cm-md-table-edge-plus:hover': {
        transform: 'scale(1.2)',
        background: 'var(--color-accent-primary)',
        color: '#fff'
      },
      '.cm-md-table-plus-right': {
        right: '-10px',
        top: '50%',
        transform: 'translateY(-50%)'
      },
      '.cm-md-table-plus-bottom': {
        bottom: '-10px',
        left: '50%',
        transform: 'translateX(-50%)'
      },
      '.cm-md-table-toolbar': {
        position: 'absolute',
        top: '-15px',
        right: '0',
        display: 'flex',
        gap: '4px',
        opacity: 0,
        transition: 'opacity 0.2s ease',
        zIndex: 25
      },
      '.cm-md-table-rendered-wrapper:hover .cm-md-table-toolbar': {
        opacity: 1
      },
      '.cm-md-hr': {
        height: '2px',
        background: 'linear-gradient(to right, var(--color-accent-primary), transparent)',
        borderVertical: '2em solid transparent',
        borderInline: 'none',
        opacity: 0.5
      },
      '.cm-blockquote-line': {
        borderLeft: '4px solid var(--color-accent-secondary, #58a6ff)',
        background: 'rgba(88, 166, 255, 0.05)',
        paddingLeft: '1em'
      },
      '.cm-admonition': {
        padding: '1.5em 0',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        background: 'var(--color-bg-secondary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      },
      '.cm-admonition-header': {
        padding: '8px 16px',
        background: 'var(--color-bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 'bold',
        fontSize: '0.85em',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        borderBottom: '1px solid var(--color-border)'
      },
      '.cm-admonition-icon::before': {
        fontSize: '1.2em'
      },
      '.cm-admonition-tip .cm-admonition-header': { color: '#3fb950' },
      '.cm-admonition-tip .cm-admonition-icon::before': { content: '"💡"' },

      '.cm-admonition-info .cm-admonition-header': { color: '#58a6ff' },
      '.cm-admonition-info .cm-admonition-icon::before': { content: '"ⓘ"' },

      '.cm-admonition-warning .cm-admonition-header': { color: '#d29922' },
      '.cm-admonition-warning .cm-admonition-icon::before': { content: '"⚠️"' },

      '.cm-admonition-danger .cm-admonition-header': { color: '#f85149' },
      '.cm-admonition-danger .cm-admonition-icon::before': { content: '"🛑"' },

      '.cm-admonition-note .cm-admonition-header': { color: '#a371f7' },
      '.cm-admonition-note .cm-admonition-icon::before': { content: '"📝"' },

      '.cm-admonition-body': {
        padding: '14px 18px',
        fontSize: '0.95em',
        lineHeight: '1.7',
        color: 'var(--color-text-secondary)',
        whiteSpace: 'pre-wrap'
      },
      '.cm-md-table-cell': {
        outline: 'none',
        minWidth: '20px'
      },
      '.cm-md-table-create-btn': {
        display: 'flex',
        gap: '4px',
        marginTop: '8px',
        opacity: 0.3,
        transition: 'opacity 0.2s ease'
      },
      '.cm-md-table-rendered-wrapper:hover .cm-md-table-controls': {
        opacity: 1
      },
      '.cm-md-table-btn': {
        padding: '2px 8px',
        fontSize: '11px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'none !important',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '22px',
        lineHeight: '20px',
        minWidth: '44px',
        boxSizing: 'border-box'
      },
      '.cm-md-table-toolbar, .cm-md-table-toolbar *': {
        pointerEvents: 'auto'
      },
      '.cm-md-table-btn:hover': {
        background: 'var(--color-accent-primary)',
        color: '#fff',
        borderColor: 'var(--color-accent-primary)'
      },
      // Prevent caret from stretching to table width
      '.cm-md-rendered-table .cm-cursor': {
        maxWidth: '2px',
        minWidth: '2px',
        width: '2px',
        borderLeftWidth: '2px !important',
        boxSizing: 'border-box',
        display: 'inline-block'
      },
      '.cm-md-table-create-btn': {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        fontSize: '11px',
        color: 'var(--color-text-tertiary)',
        background: 'transparent',
        border: '1px dashed var(--color-border)',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'none !important'
      },
      '.cm-md-table-create-btn:hover': {
        color: 'var(--color-accent-primary)',
        borderColor: 'var(--color-accent-primary)',
        background: 'rgba(88, 166, 255, 0.05)'
      },
      '.cm-md-table-create-btn svg': {
        opacity: 0.7
      },

      /* Mermaid Widget Support */
      '.cm-mermaid-widget': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: 'none',
        width: '100%',
        minHeight: '220px',
        maxHeight: '100%',
        overflow: 'auto',
        position: 'relative',
        transition: 'none !important',
        color: '#333'
      },
      '.cm-mermaid-toolbar': {
        position: 'absolute',
        top: '8px',
        right: '12px',
        display: 'flex',
        gap: '8px',
        opacity: 0,
        transition: 'opacity 0.2s ease',
        zIndex: 10
      },
      '.cm-mermaid-widget:hover .cm-mermaid-toolbar': {
        opacity: 1
      },
      '.cm-mermaid-tool-btn': {
        padding: '3px 8px',
        fontSize: '11px',
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'none !important'
      },
      '.cm-mermaid-tool-btn:hover': {
        background: 'var(--color-accent-primary)',
        color: '#fff',
        borderColor: 'var(--color-accent-primary)'
      },
      // mermaid svg size
      '.cm-mermaid-widget svg': {
        maxWidth: '100% !important',
        height: 'auto !important',
        transition: 'transform 0.2s ease'
      },
      '.cm-mermaid-loading': {
        fontSize: '12px',
        color: 'var(--color-text-tertiary)',
        fontStyle: 'italic',
        letterSpacing: '0.05em'
      },
      /* Removed manual overrides for node/label colors to allow Mermaid 'default' theme to work strictly */

      // Dark mode overrides and theme variable sync
      '&.cm-editor.dark': {
        backgroundColor: 'var(--editor-bg, #0d1117) !important',
        color: 'var(--editor-text, #e6edf3)'
      },

      '&.cm-editor.light': {
        backgroundColor: 'var(--editor-bg, #ffffff) !important',
        color: 'var(--editor-text, #0f172a)'
      },

      '&.cm-editor.dark .cm-gutters': {
        backgroundColor: 'var(--gutter-bg-color, transparent) !important',
        color: 'var(--gutter-text-color, #8b949e) !important',
        borderRightColor: 'var(--gutter-border-color, #30363d) !important'
      },

      // (Merged into previous '.cm-scroller' definition)

      // --- Image Rendering Polish ---
      '.cm-md-image-container': {
        display: 'flex',
        justifyContent: 'center',
        margin: '1.5em 0',
        width: '100%'
      },
      '.cm-md-rendered-image': {
        maxWidth: '100%',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        border: '1px solid var(--color-border)',
        transition: 'transform 0.2s ease'
      },
      '.cm-md-rendered-image:hover': {
        transform: 'scale(1.01)'
      },

      '.cm-scroller::-webkit-scrollbar': {
        width: '12px',
        height: '12px'
      },
      '.cm-scroller::-webkit-scrollbar-thumb': {
        backgroundColor: 'var(--color-scrollbar-thumb, rgba(121, 121, 121, 0.4))',
        borderRadius: '6px',
        border: '3px solid transparent',
        backgroundClip: 'content-box',
        transition: 'background-color 0.2s ease !important'
      },

      '.cm-cursor': {
        borderLeftColor: `${caretColor} !important`,
        borderLeftWidth:
          cursorShape === 'block' || cursorShape === 'underline'
            ? '0px !important'
            : 'var(--caret-width, 2px)',
        borderBottom:
          cursorShape === 'underline' ? `var(--caret-width, 2px) solid ${caretColor}` : 'none',
        // Use !important to prevent specificify wars with native CM styles
        backgroundColor: cursorShape === 'block' ? `${caretColor} !important` : 'transparent',
        width: cursorShape === 'block' || cursorShape === 'underline' ? '1ch !important' : '0px', // Bar relies on border-left
        opacity: cursorShape === 'block' ? '0.6 !important' : '1',
        // DYNAMIC CARET: Restored native scaling
        display: 'block',
        boxShadow:
          disableComplexCM || cursorShape === 'block' || cursorShape === 'underline'
            ? 'none'
            : `0 0 12px 1px ${cursorShadowBoxColor || 'var(--caret-color)'} !important`,
        transition: 'opacity 0.15s ease-in-out !important'
      },

      '.cm-gutters': {
        backgroundColor: 'var(--gutter-bg-color, transparent) !important',
        color: 'var(--color-text-secondary, #64748b)',
        borderRight:
          'var(--gutter-border-width, 1px) solid var(--gutter-border-color, transparent) !important',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        lineHeight: '1.6',
        minHeight: '100%',
        boxSizing: 'border-box',
        padding: '0',
        transition: 'none !important'
      },
      '.cm-lineNumbers .cm-gutterElement': {
        minWidth: '3.5em !important',
        padding: '0 8px !important',
        display: 'flex !important',
        justifyContent: 'center !important',
        transition: 'none !important'
      },
      '.cm-foldGutter .cm-gutterElement': {
        width: '1.5em !important',
        display: 'flex !important',
        justifyContent: 'center !important',
        transition: 'none !important'
      },
      '.cm-gutterElement': {
        background: 'transparent !important',
        transition: 'none !important'
      },

      // Remove aggressive active-line background to avoid whole-paragraph
      // highlighting on single click. Keep only a subtle caret indicator.
      '.cm-activeLine': {
        boxShadow: 'none !important',
        backgroundColor: `${cursorActiveLineBg} !important`,
        transition: 'none !important'
      },

      '.cm-matchingBracket': {
        backgroundColor: 'transparent !important',
        borderBottom: '1px solid var(--color-text-primary)',
        transition: 'none !important'
      },

      '.cm-activeLineGutter': {
        backgroundColor: 'transparent !important'
      },

      // --- Mode Specific Layout Polish ---
      '&.cm-reading-mode': {
        cursor: 'text !important'
      },
      // Disable the active-line highlight in non-editing modes to avoid
      // a full-paragraph background showing on single click (Obsidian-like)
      '&.cm-reading-mode .cm-activeLine, &.cm-live-preview-mode .cm-activeLine': {
        boxShadow: 'none !important',
        backgroundColor: 'transparent !important',
        borderLeft:
          'var(--active-line-border-width, 0px) solid var(--caret-color, #ffffff) !important'
      },
      '&.cm-reading-mode .cm-cursor': {
        display: 'none !important'
      },
      '&.cm-reading-mode .cm-content': {
        userSelect: 'text !important',
        WebkitUserSelect: 'text !important'
      },
      '&.cm-live-preview-mode .cm-content': {
        // Allow native selection in Live Preview (Obsidian-like behavior)
        userSelect: 'text !important',
        WebkitUserSelect: 'text !important'
      },
      // Ensure all children are selectable (widgets may inject elements)
      '.cm-content *': {
        userSelect: 'text !important'
        // WebkitUserSelect: 'text !important'
      },
      // HIDE Default CodeMirror selection background.
      // We use our custom hybrid selection system (CodeEditor.css + forceSelection.js)
      // for a seamless 'Obsidian' look that doesn't create blocky gaps on headers.
      '.cm-selectionBackground': {
        display: 'none !important'
      },

      // MASK Native browser selection.
      // Since we use forceSelection.js to draw a custom highlight, we make the
      // native selection transparent to prevent a 'doubling' or '2-layer' effect.
      '& ::selection, .cm-content ::selection': {
        backgroundColor: 'transparent !important',
        background: 'transparent !important'
      },
      // Prevent full-block background selection on large headings and some
      // rendered block widgets. Clicking wrapped lines inside these elements
      // should place caret / select text without painting the whole block.
      // (Selection visibility restored to fix cursor UI issues)
      '&.cm-source-mode .cm-content': {
        // Shared font engine
      }
    },
    { dark: isDark }
  )
}

export default buildTheme
