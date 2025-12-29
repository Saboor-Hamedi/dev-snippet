// Collects all snippets, diagrams, and related data for export
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { getDB } from '../../database/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Fetch all snippets with diagrams and metadata for export
 * @param {Object} app - Electron app instance
 * @returns {Promise<Array>} Array of snippet objects
 */
export async function getAllSnippetsWithDiagrams(app) {
  try {
    const db = getDB(app)
    const rows = db.prepare('SELECT id, title, code, language, tags FROM snippets').all()
    // Example: Assume diagrams are stored as files named by snippet id in a diagrams folder
    const diagramDir = path.join(__dirname, '../../../assets/diagrams')
    const snippets = []
    for (const row of rows) {
      let diagrams = []
      try {
        const files = await fs.readdir(diagramDir)
        diagrams = files.filter(f => f.startsWith(row.id)).map(f => path.join(diagramDir, f))
      } catch (err) {
        // Diagrams folder doesn't exist or error reading, skip
        console.warn('Diagrams folder not found or error:', err.message)
      }
      snippets.push({ ...row, diagrams, description: row.tags }) // Map tags to description for compatibility
    }
    return snippets
  } catch (err) {
    throw new Error(`Failed to collect snippets: ${err.message}`)
  }
}
