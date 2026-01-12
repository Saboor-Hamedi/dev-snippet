import React, { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, Sparkles, FileText, Eraser, Terminal, Zap, Copy, Check } from 'lucide-react'
import './AIPilot.css'
import { useSettings } from '../../hook/useSettingsContext'
import { useToast } from '../../hook/useToast'
import { markdownToHtml } from '../../utils/markdownParser'

/**
 * AIMessageContent
 * Asynchronously renders markdown content for AI messages.
 * Extracted to root level to prevent re-mounting during parent renders.
 */
const AIMessageContent = ({ content }) => {
  const [html, setHtml] = useState('')

  useEffect(() => {
    let isMounted = true
    
    if (!content) {
      setHtml('')
      return
    }

    markdownToHtml(content, { minimal: true, renderMetadata: false }).then((res) => {
      if (isMounted) setHtml(res)
    })
    
    return () => {
      isMounted = false
    }
  }, [content])

  // If HTML is ready, show it.
  // If not, but we have raw content (streaming), show that in a pre-wrap div.
  // This ensures text is NEVER hidden.
  if (html) {
    return (
      <div
        className="ai-markdown-render markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  
  // Fallback: Raw text mode (essential for streaming validity)
  return (
    <div className="whitespace-pre-wrap font-mono text-sm opacity-90 leading-relaxed break-words min-h-[20px]">
      {content}
    </div>
  )
}

const CopyButton = ({ content }) => {
    const [copied, setCopied] = useState(false)
    
    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button 
           onClick={handleCopy}
           className="clean-copy-btn flex items-center gap-2 px-0 py-1 text-left opacity-60 hover:opacity-100 transition-opacity bg-transparent hover:bg-transparent theme-exempt text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)]"
           title="Copy full response"
           style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
    )
}

/**
 * AIPilot
 *
 * The intelligent chat interface powered by DeepSeek.
 */
const AIPilot = ({ scale, selectedSnippet }) => {
  const { settings } = useSettings()
  const { showToast } = useToast()

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I'm your **DeepSeek Pilot**. I can help you document, refactor, or explain your snippets. What are we working on today?"
    }
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const messagesRef = useRef(null)
  const messagesInnerRef = useRef(null)

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: instant ? 'auto' : 'smooth',
        block: 'end'
      })
    }
  }

  // Effect to scroll whenever the messages array or thinking state changes
  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking])

  // Removed ResizeObserver to prevent layout thrashing/shaking.
  // We rely on CSS overflow-anchor: auto for content growth stability.

  // Check AI health on mount
  useEffect(() => {
    window.api
      .invoke('ai:heartbeat')
      .then(() => console.log('AI System: ONLINE'))
      .catch((err) => console.error('AI System: OFFLINE', err))

    // Check for API Key (Reactive)
    if (!settings?.ai?.apiKey && !messages.some((m) => m.content.includes('No API Key Found'))) {
      const ms = [
        ...messages,
        {
          role: 'assistant',
          content:
            '⚠️ **No API Key Found**\n\nTo start using the AI Pilot, please go to **Settings > AI** and configure your DeepSeek API Key.'
        }
      ]
      setMessages(ms)
    }
  }, [settings?.ai?.apiKey]) // Re-run only when key changes (or on mount/hydration)

  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsThinking(true)

    if (!settings?.ai?.apiKey) {
      showToast('DeepSeek API Key is missing', 'error')
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              '🚫 **API Key Missing**\nPlease configure your API key in Settings to continue.'
          }
        ])
        setIsThinking(false)
      }, 600)
      return
    }

    if (!navigator.onLine) {
      showToast('No internet connection', 'error')
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              '🌐 **Offline Mode**\nPlease check your internet connection to use the AI Pilot.'
          }
        ])
        setIsThinking(false)
      }, 600)
      return
    }

    try {
      // 1. Prepare systematic context (System prompts guide the AI's behavior)
      const contextMessages = [
        {
          role: 'system',
          content: `You are DeepSeek Pilot, a high-performance AI assistant integrated into DevSnippet (a professional workstation for developers).
          Current Workspace: ${selectedSnippet ? `Snippet "${selectedSnippet.title}" (${selectedSnippet.language})` : 'Personal Library'}
          ${selectedSnippet ? `Snippet Content:\n${selectedSnippet.code}` : ''}
          
          Guidelines:
          - Be concise and technical.
          - Use Markdown for code blocks.
          - If the user asks to refactor, provide optimized code with explanations.
          - If the user asks questions about the current snippet, use the provided content as context.`
        }
      ]

      // 2. Prepare payload (Forward relevant settings and chat history)
      const payload = {
        apiKey: settings.ai?.apiKey,
        model: settings.ai?.model,
        temperature: settings.ai?.temperature,
        messages: [...contextMessages, ...newMessages]
      }

      // 3. Invoke Secure Main Process Service
      console.log('📡 Sending AI Request:', payload.model)
      const response = await window.api.invoke('ai:chat', payload)
      console.log('✅ AI Response Received')

      setMessages((prev) => [...prev, response])
    } catch (error) {
      console.error('AI Pilot Error (Full):', error)
      showToast(error.message || 'Connection failed. Check your API key or internet.', 'error')
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          "Hello! I'm your **DeepSeek Pilot**. I can help you document, refactor, or explain your snippets. What are we working on today?"
      }
    ])
  }

  return (
    <div className="ai-pilot-container">
      {/* ⚠️ MISSING KEY WARNING BANNER */}
      {(!settings?.ai?.apiKey || settings?.ai?.apiKey === '') && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={12} />
            <span>Connect DeepSeek API</span>
          </span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('app:open-settings'))}
            style={{
              textDecoration: 'underline',
              color: 'inherit',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Settings
          </button>
        </div>
      )}

      {/* STATUS BAR */}
      <div className="ai-pilot-status-bar">
        <div className="ai-pilot-model-badge">
          <Zap size={12} fill="currentColor" />
          <span>
            DeepSeek {settings.ai?.model === 'deepseek-reasoner' ? 'R1 (Reasoner)' : 'V3 (Chat)'}
          </span>
        </div>
        <div className="ai-pilot-context-badge">
          <FileText size={12} />
          <span>Context: {selectedSnippet?.title || 'Personal Workspace'}</span>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="ai-pilot-messages custom-scrollbar" ref={messagesRef}>
        <div className="ai-pilot-messages-inner" ref={messagesInnerRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role}`}>
              <div className="ai-message-avatar">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span>{msg.role === 'user' ? 'You' : 'DeepSeek'}</span>
              </div>
              <div className="ai-message-bubble shadow-sm">
                <div className="prose prose-sm dark:prose-invert">
                  <AIMessageContent content={msg.content} />
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex justify-end mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                     <CopyButton content={msg.content} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="ai-message assistant">
              <div className="ai-message-avatar">
                <Bot size={12} />
                <span>Thinking...</span>
              </div>
              <div className="ai-pilot-thinking">
                <div className="thinking-dot" />
                <div className="thinking-dot" />
                <div className="thinking-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} style={{ height: 1, marginTop: -1 }} />
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="ai-pilot-input-wrapper">
        <div className="ai-pilot-input-container">
          <textarea
            ref={textareaRef}
            className="ai-pilot-textarea custom-scrollbar"
            placeholder="Ask anything... (Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            spellCheck={false}
          />
          <div className="ai-pilot-input-actions">
            <div className="flex gap-2">
              <button className="ai-action-btn" onClick={clearChat} title="Clear history">
                <Eraser size={14} />
              </button>
              <button
                className="ai-action-btn"
                onClick={() =>
                  showToast(
                    'Context analysis is active for: ' +
                      (selectedSnippet?.title || 'Personal Workspace'),
                    'info'
                  )
                }
                title="Add current snippet to context"
              >
                <FileText size={14} />
                <span className="hidden sm:inline">Context</span>
              </button>
              <button
                className="ai-action-btn"
                onClick={() => showToast('AI Script Execution is coming in v1.4.0', 'info')}
                title="Run as script"
              >
                <Terminal size={14} />
              </button>
            </div>
            <button
              className="ai-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
            >
              <span>SEND</span>
              <Send size={12} />
            </button>
          </div>
        </div>
        <div className="ai-pilot-footer-text">
          Powered by DeepSeek AI
        </div>
      </div>
    </div>
  )
}

export default AIPilot
