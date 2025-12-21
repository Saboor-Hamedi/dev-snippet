import { describe, it, expect } from 'vitest'
import { extractTags } from '../renderer/src/hook/extractTags.js'

describe('extractTags', () => {
  it('extracts a single tag', () => {
    const text = 'This is #javascript code'
    expect(extractTags(text)).toBe('javascript')
  })

  it('extracts multiple tags', () => {
    const text = 'Learning #javascript and #react today'
    const result = extractTags(text)
    expect(result).toContain('javascript')
    expect(result).toContain('react')
  })

  it('extracts tags at the beginning of text', () => {
    const text = '#python is awesome'
    expect(extractTags(text)).toBe('python')
  })

  it('extracts tags with numbers', () => {
    const text = 'Using #vue3 and #node18'
    const result = extractTags(text)
    expect(result).toContain('vue3')
    expect(result).toContain('node18')
  })

  it('extracts tags with hyphens and underscores', () => {
    const text = 'Tags: #my-tag and #another_tag'
    const result = extractTags(text)
    expect(result).toContain('my-tag')
    expect(result).toContain('another_tag')
  })

  it('converts tags to lowercase', () => {
    const text = 'Using #JavaScript and #REACT'
    const result = extractTags(text)
    expect(result).toContain('javascript')
    expect(result).toContain('react')
  })

  it('removes duplicate tags', () => {
    const text = '#javascript is great, #javascript is fun'
    expect(extractTags(text)).toBe('javascript')
  })

  it('ignores hashtags in the middle of words', () => {
    const text = 'email@example.com and test#value'
    expect(extractTags(text)).toBe('')
  })

  it('handles empty string', () => {
    expect(extractTags('')).toBe('')
  })

  it('handles null and undefined', () => {
    expect(extractTags(null)).toBe('')
    expect(extractTags(undefined)).toBe('')
  })

  it('handles text with no tags', () => {
    const text = 'This text has no tags at all'
    expect(extractTags(text)).toBe('')
  })

  it('handles multiple tags on same line', () => {
    const text = '#tag1 #tag2 #tag3'
    const result = extractTags(text)
    expect(result).toContain('tag1')
    expect(result).toContain('tag2')
    expect(result).toContain('tag3')
  })

  it('handles tags with newlines', () => {
    const text = `First line #tag1
    Second line #tag2
    Third line #tag3`
    const result = extractTags(text)
    expect(result).toContain('tag1')
    expect(result).toContain('tag2')
    expect(result).toContain('tag3')
  })

  it('ignores special characters in tags', () => {
    const text = '#valid-tag #invalid@tag #another$tag'
    const result = extractTags(text)
    expect(result).toContain('valid-tag')
    expect(result).not.toContain('invalid@tag')
    expect(result).not.toContain('another$tag')
  })

  it('returns comma-separated string', () => {
    const text = '#tag1 #tag2'
    const result = extractTags(text)
    expect(result).toMatch(/tag1,tag2|tag2,tag1/)
  })
})
