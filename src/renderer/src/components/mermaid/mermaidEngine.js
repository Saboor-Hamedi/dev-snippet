export const getMermaidEngine = () => `
  window.diagramEngine = {
    init: (config) => {
      if (!window.mermaid) return;
      try {
        window.mermaid.initialize(config);
      } catch (e) { console.error("Mermaid Init Error:", e); }
    },
    run: async () => {
      if (!window.mermaid) return;
      
      const elements = document.querySelectorAll('.mermaid:not([data-processed="true"])');
      if (elements.length === 0) return;

      try {
        // Use the modern mermaid.run API for better performance and error handling
        await window.mermaid.run({
          nodes: Array.from(elements),
          suppressErrors: false
        });
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        
        // Manual fallback/error display for nodes that failed
        elements.forEach(node => {
          if (!node.getAttribute('data-processed')) {
            node.setAttribute('data-processed', 'error');
            const msg = (err.message || "Syntax Error").split(String.fromCharCode(10))[0];
            node.innerHTML = '<div class="mermaid-error-container" style="background: rgba(255, 0, 0, 0.05); border: 1px solid rgba(255, 0, 0, 0.2); border-radius: 8px; padding: 16px; margin: 10px 0; color: #ef4444; font-family: inherit;">' +
                '<div class="mermaid-error-title" style="font-weight: bold; margin-bottom: 4px;">Diagram Syntax Error</div>' +
                '<div class="text-xs opacity-70" style="font-size: 12px; line-height: 1.4; word-break: break-word;">' + msg + '</div>' +
              '</div>';
          }
        });
      }
    }
  };
`
