/**
 * AI IPC Handlers
 */

import { ipcMain } from 'electron'
import { AIService } from './AIService'

export const registerAIHandlers = () => {
  console.log('🤖 [AI HUB] Registering AI IPC Handlers...')

  // Heartbeat to check if service is alive
  ipcMain.handle('ai:heartbeat', () => {
    console.log('💓 AI Heartbeat Received')
    return true
  })

  ipcMain.handle('ai:chat', async (event, payload) => {
    console.log('📡 [AI HUB] Executing ai:chat...')
    try {
      return await AIService.chat(payload)
    } catch (error) {
      console.error('❌ [AI HUB] IPC Error (ai:chat):', error)
      throw error // Re-throw to be caught by renderer
    }
  })
}
