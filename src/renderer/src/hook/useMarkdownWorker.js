import { useState, useCallback, useRef, useEffect } from 'react'
import { markdownWorkerClient } from '../workers/markdownWorkerClient'

/**
 * useMarkdownWorker - A React hook for offloaded Markdown parsing.
 *
 * Provides:
 * - parse: (text, options) => Promise<string>
 * - html: The last rendered HTML
 * - isParsing: Boolean state for loaders
 */
export const useMarkdownWorker = () => {
  const [html, setHtml] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState(null)
  const currentTaskId = useRef(0)

  const parseMarkdown = useCallback(async (text, options = {}) => {
    // 1. Increment Task ID to prioritize latest request
    const taskId = ++currentTaskId.current
    setIsParsing(true)
    setError(null)

    try {
      const result = await markdownWorkerClient.parseMarkdown(text, options)

      // 2. Only update state if this is still the most recent task
      if (taskId === currentTaskId.current) {
        setHtml(result)
        setIsParsing(false)
        return result
      }
    } catch (err) {
      if (taskId === currentTaskId.current) {
        setError(err.message)
        setIsParsing(false)
      }
      throw err
    }
    return null
  }, [])

  const parseCode = useCallback(async (code, language) => {
    const taskId = ++currentTaskId.current
    setIsParsing(true)
    setError(null)

    try {
      const result = await markdownWorkerClient.parseCode(code, language)
      if (taskId === currentTaskId.current) {
        setHtml(result)
        setIsParsing(false)
        return result
      }
    } catch (err) {
      if (taskId === currentTaskId.current) {
        setError(err.message)
        setIsParsing(false)
      }
      throw err
    }
    return null
  }, [])

  return {
    parseMarkdown,
    parseCode,
    html,
    isParsing,
    error
  }
}
