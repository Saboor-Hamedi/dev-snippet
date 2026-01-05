/**
 * AI Service
 * Handles communication with DeepSeek API
 */

const API_URL = 'https://api.deepseek.com/v1/chat/completions'

export const AIService = {
  /**
   * Send a chat request to DeepSeek
   */
  async chat({ apiKey, model, temperature, messages }) {
    if (!apiKey) {
      throw new Error('DeepSeek API Key is missing. Please configure it in Settings.')
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'deepseek-chat',
          messages: messages,
          temperature: temperature ?? 0.7,
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error?.message || `API Error: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()
      return data.choices[0].message
    } catch (error) {
      console.error('AI Service Error:', error)
      throw error
    }
  }
}
