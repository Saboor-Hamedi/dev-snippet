/**
 * miniBrowserGenerator.js
 * Generates standalone HTML for Mini Browser with proper theme application.
 * DRY: Centralized theme-aware HTML generation.
 */

import markdownStyles from '../../assets/markdown.css?raw'
import variableStyles from '../../assets/variables.css?raw'
import previewStyles from '../../assets/preview.css?raw'
import { markdownToHtml } from '../../utils/markdownParser'
import { themes } from '../preference/theme/themes'

/**
 * Builds theme CSS variables from theme object
 */
const buildThemeVars = (themeObj, settings = {}) => {
  const cssVars = Object.entries(themeObj.colors || {})
    .filter(([key]) => key.startsWith('--'))
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n')

  // Apply syntax highlighting overrides from settings
  const syntaxSettings = settings.syntax || {}
  const varMap = {
    keyword: '--color-syntax-keyword',
    string: '--color-syntax-string',
    variable: '--color-syntax-variable',
    number: '--color-syntax-number',
    comment: '--color-syntax-comment',
    function: '--color-syntax-function',
    operator: '--color-syntax-punctuation',
    bool: '--color-syntax-boolean'
  }

  const overrides = Object.entries(syntaxSettings)
    .filter(([key]) => varMap[key])
    .map(([key, value]) => `${varMap[key]}: ${value} !important;`)
    .join('\n')

  return `
    :root {
      ${cssVars}
      ${overrides}
      --editor-font-size: ${((settings.editor?.fontSize || 14) * 1) / 16}rem;
    }
  `
}

/**
 * Builds the complete HTML document with theme applied
 */
export const generateMiniBrowserHtml = async ({
  code = '',
  title = 'Untitled',
  theme = 'midnight-pro',
  snippets = [],
  fontFamily = "'Outfit', 'Inter', sans-serif",
  settings = {}
}) => {
  const isDark = !['polaris', 'minimal-gray', 'latte', 'solar-dawn', 'quiet-light'].includes(theme)
  const currentThemeObj = themes.find((t) => t.id === theme) || themes[0]
  const themeVars = buildThemeVars(currentThemeObj, settings)
  const existingTitles = (snippets || []).map((s) => (s.title || '').trim()).filter(Boolean)

  // Determine if content is markdown
  const ext = title?.includes('.') ? title.split('.').pop()?.toLowerCase() : null
  const isMarkdown = !ext || ext === 'markdown' || ext === 'md'

  // Generate content HTML
  let contentHtml = ''
  if (isMarkdown && code) {
    contentHtml = await markdownToHtml(code, {
      renderMetadata: true,
      titles: existingTitles
    })
  } else if (code) {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    contentHtml = `
      <div class="code-block-wrapper ${ext === 'plaintext' || ext === 'text' || ext === 'txt' ? 'is-plaintext' : ''}">
        <div class="code-block-header">
          <span class="code-language font-bold">${ext || 'text'}</span>
          <button class="copy-code-btn" data-code="${escaped}" title="Copy code">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <pre><code class="language-${ext || 'text'}">${escaped}</code></pre>
      </div>`
  }

  // Build complete HTML
  return `
<!DOCTYPE html>
<html data-theme="${theme}" class="${theme} ${isDark ? 'dark' : ''}" style="height: 100%;">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      ${variableStyles}
      ${themeVars}
      ${markdownStyles.replace(/@import\s+['"][^'"]+['"];/g, '')}
      ${previewStyles}

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        width: 100% !important;
        height: 100% !important;
        background-color: var(--color-bg-primary, ${isDark ? '#0d1117' : '#ffffff'}) !important;
        color: var(--color-text-primary, ${isDark ? '#e6edf3' : '#1f2328'}) !important;
        min-height: 100vh !important;
        display: flex;
        flex-direction: column;
        color-scheme: ${isDark ? 'dark' : 'light'};
        align-items: center !important;
      }

      .preview-container {
        width: 100% !important;
        max-width: 900px;
        padding: 40px;
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

      .markdown-body, .actor, .node label {
        font-family: ${fontFamily}, 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        color: inherit !important;
      }

      pre code {
        font-family: 'JetBrains Mono', monospace !important;
      }

      /* Premium Scrollbars */
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: rgba(139, 148, 158, 0.2);
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(139, 148, 158, 0.4);
      }
    </style>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/${isDark ? 'github-dark' : 'github'}.min.css">
    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
  </head>
  <body class="markdown-body">
    <div class="preview-container">
      <div id="content" style="width: 100%;">${contentHtml}</div>
    </div>
    <script>
      const setup = () => {
        // Highlight.js
        if (window.hljs) {
          const highlight = () => {
            document.querySelectorAll('pre code').forEach((block) => {
              if (!block.classList.contains('hljs')) {
                try {
                  hljs.highlightElement(block);
                } catch (e) {
                  console.warn('Highlight failed:', e);
                }
              }
            });
          };
          highlight();
          setTimeout(highlight, 500);
        }

        // Copy Code Button
        document.addEventListener('click', (e) => {
          const btn = e.target.closest('.copy-code-btn');
          if (btn) {
            try {
              const encoded = btn.dataset.code || '';
              let raw = '';
              try {
                const binaryString = atob(encoded);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                raw = new TextDecoder().decode(bytes);
              } catch (e) {
                raw = decodeURIComponent(encoded);
              }

              navigator.clipboard.writeText(raw).then(() => {
                const old = btn.innerHTML;
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
                btn.style.color = 'var(--color-success, #28a745)';
                setTimeout(() => {
                  btn.innerHTML = old;
                  btn.style.color = '';
                }, 2000);
              });
            } catch (err) {
              console.error('Copy failed:', err);
            }
          }
        });
      };

      window.addEventListener('load', setup);
      setup();
    </script>
  </body>
</html>
  `.trim()
}
