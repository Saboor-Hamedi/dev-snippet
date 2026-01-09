/**
 * Performance Benchmarking Utilities for DevSnippet
 * 
 * Provides reproducible performance testing for critical operations.
 * @module benchmark.utils
 */

import { performance } from 'perf_hooks'

/**
 * Benchmark result statistics
 * @typedef {Object} BenchmarkStats
 * @property {number} mean - Average execution time in milliseconds
 * @property {number} median - Median execution time in milliseconds
 * @property {number} min - Minimum execution time in milliseconds
 * @property {number} max - Maximum execution time in milliseconds
 * @property {number} stdDev - Standard deviation in milliseconds
 * @property {number} p95 - 95th percentile in milliseconds
 * @property {number} p99 - 99th percentile in milliseconds
 * @property {number[]} samples - All execution time samples
 */

/**
 * Runs a function multiple times and collects performance metrics
 * 
 * @param {string} name - Benchmark name for reporting
 * @param {Function} fn - Function to benchmark (sync or async)
 * @param {Object} [options={}] - Benchmark options
 * @param {number} [options.iterations=100] - Number of times to run the function
 * @param {number} [options.warmup=10] - Warmup iterations (not counted in stats)
 * @param {Function} [options.beforeEach] - Run before each iteration
 * @param {Function} [options.afterEach] - Run after each iteration
 * @returns {Promise<BenchmarkStats>} Performance statistics
 * 
 * @example
 * const stats = await benchmark('Array.sort', () => {
 *   const arr = Array.from({ length: 1000 }, () => Math.random())
 *   arr.sort()
 * }, { iterations: 500 })
 * 
 * console.log(`Mean: ${stats.mean.toFixed(2)}ms`)
 */
export async function benchmark(name, fn, options = {}) {
  const {
    iterations = 100,
    warmup = 10,
    beforeEach = null,
    afterEach = null
  } = options

  const samples = []

  // Warmup phase
  for (let i = 0; i < warmup; i++) {
    if (beforeEach) await beforeEach()
    await fn()
    if (afterEach) await afterEach()
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    if (beforeEach) await beforeEach()
    
    const start = performance.now()
    await fn()
    const end = performance.now()
    
    samples.push(end - start)
    
    if (afterEach) await afterEach()
  }

  return calculateStats(name, samples)
}

/**
 * Calculate statistical metrics from raw samples
 * 
 * @private
 * @param {string} name - Benchmark name
 * @param {number[]} samples - Array of execution times in milliseconds
 * @returns {BenchmarkStats} Calculated statistics
 */
function calculateStats(name, samples) {
  const sorted = [...samples].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / sorted.length
  
  // Median
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  
  // Standard deviation
  const squaredDiffs = sorted.map(x => Math.pow(x - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / sorted.length
  const stdDev = Math.sqrt(variance)
  
  // Percentiles
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  const p99 = sorted[Math.floor(sorted.length * 0.99)]
  
  return {
    name,
    mean,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev,
    p95,
    p99,
    samples: sorted
  }
}

/**
 * Compare multiple benchmark results and determine performance winner
 * 
 * @param {BenchmarkStats[]} results - Array of benchmark results to compare
 * @returns {Object} Comparison report
 * 
 * @example
 * const result1 = await benchmark('Method A', methodA)
 * const result2 = await benchmark('Method B', methodB)
 * const comparison = compareBenchmarks([result1, result2])
 * console.log(`Winner: ${comparison.winner.name} (${comparison.improvement}% faster)`)
 */
export function compareBenchmarks(results) {
  const sorted = [...results].sort((a, b) => a.mean - b.mean)
  const winner = sorted[0]
  const loser = sorted[sorted.length - 1]
  
  const improvement = ((loser.mean - winner.mean) / loser.mean * 100).toFixed(2)
  
  return {
    winner,
    loser,
    improvement: parseFloat(improvement),
    rankings: sorted.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      mean: r.mean,
      relativeTo: winner.name,
      slowdown: r.mean / winner.mean
    }))
  }
}

/**
 * Format benchmark stats for console output
 * 
 * @param {BenchmarkStats} stats - Benchmark statistics
 * @param {Object} [options={}] - Formatting options
 * @param {boolean} [options.showSamples=false] - Include raw samples in output
 * @returns {string} Formatted benchmark report
 */
export function formatBenchmarkReport(stats, options = {}) {
  const { showSamples = false } = options
  
  const lines = [
    `\n📊 Benchmark: ${stats.name}`,
    `${'='.repeat(50)}`,
    `Mean:      ${stats.mean.toFixed(3)}ms`,
    `Median:    ${stats.median.toFixed(3)}ms`,
    `Min:       ${stats.min.toFixed(3)}ms`,
    `Max:       ${stats.max.toFixed(3)}ms`,
    `Std Dev:   ${stats.stdDev.toFixed(3)}ms`,
    `95th %ile: ${stats.p95.toFixed(3)}ms`,
    `99th %ile: ${stats.p99.toFixed(3)}ms`,
    `Samples:   ${stats.samples.length}`
  ]
  
  if (showSamples) {
    lines.push(`\nRaw Samples (ms):`)
    lines.push(stats.samples.map(s => s.toFixed(3)).join(', '))
  }
  
  return lines.join('\n')
}

/**
 * Memory usage snapshot
 * @typedef {Object} MemorySnapshot
 * @property {number} heapUsed - Heap memory used in MB
 * @property {number} heapTotal - Total heap size in MB
 * @property {number} external - External memory in MB
 * @property {number} rss - Resident set size in MB
 * @property {number} timestamp - Timestamp of snapshot
 */

/**
 * Capture current memory usage
 * 
 * @returns {MemorySnapshot} Memory usage snapshot
 * 
 * @example
 * const before = captureMemory()
 * // ... run operation
 * const after = captureMemory()
 * const delta = after.heapUsed - before.heapUsed
 * console.log(`Memory delta: ${delta.toFixed(2)}MB`)
 */
export function captureMemory() {
  const mem = process.memoryUsage()
  return {
    heapUsed: mem.heapUsed / 1024 / 1024,
    heapTotal: mem.heapTotal / 1024 / 1024,
    external: mem.external / 1024 / 1024,
    rss: mem.rss / 1024 / 1024,
    timestamp: Date.now()
  }
}

/**
 * Run a benchmark with memory profiling
 * 
 * @param {string} name - Benchmark name
 * @param {Function} fn - Function to profile
 * @param {Object} [options={}] - Options (same as benchmark())
 * @returns {Promise<{stats: BenchmarkStats, memory: {before: MemorySnapshot, after: MemorySnapshot, delta: number}}>}
 * 
 * @example
 * const result = await benchmarkWithMemory('Large Array', () => {
 *   return new Array(1000000).fill(0)
 * })
 * console.log(`Memory increase: ${result.memory.delta.toFixed(2)}MB`)
 */
export async function benchmarkWithMemory(name, fn, options = {}) {
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  const memBefore = captureMemory()
  const stats = await benchmark(name, fn, options)
  const memAfter = captureMemory()
  
  return {
    stats,
    memory: {
      before: memBefore,
      after: memAfter,
      delta: memAfter.heapUsed - memBefore.heapUsed
    }
  }
}

/**
 * Assert that a benchmark meets performance requirements
 * 
 * @param {BenchmarkStats} stats - Benchmark statistics
 * @param {Object} requirements - Performance requirements
 * @param {number} [requirements.maxMean] - Maximum acceptable mean time (ms)
 * @param {number} [requirements.maxP95] - Maximum acceptable 95th percentile (ms)
 * @param {number} [requirements.maxP99] - Maximum acceptable 99th percentile (ms)
 * @throws {Error} If requirements are not met
 * 
 * @example
 * const stats = await benchmark('Search Query', searchFunction)
 * assertPerformance(stats, { maxMean: 10, maxP95: 50 })
 */
export function assertPerformance(stats, requirements) {
  const failures = []
  
  if (requirements.maxMean !== undefined && stats.mean > requirements.maxMean) {
    failures.push(`Mean ${stats.mean.toFixed(2)}ms exceeds ${requirements.maxMean}ms`)
  }
  
  if (requirements.maxP95 !== undefined && stats.p95 > requirements.maxP95) {
    failures.push(`P95 ${stats.p95.toFixed(2)}ms exceeds ${requirements.maxP95}ms`)
  }
  
  if (requirements.maxP99 !== undefined && stats.p99 > requirements.maxP99) {
    failures.push(`P99 ${stats.p99.toFixed(2)}ms exceeds ${requirements.maxP99}ms`)
  }
  
  if (failures.length > 0) {
    throw new Error(`Performance requirements not met for "${stats.name}":\n${failures.join('\n')}`)
  }
}
