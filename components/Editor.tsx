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
import { CommentMark } from '@/lib/commentMark'
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
      className="editor-wrapper"
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
        <div className="drop-overlay">
          <div className="drop-overlay-content">Drop image to insert</div>
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
        onToggleComments={() => setCommentsVisible(v => !v)}
      />
      {findMode && (
        <FindReplace
          editor={editor}
          mode={findMode}
          onClose={() => setFindMode(null)}
        />
      )}
      <div className="editor-body">
        <OutlineSidebar
          editor={editor}
          visible={outlineVisible}
          onToggle={() => setOutlineVisible(v => !v)}
        />
        <div className="editor-main">
          <FrontMatterPanel data={frontMatter} onChange={updateFrontMatter} />
          <EditorContent editor={editor} className="editor-content" />
          <LinkBubble editor={editor} />
          <TableMenu editor={editor} />
          <ImageToolbar editor={editor} />
        </div>
        {documentId && (
          <CommentSidebar
            editor={editor}
            documentId={documentId}
            visible={commentsVisible}
            onToggle={() => setCommentsVisible(v => !v)}
          />
        )}
      </div>
      <StatusBar editor={editor} fileName={fileName} isDirty={isDirty} />
    </div>
  )
}

function Toolbar({ editor, headingLevel, undoFrontMatter, redoFrontMatter, fmUndoStack, fmRedoStack, documentId, onToggleComments }: {
  editor: NonNullable<ReturnType<typeof useEditor>>,
  headingLevel: string,
  undoFrontMatter: () => boolean,
  redoFrontMatter: () => boolean,
  fmUndoStack: React.RefObject<(FrontMatterData | null)[]>,
  fmRedoStack: React.RefObject<(FrontMatterData | null)[]>,
  documentId?: string | null,
  onToggleComments: () => void,
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
      const next = buttons[(idx + 1) % buttons.length]
      next?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = buttons[(idx - 1 + buttons.length) % buttons.length]
      prev?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      buttons[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      buttons[buttons.length - 1]?.focus()
    }
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting toolbar" onKeyDown={handleToolbarKeyDown}>
      {/* Block type selector */}
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
        title="Block type"
        aria-label="Block type"
        tabIndex={0}
      >
        <option value="0">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
        <option value="5">Heading 5</option>
        <option value="6">Heading 6</option>
      </select>

      <span className="toolbar-separator" />

      {/* Inline formatting */}
      <ToolbarButton
        label="B" title="Bold (Cmd+B)"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={{ fontWeight: 700 }}
      />
      <ToolbarButton
        label="I" title="Italic (Cmd+I)"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={{ fontStyle: 'italic' }}
      />
      <ToolbarButton
        label="S" title="Strikethrough (Cmd+Shift+X)"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        style={{ textDecoration: 'line-through' }}
      />
      <ToolbarButton
        label="<>" title="Inline Code (Cmd+E)"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
        className="code-btn"
      />

      <span className="toolbar-separator" />

      {/* Links & Media */}
      <ToolbarButton
        label="🔗" title="Link (Cmd+K)"
        active={editor.isActive('link')}
        onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run()
          } else {
            const url = window.prompt('URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }
        }}
      />
      <ToolbarButton
        label="🖼" title="Image"
        onClick={() => {
          const url = window.prompt('Image URL:')
          if (url) editor.chain().focus().setImage({ src: url }).run()
        }}
      />

      <span className="toolbar-separator" />

      {/* Lists */}
      <ToolbarButton
        label="•" title="Bullet List (Cmd+Shift+8)"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="1." title="Ordered List (Cmd+Shift+7)"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="☐" title="Task List (Cmd+Shift+9)"
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />

      <span className="toolbar-separator" />

      {/* Block structures */}
      <ToolbarButton
        label="❝" title="Blockquote (Cmd+Shift+.)"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="—" title="Horizontal Rule (Cmd+Shift+-)"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <ToolbarButton
        label="{ }" title="Code Block (Cmd+Shift+C)"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className="code-btn"
      />
      <ToolbarButton
        label="⊞" title="Table"
        active={editor.isActive('table')}
        onClick={() => {
          if (editor.isActive('table')) return
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }}
      />

      <span className="toolbar-separator" />

      {/* Undo / Redo */}
      <ToolbarButton
        label="↩" title="Undo (Cmd+Z)"
        onClick={handleUndo}
        className={canUndo ? '' : 'disabled'}
      />
      <ToolbarButton
        label="↪" title="Redo (Cmd+Shift+Z)"
        onClick={handleRedo}
        className={canRedo ? '' : 'disabled'}
      />

      {documentId && (
        <>
          <span className="toolbar-separator" />
          <ToolbarButton
            label="💬" title="Add Comment"
            onClick={async () => {
              const { from, to } = editor.state.selection
              if (from === to) {
                onToggleComments()
                return
              }
              const commentText = window.prompt('Add a comment:')
              if (!commentText?.trim()) return
              const res = await fetch(`/api/documents/${documentId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentText.trim() }),
              })
              if (res.ok) {
                const comment = await res.json()
                editor.chain().focus().setComment(comment.id).run()
                onToggleComments()
              }
            }}
          />
        </>
      )}
    </div>
  )
}

function ToolbarButton({ label, title, active, onClick, style, className, tabIndex }: {
  label: string
  title: string
  active?: boolean
  onClick: () => void
  style?: React.CSSProperties
  className?: string
  tabIndex?: number
}) {
  return (
    <button
      onClick={onClick}
      className={[className, active ? 'active' : ''].filter(Boolean).join(' ')}
      title={title}
      style={style}
      aria-pressed={active}
      aria-label={title}
      tabIndex={tabIndex ?? -1}
    >
      {label}
    </button>
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
    <div className="status-bar" role="status" aria-live="polite">
      <span className="status-filename">{fileName}{isDirty ? ' ●' : ''}</span>
      <span className="status-separator">·</span>
      <span>{wordCount} words</span>
      {from !== to && <span> · {to - from} selected</span>}
      {activeMarks.length > 0 && (
        <span className="status-marks">
          {activeMarks.map(m => <span key={m} className="state-badge">{m}</span>)}
        </span>
      )}
    </div>
  )
}
