import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'

const normalizer = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .use(remarkStringify, {
    bullet: '-',
    emphasis: '*',
    strong: '**',
    listItemIndent: 'one',
    rule: '-',
    fences: true,
    incrementListMarker: true,
  } as any)

/**
 * Normalize Markdown output for pristine formatting:
 * - ATX-style headings only
 * - Consistent bullet/emphasis markers
 * - Clean table formatting
 * - No trailing whitespace
 * - LF line endings
 */
export async function normalizeMarkdown(raw: string): Promise<string> {
  try {
    const result = await normalizer.process(raw)
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
