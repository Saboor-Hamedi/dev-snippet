/**
 * Performance Benchmarks for DevSnippet Critical Operations
 * 
 * Run with: node --expose-gc src/test/performance/critical-operations.bench.js
 */

// Check for required dependencies
let Database
try {
  const betterSqlite3 = await import('better-sqlite3')
  Database = betterSqlite3.default
} catch (err) {
  console.error('\n❌ Missing dependency: better-sqlite3')
  console.error('This benchmark requires better-sqlite3 to be installed.')
  console.error('\nThe benchmark suite is designed to run in the context of the full DevSnippet app.')
  console.error('To run benchmarks in production, the app must be built first.\n')
  console.error('For development testing:')
  console.error('  npm install (if not already done)')
  console.error('  npm run dev (to ensure all dependencies are built)\n')
  process.exit(1)
}

import { performance } from 'perf_hooks'
import {
  benchmark,
  compareBenchmarks,
  formatBenchmarkReport,
  assertPerformance
} from './benchmark.utils.js'

// Mock database setup
function setupTestDatabase(snippetCount = 1000) {
  const db = new Database(':memory:')
  
  // Create schema
  db.exec(`
    CREATE TABLE snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT,
      tags TEXT,
      language TEXT,
      is_deleted INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      timestamp INTEGER,
      code_draft TEXT,
      folder_id TEXT
    );
    
    CREATE VIRTUAL TABLE snippets_fts USING fts5(
      id UNINDEXED,
      title,
      code,
      tags,
      content='snippets',
      content_rowid='rowid'
    );
    
    CREATE TRIGGER snippets_ai AFTER INSERT ON snippets BEGIN
      INSERT INTO snippets_fts(rowid, id, title, code, tags)
      VALUES (new.rowid, new.id, new.title, new.code, new.tags);
    END;
  `)
  
  // Insert test data
  const insert = db.prepare(`
    INSERT INTO snippets (id, title, code, tags, timestamp, is_deleted)
    VALUES (?, ?, ?, ?, ?, 0)
  `)
  
  const languages = ['javascript', 'python', 'markdown', 'sql', 'css']
  const tagSets = ['react,hooks', 'algorithm,sorting', 'database,optimization', 'ui,component', 'api,rest']
  
  for (let i = 0; i < snippetCount; i++) {
    const id = `snippet-${i}`
    const title = `Test Snippet ${i} - ${languages[i % languages.length]}`
    const code = `# ${title}\n\nThis is test content for snippet ${i}.\n${'Lorem ipsum '.repeat(50)}`
    const tags = tagSets[i % tagSets.length]
    
    insert.run(id, title, code, tags, Date.now() - (i * 1000))
  }
  
  return db
}

/**
 * Benchmark: Full-Text Search (FTS5)
 * Target: < 10ms mean, < 50ms p95
 */
async function benchmarkSearch() {
  console.log('\n🔍 Benchmarking Full-Text Search...\n')
  
  const db = setupTestDatabase(10000) // 10k snippets
  
  // Test queries
  const queries = [
    'javascript',
    'react hooks',
    'algorithm sorting',
    'database optimization',
    'test snippet'
  ]
  
  const results = []
  
  for (const query of queries) {
    const stats = await benchmark(`FTS Search: "${query}"`, () => {
      const terms = query.split(/\s+/).filter(Boolean)
      const ftsQuery = terms.map(term => `"${term}"*`).join(' AND ')
      
      const result = db.prepare(`
        SELECT s.id, s.title, s.code, s.timestamp
        FROM (
          SELECT rowid, rank 
          FROM snippets_fts 
          WHERE snippets_fts MATCH ? 
          ORDER BY bm25(snippets_fts, 10.0, 1.0, 5.0) 
          LIMIT 10
        ) as fts
        JOIN snippets s ON s.rowid = fts.rowid
        WHERE s.is_deleted = 0
        ORDER BY fts.rank
      `).all(ftsQuery)
      
      return result
    }, { iterations: 500, warmup: 50 })
    
    results.push(stats)
    
    // Assert performance requirements
    try {
      assertPerformance(stats, { maxMean: 10, maxP95: 50 })
      console.log(`✅ PASS: ${stats.name}`)
    } catch (err) {
      console.log(`❌ FAIL: ${stats.name}`)
      console.log(`   ${err.message}`)
    }
    
    console.log(formatBenchmarkReport(stats))
  }
  
  db.close()
  
  return results
}

/**
 * Benchmark: Snippet Save Operation
 * Target: < 20ms mean, < 100ms p95
 */
async function benchmarkSave() {
  console.log('\n💾 Benchmarking Snippet Save...\n')
  
  const db = setupTestDatabase(1000)
  
  let counter = 10000
  
  const stats = await benchmark('Snippet Save (INSERT)', () => {
    const id = `snippet-new-${counter++}`
    const title = `New Snippet ${counter}`
    const code = `# ${title}\n\nContent here...`
    
    db.prepare(`
      INSERT OR REPLACE INTO snippets (id, title, code, language, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, title, code, 'markdown', Date.now())
  }, { iterations: 1000, warmup: 100 })
  
  console.log(formatBenchmarkReport(stats))
  
  try {
    assertPerformance(stats, { maxMean: 20, maxP95: 100 })
    console.log('✅ PASS: Snippet Save')
  } catch (err) {
    console.log('❌ FAIL: Snippet Save')
    console.log(`   ${err.message}`)
  }
  
  db.close()
  
  return stats
}

/**
 * Benchmark: Virtual List Rendering Simulation
 * Target: < 16ms (60fps), < 33ms p95
 */
async function benchmarkVirtualList() {
  console.log('\n📜 Benchmarking Virtual List Rendering...\n')
  
  const db = setupTestDatabase(10000)
  
  // Simulate fetching visible items (overscan = 15 rows * 30px = 450px)
  const itemHeight = 30
  const visibleCount = 30
  const overscan = 15
  const totalToFetch = visibleCount + (overscan * 2)
  
  const stats = await benchmark('Virtual List Fetch', () => {
    const offset = Math.floor(Math.random() * 9900) // Random scroll position
    
    const rows = db.prepare(`
      SELECT id, title, tags, is_pinned, is_favorite, timestamp
      FROM snippets
      WHERE is_deleted = 0
      ORDER BY is_pinned DESC, timestamp DESC
      LIMIT ? OFFSET ?
    `).all(totalToFetch, offset)
    
    return rows
  }, { iterations: 500, warmup: 50 })
  
  console.log(formatBenchmarkReport(stats))
  
  try {
    assertPerformance(stats, { maxMean: 16, maxP95: 33 })
    console.log('✅ PASS: Virtual List (60fps)')
  } catch (err) {
    console.log('❌ FAIL: Virtual List')
    console.log(`   ${err.message}`)
  }
  
  db.close()
  
  return stats
}

/**
 * Benchmark: WikiLink Resolution
 * Target: < 5ms (fast lookup via index)
 */
async function benchmarkWikiLink() {
  console.log('\n🔗 Benchmarking WikiLink Resolution...\n')
  
  const db = setupTestDatabase(5000)
  
  // Create index for title lookups
  db.exec('CREATE INDEX IF NOT EXISTS idx_snippets_title ON snippets(title COLLATE NOCASE)')
  
  const testTitles = [
    'Test Snippet 0 - javascript',
    'Test Snippet 100 - python',
    'Test Snippet 500 - markdown',
    'Test Snippet 1000 - sql'
  ]
  
  const results = []
  
  for (const title of testTitles) {
    const stats = await benchmark(`WikiLink Resolve: "${title}"`, () => {
      const row = db.prepare(`
        SELECT id, title, code
        FROM snippets
        WHERE title = ? COLLATE NOCASE AND is_deleted = 0
      `).get(title)
      
      return row
    }, { iterations: 1000, warmup: 100 })
    
    results.push(stats)
    
    console.log(formatBenchmarkReport(stats))
    
    try {
      assertPerformance(stats, { maxMean: 5, maxP95: 10 })
      console.log(`✅ PASS: ${stats.name}`)
    } catch (err) {
      console.log(`❌ FAIL: ${stats.name}`)
      console.log(`   ${err.message}`)
    }
  }
  
  db.close()
  
  return results
}

/**
 * Benchmark: Markdown Parsing (Worker Simulation)
 * Target: < 100ms for medium files (5KB), < 500ms for large files (50KB)
 */
async function benchmarkMarkdownParsing() {
  console.log('\n📝 Benchmarking Markdown Parsing...\n')
  
  const { unified } = await import('unified')
  const remarkParse = (await import('remark-parse')).default
  const remarkGfm = (await import('remark-gfm')).default
  const remarkRehype = (await import('remark-rehype')).default
  const rehypeStringify = (await import('rehype-stringify')).default
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
  
  const smallDoc = '# Hello\n\nThis is a test.\n\n- Item 1\n- Item 2\n\n```js\nconst x = 1\n```\n'
  const mediumDoc = smallDoc.repeat(20) // ~5KB
  const largeDoc = smallDoc.repeat(200) // ~50KB
  
  const tests = [
    { name: 'Small Document (~500B)', content: smallDoc, maxMean: 20 },
    { name: 'Medium Document (~5KB)', content: mediumDoc, maxMean: 100 },
    { name: 'Large Document (~50KB)', content: largeDoc, maxMean: 500 }
  ]
  
  for (const test of tests) {
    const stats = await benchmark(`Markdown Parse: ${test.name}`, async () => {
      await processor.process(test.content)
    }, { iterations: 100, warmup: 10 })
    
    console.log(formatBenchmarkReport(stats))
    
    try {
      assertPerformance(stats, { maxMean: test.maxMean })
      console.log(`✅ PASS: ${stats.name}`)
    } catch (err) {
      console.log(`❌ FAIL: ${stats.name}`)
      console.log(`   ${err.message}`)
    }
  }
}

/**
 * Run all benchmarks and generate report
 */
async function runAllBenchmarks() {
  console.log('🚀 DevSnippet Performance Benchmark Suite\n')
  console.log('Target Performance Requirements:')
  console.log('  - Search Query: < 10ms mean, < 50ms p95')
  console.log('  - Snippet Save: < 20ms mean, < 100ms p95')
  console.log('  - Virtual List: < 16ms (60fps)')
  console.log('  - WikiLink Resolve: < 5ms')
  console.log('  - Markdown Parse: < 100ms (medium), < 500ms (large)')
  console.log('=' .repeat(60))
  
  const startTime = performance.now()
  
  try {
    await benchmarkSearch()
    await benchmarkSave()
    await benchmarkVirtualList()
    await benchmarkWikiLink()
    await benchmarkMarkdownParsing()
  } catch (error) {
    console.error('\n❌ Benchmark suite failed:', error)
    process.exit(1)
  }
  
  const totalTime = performance.now() - startTime
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ All benchmarks completed in ${(totalTime / 1000).toFixed(2)}s`)
  console.log('='.repeat(60))
}

// Run benchmarks (always execute when run directly via node)
runAllBenchmarks().catch(console.error)

export {
  benchmarkSearch,
  benchmarkSave,
  benchmarkVirtualList,
  benchmarkWikiLink,
  benchmarkMarkdownParsing
}
