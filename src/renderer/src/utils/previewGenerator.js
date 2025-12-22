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
import { fastMarkdownToHtml } from './fastMarkdown'

/**
 * Builds the <head> section with all necessary styles and external dependencies.
 */
const buildHeader = (title, theme, isDark, fontFamily, forPrint = false) => `
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      ${variableStyles}
      ${markdownStyles}
      ${mermaidStyles}
      
      html, body { 
        margin: 0; padding: 0; 
        overflow-x: hidden !important; 
        background-color: var(--color-bg-primary, ${isDark ? '#0d1117' : '#ffffff'}) !important;
        color: var(--color-text-primary, ${isDark ? '#e6edf3' : '#1f2328'}) !important;
      }
      .preview-container { 
        width: 100%; max-width: 1200px;
        padding: 5px; margin: 0 auto !important;
        box-sizing: border-box; 
        background: transparent !important;
      }
      .markdown-body, .mermaid-wrapper, .mermaid-diagram, .actor, .node label { 
        font-family: ${fontFamily}, 'Inter', sans-serif !important; 
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
        /* Force zero-transparency for PDF generation window */
        html, body, .preview-container, .markdown-body, #content { 
          background: white !important; 
          background-color: white !important;
          color: #000000 !important; 
        }
        .code-block-header, .copy-code-btn { display: none !important; }
        .code-block-wrapper { 
          box-shadow: none !important; 
          transform: none !important; 
          background-color: #fafafa !important;
        }
        .markdown-body blockquote, .markdown-alert {
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
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/${
      isDark ? 'github-dark' : 'github'
    }.min.css">
    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
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
export const generatePreviewHtml = ({
  code = '',
  title = 'Untitled Snippet',
  theme = 'midnight-syntax',
  existingTitles = [],
  isMarkdown = true,
  fontFamily = "'Outfit', 'Inter', sans-serif",
  forPrint = false
}) => {
  const isDark = forPrint ? false : theme !== 'solar-dawn'
  const currentTheme = forPrint ? 'solar-dawn' : theme

  if (!code || !code.trim()) {
    return `<!DOCTYPE html><html class="${isDark ? 'dark' : ''}"><head><meta charset="utf-8"><style>${variableStyles} html,body{background:transparent !important;}</style></head><body></body></html>`
  }

  let contentHtml = ''
  if (isMarkdown) {
    contentHtml = fastMarkdownToHtml(code, existingTitles)
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
<html data-theme="${currentTheme}" class="${currentTheme} ${isDark ? 'dark' : ''}">
  ${buildHeader(title, currentTheme, isDark, fontFamily, forPrint)}
  <body class="markdown-body" style="${forPrint ? 'background: white !important;' : ''}">
    <div class="preview-container" style="${forPrint ? 'background: white !important;' : ''}">
      <div id="content">${contentHtml}</div>
    </div>
    ${buildScript(isDark, mermaidConfig)}
  </body>
</html>
  `.trim()
}
