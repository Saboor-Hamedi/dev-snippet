#!/usr/bin/env node
/**
 * One-time migration script to move existing snippet content from SQLite DB to individual files.
 * This should be run once after upgrading to file-backed storage.
 */

const path = require('path')
const fs = require('fs').promises
const Database = require('better-sqlite3')

async function migrateSnippets() {
  console.log('🚀 Starting snippet migration...')
  
  try {
    // Determine the app data path (same logic as main process)
    const { app } = require('electron')
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'snippets.db')
    const snippetsDir = path.join(userDataPath, 'snippets')
    
    console.log(`📂 Database: ${dbPath}`)
    console.log(`📁 Snippets directory: ${snippetsDir}`)
    
    // Open database
    const db = new Database(dbPath)
    
    // Get all snippets with content
    const snippets = db.prepare('SELECT id, title, code FROM snippets WHERE code IS NOT NULL AND code != ""').all()
    
    console.log(`📝 Found ${snippets.length} snippets with content to migrate`)
    
    if (snippets.length === 0) {
      console.log('✅ No snippets need migration')
      db.close()
      return
    }
    
    // Ensure snippets directory exists
    await fs.mkdir(snippetsDir, { recursive: true })
    
    let migrated = 0
    let skipped = 0
    
    for (const snippet of snippets) {
      const safeId = String(snippet.id).replace(/[^A-Za-z0-9._-]/g, '_')
      const filePath = path.join(snippetsDir, `${safeId}.md`)
      
      try {
        // Check if file already exists
        await fs.access(filePath)
        console.log(`⏭️  Skipping ${safeId} (file already exists)`)
        skipped++
        continue
      } catch (err) {
        // File doesn't exist, create it
      }
      
      // Write content to file
      const content = snippet.code || ''
      const tmpPath = filePath + '.tmp'
      
      await fs.writeFile(tmpPath, content, 'utf8')
      await fs.rename(tmpPath, filePath)
      
      // Update DB to clear the code field and keep only title
      const titleFromCode = content.split('\n')[0].trim() || snippet.title || 'Untitled'
      db.prepare('UPDATE snippets SET code = ? WHERE id = ?').run(titleFromCode, snippet.id)
      
      console.log(`✅ Migrated: ${safeId} → ${path.basename(filePath)}`)
      migrated++
    }
    
    db.close()
    
    console.log(`\n🎉 Migration complete!`)
    console.log(`   - Migrated: ${migrated} snippets`)
    console.log(`   - Skipped: ${skipped} snippets`)
    console.log(`   - Files location: ${snippetsDir}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  migrateSnippets().catch(console.error)
}

module.exports = { migrateSnippets }