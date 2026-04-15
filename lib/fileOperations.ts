import type { Editor } from '@tiptap/react'
import { serializeFrontMatter, type FrontMatterData } from './frontmatter'
import { normalizeMarkdown } from './normalizeMarkdown'

/**
 * Get the full Markdown output: front-matter + normalized editor body.
 */
export async function getFullMarkdown(
  editor: Editor,
  frontMatter: FrontMatterData | null,
): Promise<string> {
  const rawBody = editor.getMarkdown()
  const body = await normalizeMarkdown(rawBody)
  return serializeFrontMatter(frontMatter, body)
}

/**
 * Open a Markdown file. Uses File System Access API (Chromium) with
 * <input type="file"> fallback.
 */
export async function openFile(): Promise<{
  content: string
  handle: FileSystemFileHandle | null
  name: string
} | null> {
  // Try File System Access API first (Chromium)
  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md', '.markdown'] },
        }],
      })
      const file = await handle.getFile()
      const content = await file.text()
      return { content, handle, name: file.name }
    } catch {
      return null // user cancelled
    }
  }

  // Fallback: hidden file input
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,text/markdown'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) { resolve(null); return }
      const content = await file.text()
      resolve({ content, handle: null, name: file.name })
    }
    input.click()
  })
}

/**
 * Save to an existing file handle, or trigger Save As.
 */
export async function saveFile(
  content: string,
  handle: FileSystemFileHandle | null,
): Promise<FileSystemFileHandle | null> {
  // Try writing to existing handle
  if (handle) {
    try {
      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()
      return handle
    } catch {
      // Permission denied or handle stale — fall through to Save As
    }
  }

  // Save As via File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      const newHandle = await window.showSaveFilePicker({
        suggestedName: 'document.md',
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] },
        }],
      })
      const writable = await newHandle.createWritable()
      await writable.write(content)
      await writable.close()
      return newHandle
    } catch {
      return handle // user cancelled
    }
  }

  // Fallback: download
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.md'
  a.click()
  URL.revokeObjectURL(url)
  return null
}

// Type augmentation for File System Access API
declare global {
  interface Window {
    showOpenFilePicker: (options?: {
      types?: { description: string; accept: Record<string, string[]> }[]
    }) => Promise<FileSystemFileHandle[]>
    showSaveFilePicker: (options?: {
      suggestedName?: string
      types?: { description: string; accept: Record<string, string[]> }[]
    }) => Promise<FileSystemFileHandle>
  }
}
