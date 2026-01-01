/**
 * previewGenerator.js
 * Centralized logic for generating standalone HTML previews.
 * Primarily used by "Mini Browser" and "External System Browser".
 */

import markdownStyles from '../assets/markdown.css?raw'
import variableStyles from '../assets/variables.css?raw'
import mermaidStyles from '../components/mermaid/mermaid.css?raw'
import { getMermaidConfig } from '../components/mermaid/mermaidConfig'
import { getMermaidEngine } from '../components/mermaid/mermaidEngine'
import { markdownWorkerClient } from '../workers/markdownWorkerClient'

import { themes } from '../components/preference/theme/themes'

/**
 * Builds the <head> section with all necessary styles and external dependencies.
 */
const buildHeader = (title, theme, isDark, fontFamily, themeVars, forPrint = false) => `
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      ${forPrint ? '' : variableStyles}
      ${forPrint ? '' : themeVars}
      ${forPrint ? '' : markdownStyles.replace(/@import\s+['"][^'"]+['"];/g, '')}
      ${forPrint ? '' : mermaidStyles}
      ${
        forPrint
          ? `
        /* Override any remaining CSS variables for clean PDF export */
        :root, * {
          --color-bg-primary: white !important;
          --color-bg-secondary: white !important;
          --color-bg-tertiary: #f9fafb !important;
          --color-text-primary: black !important;
          --color-text-secondary: #374151 !important;
          --color-text-tertiary: #6b7280 !important;
          --color-accent-primary: #0366d6 !important;
          --color-border: #d1d5db !important;
        }
      `
          : ''
      }
      
      html, body { 
        margin: 0 !important; padding: 0 !important; 
        overflow-x: hidden !important; 
        overflow-y: auto !important;
        width: 100% !important;
        height: 100% !important;
        background-color: ${forPrint ? 'white' : `var(--color-bg-primary, ${isDark ? '#0d1117' : '#ffffff'})`} !important;
        color: ${forPrint ? 'black' : `var(--color-text-primary, ${isDark ? '#e6edf3' : '#1f2328'})`} !important;
        min-height: 100vh !important;
        display: flex;
        flex-direction: column;
        color-scheme: ${isDark ? 'dark' : 'light'};
        align-items: center !important; 
      }
      .preview-container { 
        width: 100% !important; max-width: ${forPrint ? '800px' : '900px'};
        padding: ${forPrint ? '20px' : '40px'}; 
        margin: 0 !important;
        box-sizing: border-box; 
        background: transparent !important;
        min-height: 100vh !important;
        flex: 1;
        display: flex;
        flex-direction: column;
        text-align: left;
      }
      .markdown-body {
        flex: 1;
        width: 100% !important;
        min-height: 100vh !important;
        padding-bottom: 2rem !important;
      }
      .markdown-body, .mermaid-wrapper, .mermaid-diagram, .actor, .node label { 
        font-family: ${fontFamily}, 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; 
        color: inherit !important;
      }
      pre code { font-family: 'JetBrains Mono', monospace !important; }

      /* Premium Scrollbars */
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: rgba(139, 148, 158, 0.2);
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      ::-webkit-scrollbar-thumb:hover { background: rgba(139, 148, 158, 0.4); }

      @media print {
        @page { margin: 15mm !important; }
        
        /* 1. Reset Page Canvas - NUCLEAR OPTION */
        html, body, .preview-container, .markdown-body, #content {
          display: block !important; /* CRITICAL: Flex/Grid keeps orphan logic from working */
          float: none !important;
          position: static !important;
          overflow: visible !important;
          height: auto !important;
          width: 100% !important;
          background: white !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* 2. Block Pagination (Keep It Together) */
        .code-block-wrapper, 
        .mermaid, 
        .markdown-alert, 
        blockquote,
        table,
        img,
        pre {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          display: block !important;
        }
        
        /* 3. Header Glue (Adhesive Logic) */
        /* Force header to stick to next element */
        h1, h2, h3, h4, h5, h6 {
          break-after: avoid !important;
          page-break-after: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.5rem !important; /* Tighten gap to pull content closer */
          padding-bottom: 0 !important;
        }
        
        /* Force next element to stick to header */
        h1 + *, h2 + *, h3 + *, h4 + *, h5 + *, h6 + * {
          break-before: avoid !important;
          page-break-before: avoid !important;
          margin-top: 0 !important;
        }

        /* 4. Diagram Sizing */
        .mermaid svg, img {
          max-width: 100% !important;
          height: auto !important;
        }

        /* 5. Typography */
        p, li, td, th {
          orphans: 3 !important;
          widows: 3 !important;
        }

        /* 6. Styling Overrides */
        .code-block-wrapper {
          border: 1px solid #ccc !important;
          background-color: #f8f8f8 !important;
          border-radius: 4px !important;
          margin: 1em 0 !important;
        }
        
        .mermaid {
          margin: 1.5em auto !important;
          border: 1px solid #eee !important;
        }
        
        /* 7. Artifact Cleanup */
        .code-block-header, .copy-code-btn, .code-block-footer, 
        .preview-engine-toolbar, .ui-element { display: none !important; }
        
        /* 8. Table Logic */
        table { page-break-inside: auto !important; width: 100% !important; }
        tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        thead { display: table-header-group !important; } /* Repeats header on new page */
      }
      
      ${
        forPrint
          ? `
        /* Basic HTML styling for clean PDF export */
        @page {
          margin: 1.2in !important;
          size: letter;
        }
        
        html, body, .preview-container, .markdown-body, #content { 
          background: white !important; 
          background-color: white !important;
          color: #000000 !important; 
          font-family: ${fontFamily}, 'Inter', sans-serif !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
        
        .preview-container {
          max-width: 6.5in !important; /* Letter width minus margins */
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Headings */
        h1, h2, h3, h4, h5, h6 {
          color: #000000 !important;
          font-weight: 600 !important;
          margin-top: 1.5em !important;
          margin-bottom: 0.5em !important;
          line-height: 1.2 !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
          text-align: left !important;
        }
        h1::before, h2::before, h3::before, h4::before, h5::before, h6::before {
          content: none !important;
        }
        h1 { font-size: 2em !important; }
        h2 { font-size: 1.5em !important; }
        h3 { font-size: 1.25em !important; }
        h4, h5, h6 { font-size: 1em !important; }
        
        /* Text elements */
        p { margin: 1em 0 !important; text-align: justify !important; }
        strong, b { font-weight: 600 !important; }
        em, i { font-style: italic !important; }
        
        /* Links */
        a { color: #0366d6 !important; text-decoration: none !important; }
        a:hover { text-decoration: underline !important; }
        
        /* Lists */
        ul, ol { margin: 1em 0 !important; padding-left: 2em !important; }
        li { margin: 0.25em 0 !important; }
        
        /* Blockquotes */
        blockquote {
          border-left: 4px solid #d1d5db !important;
          padding-left: 1em !important;
          margin: 1em 0 !important;
          color: #6b7280 !important;
          font-style: italic !important;
        }
        
        /* Tables */
        table { border-collapse: collapse !important; margin: 1em 0 !important; }
        th, td { border: 1px solid #d1d5db !important; padding: 0.5em !important; }
        th { background-color: #f9fafb !important; font-weight: 600 !important; }
        
        /* Hide UI elements */
        .code-block-header, .copy-code-btn { display: none !important; }
        
        /* Code block styling */
        .code-block-wrapper { 
          box-shadow: none !important; 
          transform: none !important; 
          background-color: #fafafa !important;
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          margin: 1.5em 0 !important;
          overflow: hidden !important;
        }
        
        .code-block-wrapper pre {
          margin: 0 !important;
          padding: 1em !important;
          background-color: #fafafa !important;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        .code-block-wrapper code {
          background: transparent !important;
          padding: 0 !important;
          font-family: inherit !important;
          font-size: inherit !important;
          line-height: inherit !important;
        }
        
        /* Syntax highlighting for print */
        .code-block-wrapper .hljs {
          background: transparent !important;
          color: #24292f !important;
        }
        
        .code-block-wrapper .hljs-keyword { color: #d73a49 !important; }
        .code-block-wrapper .hljs-string { color: #032f62 !important; }
        .code-block-wrapper .hljs-comment { color: #6a737d !important; }
        .code-block-wrapper .hljs-number { color: #005cc5 !important; }
        .code-block-wrapper .hljs-function { color: #6f42c1 !important; }        
        /* Additional code formatting for inline code and general elements */
        pre {
          background-color: #f8f8f8 !important;
          border: 1px solid #e1e5e9 !important;
          border-radius: 6px !important;
          padding: 1em !important;
          margin: 1em 0 !important;
          overflow-x: auto !important;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
        }
        
        code {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace !important;
          background-color: #f8f8f8 !important;
          padding: 0.2em 0.4em !important;
          border-radius: 3px !important;
          font-size: 0.9em !important;
        }
        
        pre code {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        
        /* Icons and special content */
        .mermaid svg {
          max-width: 100% !important;
          height: auto !important;
          background: white !important;
        }
        
        /* Ensure images and icons are properly sized */
        img {
          max-width: 100% !important;
          height: auto !important;
        }        .markdown-body blockquote, .markdown-alert {
          background-color: #f5f5f5 !important;
        }
        /* Specific Fixes for Tags/Mentions/Links in Print */
        .preview-tag, .preview-mention, .preview-quicklink {
          color: #000000 !important;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          font-weight: 600 !important;
          text-decoration: none !important;
        }
        .preview-quicklink.is-ghost {
          color: #444 !important;
          border-bottom: 1px dashed #999 !important;
        }
        /* Tighter Horizontal Rules */
        .markdown-body hr {
          margin: 1.5em 0 !important;
          background-color: #ddd !important;
          height: 1px !important;
          opacity: 1 !important;
        }
      `
          : ''
      }
    </style>
    ${forPrint ? '' : '<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>'}
    ${forPrint ? '' : `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/${isDark ? 'github-dark' : 'github'}.min.css">`}
    ${forPrint ? '' : '<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>'}
  </head>
`

/**
 * Builds the interactive <script> module.
 */
const buildScript = (isDark, config) => `
  <script>
    ${getMermaidEngine()}
  </script>
  <script type="module">
    const setup = () => {
      // 1. Highlight.js
      if (window.hljs) {
        const highlight = () => {
          document.querySelectorAll('pre code').forEach((block) => {
            if (!block.classList.contains('hljs')) hljs.highlightElement(block);
          });
        };
        highlight();
        setTimeout(highlight, 500);
      }

      // 2. Mermaid Diagram Engine
      if (window.mermaid && window.diagramEngine) {
        window.diagramEngine.init(${JSON.stringify(config)});
        window.diagramEngine.run();
        setTimeout(() => window.diagramEngine.run(), 1000);
      }

      // 3. Interactions (Copy Code)
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.copy-code-btn');
        if (btn) {
          const raw = btn.dataset.code.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
          navigator.clipboard.writeText(raw).then(() => {
            const old = btn.innerHTML;
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
            btn.style.color = 'var(--color-success)';
            setTimeout(() => { btn.innerHTML = old; btn.style.color = ''; }, 2000);
          });
        }
      });
    };
    window.addEventListener('load', setup);
    setup(); 
  </script>
`

/**
 * Main Generation Entry Point
 */
export const generatePreviewHtml = async ({
  code = '',
  title = 'Untitled Snippet',
  theme = 'midnight-syntax',
  existingTitles = [],
  isMarkdown = true,
  fontFamily = "'Outfit', 'Inter', sans-serif",
  forPrint = false
}) => {
  const isDark = forPrint ? false : !['polaris', 'minimal-gray', 'solar-dawn'].includes(theme)
  const currentTheme = forPrint ? 'solar-dawn' : theme

  // Generate CSS Variables for the Theme
  const currentThemeObj = themes.find((t) => t.id === theme) || themes[0]
  const cssVars = Object.entries(currentThemeObj.colors || {})
    .filter(([key]) => key.startsWith('--'))
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n')

  const themeVars = `
    :root {
      ${cssVars}
    }
  `

  if (!code || !code.trim()) {
    return `<!DOCTYPE html><html class="${isDark ? 'dark' : ''}"><head><meta charset="utf-8"><style>${variableStyles} ${themeVars} html,body{background:transparent !important;}</style></head><body></body></html>`
  }

  let contentHtml = ''
  if (isMarkdown) {
    // Hide intel (word count/read time) for print/export views
    contentHtml = await markdownWorkerClient.parseMarkdown(code, { renderMetadata: !forPrint })
  } else {
    // Escaped content for general snippets (Code or Text)
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Use a cleaner simple pre for plaintext to differentiate from "Source Code"
    contentHtml = `
      <div class="code-block-wrapper is-plaintext">
         <div class="code-block-header">
           <span class="code-language font-bold" style="opacity:0.6">Raw Text</span>
           <button class="copy-code-btn" data-code="${escaped}" title="Copy text">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
           </button>
         </div>
         <pre style="white-space: pre-wrap; word-wrap: break-word;"><code class="language-plaintext" style="background:transparent !important; padding:0 !important;">${escaped}</code></pre>
      </div>`
  }

  const mermaidConfig = getMermaidConfig(isDark, fontFamily)

  return `
<!DOCTYPE html>
<html data-theme="${currentTheme}" class="${currentTheme} ${isDark ? 'dark' : ''}" style="height: 100%;">
  ${buildHeader(title, currentTheme, isDark, fontFamily, themeVars, forPrint)}
  <body class="markdown-body" style="${forPrint ? 'background: white !important;' : ''}">
    <div class="preview-container" style="${forPrint ? 'background: white !important;' : ''}">
      <div id="content" style="width: 100%;">${contentHtml}</div>
    </div>
    ${buildScript(isDark, mermaidConfig)}
  </body>
</html>
  `.trim()
}
