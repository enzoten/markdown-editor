import { describe, it, expect } from 'vitest'
import { parseFrontMatter, serializeFrontMatter } from '../frontmatter'

describe('parseFrontMatter', () => {
  it('parses valid YAML front matter', () => {
    const md = `---\ntitle: Hello\nstatus: draft\n---\n\n# Body`
    const result = parseFrontMatter(md)
    expect(result.frontMatter).toEqual({ title: 'Hello', status: 'draft' })
    expect(result.body).toBe('\n# Body')
  })

  it('returns null frontMatter when no front matter present', () => {
    const md = '# Just a heading\n\nSome content.'
    const result = parseFrontMatter(md)
    expect(result.frontMatter).toBeNull()
    expect(result.body).toBe(md)
  })

  it('handles empty front matter', () => {
    const md = `---\n\n---\n\nBody text`
    const result = parseFrontMatter(md)
    // Empty YAML parses to null
    expect(result.frontMatter).toBeNull()
  })

  it('handles front matter with arrays', () => {
    const md = `---\ntags:\n  - one\n  - two\n---\n\nBody`
    const result = parseFrontMatter(md)
    expect(result.frontMatter).toEqual({ tags: ['one', 'two'] })
  })

  it('handles front matter with booleans', () => {
    const md = `---\ndraft: true\npublished: false\n---\n\nBody`
    const result = parseFrontMatter(md)
    expect(result.frontMatter).toEqual({ draft: true, published: false })
  })

  it('returns full text as body for invalid YAML', () => {
    const md = `---\n: invalid: yaml: {{{\n---\n\nBody`
    const result = parseFrontMatter(md)
    expect(result.body).toBeTruthy()
  })
})

describe('serializeFrontMatter', () => {
  it('serializes front matter with body', () => {
    const result = serializeFrontMatter({ title: 'Test' }, '# Body')
    expect(result).toContain('---')
    expect(result).toContain('title: Test')
    expect(result).toContain('# Body')
  })

  it('returns body only when frontMatter is null', () => {
    const result = serializeFrontMatter(null, '# Body')
    expect(result).toBe('# Body')
  })

  it('returns body only when frontMatter is empty object', () => {
    const result = serializeFrontMatter({}, '# Body')
    expect(result).toBe('# Body')
  })

  it('round-trips through parse and serialize', () => {
    const original = `---\ntitle: Hello\nstatus: draft\n---\n\n# Content`
    const { frontMatter, body } = parseFrontMatter(original)
    const serialized = serializeFrontMatter(frontMatter, body)
    expect(serialized).toContain('title: Hello')
    expect(serialized).toContain('# Content')
  })
})
