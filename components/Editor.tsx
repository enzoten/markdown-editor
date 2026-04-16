'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { sampleMarkdown } from '@/lib/sampleContent'
import { parseFrontMatter, type FrontMatterData } from '@/lib/frontmatter'
import OutlineSidebar from '@/components/OutlineSidebar'
import FrontMatterPanel from '@/components/FrontMatterPanel'
import { openFile, saveFile, getFullMarkdown } from '@/lib/fileOperations'
import FindReplace from '@/components/FindReplace'
import CodeBlockView from '@/components/CodeBlockView'
import LinkBubble from '@/components/LinkBubble'
import TableMenu from '@/components/TableMenu'
import ImageToolbar from '@/components/ImageToolbar'
import CommentSidebar from '@/components/CommentSidebar'
import CommentPopover from '@/components/CommentPopover'
import { CommentMark } from '@/lib/commentMark'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Link2, ImageIcon, List, ListOrdered, ListChecks, Quote, Minus, Code, Table2 as TableIcon, Undo, Redo, MessageSquare } from 'lucide-react'
import { ReactNodeViewRenderer } from '@tiptap/react'

const lowlight = createLowlight(common)

declare global {
  interface Window { _editor: ReturnType<typeof useEditor> }
}

export default function Editor({ documentId }: { documentId?: string | null }) {
  const [, setTick] = useState(0)
  const rafRef = useRef(0)
  const forceUpdate = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => setTick(t => t + 1))
  }, [])
  const [outlineVisible, setOutlineVisible] = useState(true)
  const [frontMatter, setFrontMatter] = useState<FrontMatterData | null>(null)
  const fmUndoStack = useRef<(FrontMatterData | null)[]>([])
  const fmRedoStack = useRef<(FrontMatterData | null)[]>([])
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [fileName, setFileName] = useState<string>('Untitled')
  const [findMode, setFindMode] = useState<'find' | 'replace' | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [draggingOver, setDraggingOver] = useState(false)
  const dragCountRef = useRef(0)
  const [cloudLoaded, setCloudLoaded] = useState(false)
  const [commentsVisible, setCommentsVisible] = useState(false)
  const [addingComment, setAddingComment] = useState(false)

  const updateFrontMatter = useCallback((fm: FrontMatterData | null) => {
    fmUndoStack.current.push(frontMatter)
    fmRedoStack.current = []
    setFrontMatter(fm)
    setIsDirty(true)
  }, [frontMatter])

  const undoFrontMatter = useCallback(() => {
    const prev = fmUndoStack.current.pop()
    if (prev !== undefined) {
      fmRedoStack.current.push(frontMatter)
      setFrontMatter(prev)
      return true
    }
    return false
  }, [frontMatter])

  const redoFrontMatter = useCallback(() => {
    const next = fmRedoStack.current.pop()
    if (next !== undefined) {
      fmUndoStack.current.push(frontMatter)
      setFrontMatter(next)
      return true
    }
    return false
  }, [frontMatter])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // replaced by CodeBlockLowlight
        link: false,      // configured separately below
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'editor-link' },
      }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {},
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            textAlign: {
              default: null,
              parseHTML: (el: HTMLElement) => el.style.textAlign || null,
              renderHTML: (attrs: Record<string, unknown>) => {
                if (!attrs.textAlign) return {}
                return { style: `text-align: ${attrs.textAlign}` }
              },
            },
          }
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {},
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            textAlign: {
              default: null,
              parseHTML: (el: HTMLElement) => el.style.textAlign || null,
              renderHTML: (attrs: Record<string, unknown>) => {
                if (!attrs.textAlign) return {}
                return { style: `text-align: ${attrs.textAlign}` }
              },
            },
          }
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView)
        },
      }),
      Markdown.configure({
        markedOptions: {
          gfm: true,
          breaks: false,
          pedantic: false,
        },
      }),
      CommentMark,
    ],
    content: '<p></p>',
    enableInputRules: false,
    enablePasteRules: false,
    editorProps: {
      handleDrop(view, event) {
        const files = event.dataTransfer?.files
        if (!files?.length) return false
        const images = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (!images.length) return false

        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        images.forEach(file => {
          const reader = new FileReader()
          reader.onload = () => {
            const src = reader.result as string
            const node = view.state.schema.nodes.image.create({ src, alt: file.name })
            const tr = view.state.tr.insert(pos ?? view.state.selection.from, node)
            view.dispatch(tr)
          }
          reader.readAsDataURL(file)
        })
        return true
      },
      handlePaste(view, event) {
        // Handle pasted images from clipboard
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) continue
            const reader = new FileReader()
            reader.onload = () => {
              const src = reader.result as string
              const node = view.state.schema.nodes.image.create({ src, alt: 'Pasted image' })
              const tr = view.state.tr.replaceSelectionWith(node)
              view.dispatch(tr)
            }
            reader.readAsDataURL(file)
            return true
          }
        }

        // Handle pasted Markdown text — convert to rich content
        const text = event.clipboardData?.getData('text/plain')
        if (text && /[*_#\[`~|>-]/.test(text)) {
          // Looks like it might contain Markdown syntax — parse it
          const { state } = view
          event.preventDefault()
          // Use the editor's Markdown parser via the setContent approach
          // We need to access the editor instance
          const tempDiv = document.createElement('div')
          tempDiv.setAttribute('data-markdown-paste', text)
          document.body.appendChild(tempDiv)
          // Dispatch a custom event the editor effect can pick up
          window.dispatchEvent(new CustomEvent('markdown-paste', { detail: { text, from: state.selection.from } }))
          tempDiv.remove()
          return true
        }

        return false
      },
    },
    onSelectionUpdate: forceUpdate,
    onTransaction: forceUpdate,
    onUpdate: () => setIsDirty(true),
  })

  useEffect(() => { window._editor = editor }, [editor])

  const startComment = useCallback(() => {
    const { from, to } = editor?.state.selection || { from: 0, to: 0 }
    if (from === to) {
      setCommentsVisible(v => !v)
      return
    }
    setCommentsVisible(true)
    setAddingComment(true)
  }, [editor])

  // Load document from cloud API
  useEffect(() => {
    if (!editor || !documentId || cloudLoaded) return
    const load = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}`)
        if (res.ok) {
          const doc = await res.json()
          const { frontMatter: fm, body } = parseFrontMatter(doc.content)
          setFrontMatter(fm)
          setFileName(doc.title || 'Untitled')
          if (body) {
            editor.commands.setContent(body, { contentType: 'markdown' })
          } else {
            editor.commands.setContent('<p></p>')
          }
          fmUndoStack.current = []
          fmRedoStack.current = []
          setIsDirty(false)
          // Focus the editor so the user can start typing immediately
          setTimeout(() => editor.commands.focus('end'), 50)
        }
      } catch { /* network error — keep empty doc */ }
      setCloudLoaded(true)
    }
    load()
  }, [editor, documentId, cloudLoaded])

  // Load sample content when no document is selected
  useEffect(() => {
    if (!editor || documentId || cloudLoaded) return
    const { frontMatter: fm, body } = parseFrontMatter(sampleMarkdown)
    setFrontMatter(fm)
    editor.commands.setContent(body, { contentType: 'markdown' })
    setCloudLoaded(true)
    setTimeout(() => editor.commands.focus('end'), 50)
  }, [editor, documentId, cloudLoaded])

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault() }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Auto-save to cloud API every 5 seconds when dirty
  useEffect(() => {
    if (!editor || !isDirty) return
    const timer = setTimeout(async () => {
      if (documentId) {
        try {
          const content = await getFullMarkdown(editor, frontMatter)
          const title = frontMatter?.title as string || fileName
          await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
          })
          setIsDirty(false)
        } catch { /* network error — will retry on next change */ }
      } else {
        // Fallback: save to localStorage for unsigned-in/local use
        try {
          const body = editor.getMarkdown()
          localStorage.setItem('md-editor-draft', JSON.stringify({
            body,
            frontMatter,
            savedAt: Date.now(),
          }))
        } catch { /* quota exceeded */ }
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [editor, isDirty, frontMatter, documentId, fileName])

  // Handle Markdown paste events from the editorProps handler
  useEffect(() => {
    if (!editor) return
    const handler = (e: Event) => {
      const { text } = (e as CustomEvent).detail
      if (text && editor) {
        editor.chain().focus().insertContent(text, { contentType: 'markdown' }).run()
      }
    }
    window.addEventListener('markdown-paste', handler)
    return () => window.removeEventListener('markdown-paste', handler)
  }, [editor])

  const confirmDiscard = useCallback(() => {
    if (!isDirty) return true
    return window.confirm('You have unsaved changes. Discard them?')
  }, [isDirty])

  const handleOpen = useCallback(async () => {
    if (!editor) return
    if (!confirmDiscard()) return
    const result = await openFile()
    if (!result) return
    const { frontMatter: fm, body } = parseFrontMatter(result.content)
    setFrontMatter(fm)
    editor.commands.setContent(body, { contentType: 'markdown' })
    setFileHandle(result.handle)
    setFileName(result.name)
    setIsDirty(false)
    fmUndoStack.current = []
    fmRedoStack.current = []
    localStorage.removeItem('md-editor-draft')
  }, [editor, confirmDiscard])

  const handleSave = useCallback(async () => {
    if (!editor) return
    const content = await getFullMarkdown(editor, frontMatter)
    if (documentId) {
      // Cloud save
      try {
        const title = frontMatter?.title as string || fileName
        await fetch(`/api/documents/${documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        })
        setIsDirty(false)
      } catch { /* network error */ }
    } else {
      // Local file save
      const handle = await saveFile(content, fileHandle)
      if (handle) setFileHandle(handle)
      setIsDirty(false)
      localStorage.removeItem('md-editor-draft')
    }
  }, [editor, frontMatter, fileHandle, documentId, fileName])

  const handleNew = useCallback(() => {
    if (!editor) return
    if (!confirmDiscard()) return
    setFrontMatter(null)
    editor.commands.setContent('<p></p>')
    setFileHandle(null)
    setFileName('Untitled')
    setIsDirty(false)
    fmUndoStack.current = []
    fmRedoStack.current = []
    localStorage.removeItem('md-editor-draft')
  }, [editor, confirmDiscard])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // File operations
      if (mod && e.key === 's' && !e.shiftKey) {
        e.preventDefault(); handleSave()
      } else if (mod && e.key === 's' && e.shiftKey) {
        e.preventDefault()
        // Save As: clear handle to force picker
        if (editor) {
          getFullMarkdown(editor, frontMatter).then(content =>
            saveFile(content, null).then(h => { if (h) setFileHandle(h) })
          )
        }
      } else if (mod && e.key === 'o') {
        e.preventDefault(); handleOpen()
      } else if (mod && e.key === 'n') {
        e.preventDefault(); handleNew()
      } else if (mod && e.key === 'f' && !e.shiftKey) {
        e.preventDefault(); setFindMode('find')
      } else if (mod && e.key === 'f' && e.shiftKey) {
        e.preventDefault(); setFindMode('replace')
      }

      // Toggle outline
      if (mod && e.shiftKey && e.key === 'O') {
        e.preventDefault(); setOutlineVisible(v => !v)
      }

      if (!editor) return

      // Undo/Redo: try editor first, fall back to front-matter stack
      if (mod && e.key === 'z' && !e.shiftKey) {
        if (!editor.can().undo()) {
          e.preventDefault()
          undoFrontMatter()
          return
        }
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        if (!editor.can().redo()) {
          e.preventDefault()
          redoFrontMatter()
          return
        }
      }

      // Heading levels: Cmd+1 through Cmd+6, Cmd+0 for paragraph
      if (mod && !e.shiftKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault()
        editor.chain().focus().toggleHeading({ level: parseInt(e.key) as 1|2|3|4|5|6 }).run()
      } else if (mod && !e.shiftKey && e.key === '0') {
        e.preventDefault()
        editor.chain().focus().setParagraph().run()
      }

      // Lists: Cmd+Shift+7 (ordered), Cmd+Shift+8 (bullet), Cmd+Shift+9 (task)
      if (mod && e.shiftKey && e.key === '7') {
        e.preventDefault()
        editor.chain().focus().toggleOrderedList().run()
      } else if (mod && e.shiftKey && e.key === '8') {
        e.preventDefault()
        editor.chain().focus().toggleBulletList().run()
      } else if (mod && e.shiftKey && e.key === '9') {
        e.preventDefault()
        editor.chain().focus().toggleTaskList().run()
      }

      // Inline code: Cmd+E
      if (mod && e.key === 'e' && !e.shiftKey) {
        e.preventDefault()
        editor.chain().focus().toggleCode().run()
      }

      // Strikethrough: Cmd+Shift+X
      if (mod && e.shiftKey && e.key === 'X') {
        e.preventDefault()
        editor.chain().focus().toggleStrike().run()
      }

      // Link: Cmd+K
      if (mod && e.key === 'k') {
        e.preventDefault()
        if (editor.isActive('link')) {
          editor.chain().focus().unsetLink().run()
        } else {
          const url = window.prompt('URL:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }
      }

      // Blockquote: Cmd+Shift+.
      if (mod && e.shiftKey && e.key === '>') {
        e.preventDefault()
        editor.chain().focus().toggleBlockquote().run()
      }

      // Code block: Cmd+Shift+C
      if (mod && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        editor.chain().focus().toggleCodeBlock().run()
      }

      // Horizontal rule: Cmd+Shift+-
      if (mod && e.shiftKey && e.key === '_') {
        e.preventDefault()
        editor.chain().focus().setHorizontalRule().run()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleSave, handleOpen, handleNew, editor, frontMatter, undoFrontMatter, redoFrontMatter])

  if (!editor) return null

  const headingLevel = (() => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) return String(i)
    }
    return '0'
  })()

  return (
    <div
      className="relative flex w-full flex-col overflow-hidden border-l border-border bg-card"
      onDragEnter={(e) => {
        e.preventDefault()
        dragCountRef.current++
        if (e.dataTransfer?.types.includes('Files')) setDraggingOver(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragCountRef.current--
        if (dragCountRef.current === 0) setDraggingOver(false)
      }}
      onDrop={() => {
        dragCountRef.current = 0
        setDraggingOver(false)
      }}
    >
      {draggingOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded">
          <div className="rounded-lg bg-card px-6 py-3 text-sm font-medium text-primary shadow-lg">Drop image to insert</div>
        </div>
      )}
      <Toolbar
        editor={editor}
        headingLevel={headingLevel}
        undoFrontMatter={undoFrontMatter}
        redoFrontMatter={redoFrontMatter}
        fmUndoStack={fmUndoStack}
        fmRedoStack={fmRedoStack}
        documentId={documentId}
        onComment={startComment}
      />
      {findMode && (
        <FindReplace
          editor={editor}
          mode={findMode}
          onClose={() => setFindMode(null)}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        <OutlineSidebar
          editor={editor}
          visible={outlineVisible}
          onToggle={() => setOutlineVisible(v => !v)}
        />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <FrontMatterPanel data={frontMatter} onChange={updateFrontMatter} />
          <EditorContent editor={editor} className="editor-content" />
          <LinkBubble editor={editor} />
          <TableMenu editor={editor} />
          <ImageToolbar editor={editor} />
          {documentId && (
            <CommentPopover
              editor={editor}
              onStartComment={startComment}
            />
          )}
        </div>
        {documentId && (
          <CommentSidebar
            editor={editor}
            documentId={documentId}
            visible={commentsVisible}
            onToggle={() => setCommentsVisible(v => !v)}
            addingComment={addingComment}
            onCancelAdd={() => setAddingComment(false)}
          />
        )}
      </div>
      <StatusBar editor={editor} fileName={fileName} isDirty={isDirty} />
    </div>
  )
}

function Toolbar({ editor, headingLevel, undoFrontMatter, redoFrontMatter, fmUndoStack, fmRedoStack, documentId, onComment }: {
  editor: NonNullable<ReturnType<typeof useEditor>>,
  headingLevel: string,
  undoFrontMatter: () => boolean,
  redoFrontMatter: () => boolean,
  fmUndoStack: React.RefObject<(FrontMatterData | null)[]>,
  fmRedoStack: React.RefObject<(FrontMatterData | null)[]>,
  documentId?: string | null,
  onComment: () => void,
}) {
  const canUndo = editor.can().undo() || fmUndoStack.current.length > 0
  const canRedo = editor.can().redo() || fmRedoStack.current.length > 0

  const handleUndo = () => {
    if (editor.can().undo()) {
      editor.chain().focus().undo().run()
    } else {
      undoFrontMatter()
    }
  }

  const handleRedo = () => {
    if (editor.can().redo()) {
      editor.chain().focus().redo().run()
    } else {
      redoFrontMatter()
    }
  }

  const handleToolbarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const toolbar = e.currentTarget
    const buttons = Array.from(toolbar.querySelectorAll<HTMLElement>('button, select'))
    const current = document.activeElement as HTMLElement
    const idx = buttons.indexOf(current)
    if (idx === -1) return

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      buttons[(idx + 1) % buttons.length]?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      buttons[(idx - 1 + buttons.length) % buttons.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      buttons[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      buttons[buttons.length - 1]?.focus()
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1 flex-wrap"
        role="toolbar"
        aria-label="Formatting toolbar"
        onKeyDown={handleToolbarKeyDown}
      >
        <select
          value={headingLevel}
          onChange={(e) => {
            const level = parseInt(e.target.value)
            if (level === 0) {
              editor.chain().focus().setParagraph().run()
            } else {
              editor.chain().focus().toggleHeading({ level: level as 1|2|3|4|5|6 }).run()
            }
          }}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Block type"
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
          <option value="6">Heading 6</option>
        </select>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <TBtn tip="Bold (Cmd+B)" pressed={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </TBtn>
        <TBtn tip="Italic (Cmd+I)" pressed={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </TBtn>
        <TBtn tip="Strikethrough (Cmd+Shift+X)" pressed={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </TBtn>
        <TBtn tip="Inline Code (Cmd+E)" pressed={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <span className="font-mono text-[10px]">&lt;&gt;</span>
        </TBtn>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <TBtn tip="Link (Cmd+K)" pressed={editor.isActive('link')} onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run()
          } else {
            const url = window.prompt('URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }
        }}>
          <Link2 className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn tip="Image" onClick={() => {
          const url = window.prompt('Image URL:')
          if (url) editor.chain().focus().setImage({ src: url }).run()
        }}>
          <ImageIcon className="h-3.5 w-3.5" />
        </TBtn>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <TBtn tip="Bullet List (Cmd+Shift+8)" pressed={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn tip="Ordered List (Cmd+Shift+7)" pressed={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn tip="Task List (Cmd+Shift+9)" pressed={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <ListChecks className="h-3.5 w-3.5" />
        </TBtn>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <TBtn tip="Blockquote (Cmd+Shift+.)" pressed={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn tip="Horizontal Rule (Cmd+Shift+-)" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn tip="Code Block (Cmd+Shift+C)" pressed={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn tip="Table" pressed={editor.isActive('table')} onClick={() => {
          if (editor.isActive('table')) return
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }}>
          <TableIcon className="h-3.5 w-3.5" />
        </TBtn>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <TBtn tip="Undo (Cmd+Z)" onClick={handleUndo} disabled={!canUndo}>
          <Undo className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn tip="Redo (Cmd+Shift+Z)" onClick={handleRedo} disabled={!canRedo}>
          <Redo className="h-3.5 w-3.5" />
        </TBtn>

        {documentId && (
          <>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <TBtn tip="Add Comment" onClick={onComment}>
              <MessageSquare className="h-3.5 w-3.5" />
            </TBtn>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

function TBtn({ tip, pressed, onClick, disabled, children }: {
  tip: string
  pressed?: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={pressed}
          onPressedChange={() => onClick()}
          disabled={disabled}
          aria-label={tip}
          tabIndex={-1}
          className="h-8 w-8 p-0"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tip}</TooltipContent>
    </Tooltip>
  )
}

function StatusBar({ editor, fileName, isDirty }: {
  editor: NonNullable<ReturnType<typeof useEditor>>
  fileName: string
  isDirty: boolean
}) {
  const { from, to } = editor.state.selection
  const [wordCount, setWordCount] = useState(0)

  // Debounce word count to avoid expensive full-doc traversal on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ')
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
    }, 300)
    return () => clearTimeout(timer)
  }, [editor.state.doc])

  const activeMarks: string[] = []
  if (editor.isActive('bold')) activeMarks.push('Bold')
  if (editor.isActive('italic')) activeMarks.push('Italic')
  if (editor.isActive('strike')) activeMarks.push('Strike')
  if (editor.isActive('code')) activeMarks.push('Code')
  if (editor.isActive('link')) activeMarks.push('Link')

  return (
    <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground" role="status" aria-live="polite">
      <span>{fileName}{isDirty ? ' \u25cf' : ''}</span>
      <span className="text-border">\u00b7</span>
      <span>{wordCount} words</span>
      {from !== to && <span>\u00b7 {to - from} selected</span>}
      {activeMarks.length > 0 && (
        <span className="flex gap-1 ml-auto">
          {activeMarks.map(m => <span key={m} className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium">{m}</span>)}
        </span>
      )}
    </div>
  )
}
