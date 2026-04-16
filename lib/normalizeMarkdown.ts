let normalizer: Awaited<ReturnType<typeof createNormalizer>> | null = null

async function createNormalizer() {
  const { unified } = await import('unified')
  const remarkParse = (await import('remark-parse')).default
  const remarkGfm = (await import('remark-gfm')).default
  const remarkStringify = (await import('remark-stringify')).default

  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      emphasis: '*',
      strong: '**',
      listItemIndent: 'one',
      rule: '-',
      fences: true,
      incrementListMarker: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
}

async function getNormalizer() {
  if (!normalizer) {
    normalizer = await createNormalizer()
  }
  return normalizer
}

/**
 * Normalize Markdown output for pristine formatting:
 * - ATX-style headings only
 * - Consistent bullet/emphasis markers
 * - Clean table formatting
 * - No trailing whitespace
 * - LF line endings
 *
 * Remark is lazy-loaded on first call to avoid blocking initial page load.
 */
export async function normalizeMarkdown(raw: string): Promise<string> {
  try {
    const proc = await getNormalizer()
    const result = await proc.process(raw)
    let output = String(result)
    // Ensure LF line endings
    output = output.replace(/\r\n/g, '\n')
    // Remove trailing whitespace on each line
    output = output.replace(/[ \t]+$/gm, '')
    // Ensure single trailing newline
    output = output.trimEnd() + '\n'
    return output
  } catch {
    // If normalization fails, return raw with basic cleanup
    return raw.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd() + '\n'
  }
}
