/**
 * MermaidEngine - Optimized for a single-layer premium UI.
 */

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
      
      const nodes = document.querySelectorAll('.mermaid-diagram');
      
      for (const node of nodes) {
        if (node.getAttribute('data-processed')) continue;

        try {
          // 1. Make this node the "Wrapper" (The Styled Layer)
          node.classList.add('mermaid-wrapper');
          
          // 2. Extract and Normalize Code
          let text = node.textContent.trim();
          
          // 3. Render directly into this node
          const id = "m" + Math.random().toString(36).substring(2, 9);
          const { svg } = await window.mermaid.render(id, text);
          
          node.innerHTML = svg;
          node.setAttribute('data-processed', 'true');
        } catch (err) {
          console.error("Mermaid Render Error:", err);
          node.setAttribute('data-processed', 'error');
          const msg = err.message ? err.message.split('\\n')[0] : "Syntax Error";
          node.innerHTML = \`
            <div class="mermaid-error-container">
              <div class="mermaid-error-title">Diagram Error</div>
              <div class="text-xs opacity-70">\${msg}</div>
            </div>\`;
        }
      }
    }
  };
`
