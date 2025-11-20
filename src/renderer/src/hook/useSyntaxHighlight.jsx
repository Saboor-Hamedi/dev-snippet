import { useMemo } from 'react'

const useSyntaxHighlight = (code, language = 'text') => {
  return useMemo(() => {
    if (language === 'text') {
      return <div className="text-content">{code}</div>
    }

    const highlightedCode = highlightCode(code, language)
    return <div className="code-content" dangerouslySetInnerHTML={{ __html: highlightedCode }} />
  }, [code, language])
}

const highlightCode = (code, language) => {
  let highlighted = escapeHtml(code)

  const patterns = {
    javascript: [
      { pattern: /(\/\/.*$)/gm, class: 'comment' },
      { pattern: /(\/\*[\s\S]*?\*\/)/gm, class: 'comment' },
      { pattern: /(["'`](.*?)["'`])/g, class: 'string' },
      {
        pattern:
          /(\b(function|const|let|var|if|else|for|while|return|class|import|export|from|default)\b)/g,
        class: 'keyword'
      },
      { pattern: /(\b(true|false|null|undefined)\b)/g, class: 'constant' },
      { pattern: /(\b(\d+)\b)/g, class: 'number' }
    ],
    python: [
      { pattern: /(#.*$)/gm, class: 'comment' },
      { pattern: /(["'`](.*?)["'`])/g, class: 'string' },
      {
        pattern: /(\b(def|class|if|else|elif|for|while|return|import|from|as|try|except|with)\b)/g,
        class: 'keyword'
      },
      { pattern: /(\b(True|False|None)\b)/g, class: 'constant' },
      { pattern: /(\b(\d+)\b)/g, class: 'number' }
    ],
    html: [
      { pattern: /(&lt;!--[\s\S]*?--&gt;)/g, class: 'comment' },
      { pattern: /(&lt;\/?[a-zA-Z][\w-]*)/g, class: 'tag' },
      { pattern: /(&gt;)/g, class: 'tag' },
      { pattern: /(["'].*?["'])/g, class: 'string' },
      { pattern: /([a-zA-Z-]+)(?=\s*=)/g, class: 'attribute' }
    ],
    css: [
      { pattern: /(\/\/.*$)/gm, class: 'comment' },
      { pattern: /(\/\*[\s\S]*?\*\/)/gm, class: 'comment' },
      { pattern: /(\.|#)?[a-zA-Z][\w-]*(?=\s*\{)/g, class: 'selector' },
      { pattern: /([a-zA-Z-]+)(?=\s*:)/g, class: 'property' },
      { pattern: /(#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b)/g, class: 'color' },
      { pattern: /(\b(\d+)(px|em|rem|%|s)\b)/g, class: 'unit' }
    ]
  }

  const langPatterns = patterns[language] || patterns.javascript

  // Combine patterns into a single regex using named groups
  const patternSources = langPatterns.map((p, i) => `(?<p${i}>${p.pattern.source})`)
  const combinedRegex = new RegExp(patternSources.join('|'), 'gm')

  return highlighted.replace(combinedRegex, (...args) => {
    const groups = args[args.length - 1]
    const matchIndex = langPatterns.findIndex((_, i) => groups[`p${i}`] !== undefined)

    if (matchIndex !== -1) {
      const className = langPatterns[matchIndex].class
      const match = groups[`p${matchIndex}`]
      return `<span class="${className}">${match}</span>`
    }
    return args[0]
  })
}

const escapeHtml = (text) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export default useSyntaxHighlight
