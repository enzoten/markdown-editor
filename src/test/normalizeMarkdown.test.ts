import { describe, it, expect } from 'vitest'
import { normalizeMarkdown } from '@/lib/normalizeMarkdown'

describe('normalizeMarkdown', () => {
  it('normalizes headings to ATX style', async () => {
    const result = await normalizeMarkdown('# Heading 1\n\n## Heading 2')
    expect(result).toContain('# Heading 1')
    expect(result).toContain('## Heading 2')
  })

  it('removes trailing whitespace', async () => {
    const result = await normalizeMarkdown('hello   \nworld  ')
    expect(result).not.toMatch(/[ \t]+$/m)
  })

  it('uses LF line endings', async () => {
    const result = await normalizeMarkdown('line1\r\nline2\r\n')
    expect(result).not.toContain('\r')
  })

  it('ends with a single newline', async () => {
    const result = await normalizeMarkdown('hello\n\n\n')
    expect(result).toBe('hello\n')
  })

  it('preserves bold and italic markers', async () => {
    const result = await normalizeMarkdown('**bold** and *italic*')
    expect(result).toContain('**bold**')
    expect(result).toContain('*italic*')
  })

  it('preserves fenced code blocks', async () => {
    const result = await normalizeMarkdown('```js\nconsole.log("hi")\n```')
    expect(result).toContain('```')
    expect(result).toContain('console.log')
  })

  it('preserves GFM tables', async () => {
    const result = await normalizeMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
    expect(result).toContain('|')
    expect(result).toContain('A')
  })

  it('preserves task lists', async () => {
    const result = await normalizeMarkdown('- [ ] todo\n- [x] done')
    expect(result).toContain('[ ]')
    expect(result).toContain('[x]')
  })

  it('preserves links', async () => {
    const result = await normalizeMarkdown('[text](https://example.com)')
    expect(result).toContain('[text](https://example.com)')
  })

  it('handles empty input', async () => {
    const result = await normalizeMarkdown('')
    expect(result).toBe('\n')
  })
})
