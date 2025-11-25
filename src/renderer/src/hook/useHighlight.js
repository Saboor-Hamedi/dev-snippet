import { useMemo } from 'react'
import hljs from 'highlight.js/lib/core'

// Import only the languages you need (keep it lightweight)
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import xml from 'highlight.js/lib/languages/xml' // HTML uses XML
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'

// Register languages
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('html', xml) // Register HTML as XML
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sql', sql)

const useHighlight = (code, language = 'text') => {
  return useMemo(() => {
    if (language === 'text' || !code.trim()) {
      return code
    }

    try {
      // Try to highlight with the specified language
      const result = hljs.highlight(code, { language })
      return result.value
    } catch {
      // If language not supported, try auto-detection
      try {
        const result = hljs.highlightAuto(code)
        return result.value
      } catch {
        // Fallback to plain text
        return code
      }
    }
  }, [code, language])
}

export default useHighlight
