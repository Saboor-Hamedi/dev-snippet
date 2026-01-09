/**
 * Standalone Benchmark Demo
 * No database dependencies - pure JavaScript performance testing
 * 
 * Run with: node src/test/performance/demo.bench.js
 */

import { performance } from 'perf_hooks'
import {
  benchmark,
  formatBenchmarkReport,
  assertPerformance,
  compareBenchmarks
} from './benchmark.utils.js'

/**
 * Benchmark: Array Operations
 */
async function benchmarkArraySort() {
  console.log('\n📊 Benchmarking Array Sort...\n')
  
  const stats = await benchmark('Array.sort (1000 items)', () => {
    const arr = Array.from({ length: 1000 }, () => Math.random())
    arr.sort((a, b) => a - b)
    return arr
  }, { iterations: 500, warmup: 50 })
  
  console.log(formatBenchmarkReport(stats))
  
  try {
    assertPerformance(stats, { maxMean: 5 })
    console.log('✅ PASS: Array sort performance acceptable')
  } catch (err) {
    console.log('⚠️  Note:', err.message)
  }
  
  return stats
}

/**
 * Benchmark: String Operations
 */
async function benchmarkStringOps() {
  console.log('\n📝 Benchmarking String Operations...\n')
  
  const text = 'Hello World '.repeat(100)
  
  const replaceStats = await benchmark('String.replace (regex)', () => {
    return text.replace(/World/g, 'DevSnippet')
  }, { iterations: 1000, warmup: 100 })
  
  const splitStats = await benchmark('String.split + join', () => {
    return text.split(' ').join('-')
  }, { iterations: 1000, warmup: 100 })
  
  console.log(formatBenchmarkReport(replaceStats))
  console.log(formatBenchmarkReport(splitStats))
  
  // Compare the two approaches
  const comparison = compareBenchmarks([replaceStats, splitStats])
  console.log(`\n🏆 Winner: ${comparison.winner.name}`)
  console.log(`   ${comparison.improvement}% faster than ${comparison.loser.name}`)
  
  return { replaceStats, splitStats }
}

/**
 * Benchmark: Object Operations
 */
async function benchmarkObjectOps() {
  console.log('\n🔧 Benchmarking Object Operations...\n')
  
  const data = { id: 1, name: 'Test', tags: ['a', 'b', 'c'] }
  
  const spreadStats = await benchmark('Object spread', () => {
    return { ...data, updated: Date.now() }
  }, { iterations: 10000, warmup: 1000 })
  
  const assignStats = await benchmark('Object.assign', () => {
    return Object.assign({}, data, { updated: Date.now() })
  }, { iterations: 10000, warmup: 1000 })
  
  console.log(formatBenchmarkReport(spreadStats))
  console.log(formatBenchmarkReport(assignStats))
  
  const comparison = compareBenchmarks([spreadStats, assignStats])
  console.log(`\n🏆 Winner: ${comparison.winner.name}`)
  console.log(`   ${comparison.improvement}% faster`)
  
  return { spreadStats, assignStats }
}

/**
 * Benchmark: JSON Operations
 */
async function benchmarkJSON() {
  console.log('\n📦 Benchmarking JSON Operations...\n')
  
  const obj = {
    id: 1,
    title: 'DevSnippet Performance Test',
    tags: ['benchmark', 'performance', 'testing'],
    nested: {
      deep: {
        value: 'test'
      }
    }
  }
  
  const stats = await benchmark('JSON.stringify + parse', () => {
    const json = JSON.stringify(obj)
    return JSON.parse(json)
  }, { iterations: 5000, warmup: 500 })
  
  console.log(formatBenchmarkReport(stats))
  
  try {
    assertPerformance(stats, { maxMean: 0.1 })
    console.log('✅ PASS: JSON operations very fast')
  } catch (err) {
    console.log('⚠️  Note:', err.message)
  }
  
  return stats
}

/**
 * Run all standalone benchmarks
 */
async function runStandaloneBenchmarks() {
  console.log('🚀 DevSnippet Standalone Benchmark Demo\n')
  console.log('Demonstrating benchmark framework with pure JavaScript')
  console.log('No database or native modules required!\n')
  console.log('='.repeat(60))
  
  const startTime = performance.now()
  
  await benchmarkArraySort()
  await benchmarkStringOps()
  await benchmarkObjectOps()
  await benchmarkJSON()
  
  const totalTime = performance.now() - startTime
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ All standalone benchmarks completed in ${(totalTime / 1000).toFixed(2)}s`)
  console.log('='.repeat(60))
  console.log('\n💡 The benchmark framework is working perfectly!')
  console.log('   Create your own benchmarks using benchmark.utils.js')
}

// Run benchmarks
runStandaloneBenchmarks().catch(console.error)
