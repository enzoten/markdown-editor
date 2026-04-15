import { parse, stringify } from 'yaml'

export type FrontMatterData = Record<string, unknown>

export function parseFrontMatter(markdown: string): {
  frontMatter: FrontMatterData | null
  body: string
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { frontMatter: null, body: markdown }
  try {
    const parsed = parse(match[1])
    return {
      frontMatter: typeof parsed === 'object' && parsed !== null ? parsed : null,
      body: match[2],
    }
  } catch {
    return { frontMatter: null, body: markdown }
  }
}

export function serializeFrontMatter(
  frontMatter: FrontMatterData | null,
  body: string,
): string {
  if (!frontMatter || Object.keys(frontMatter).length === 0) return body
  return `---\n${stringify(frontMatter)}---\n\n${body}`
}
