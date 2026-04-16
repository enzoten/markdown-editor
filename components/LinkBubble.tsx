'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LinkBubble({ editor }: { editor: Editor }) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState('')
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const bubbleRef = useRef<HTMLDivElement>(null)

  const currentUrl = editor.getAttributes('link').href as string | undefined

  useEffect(() => {
    const update = () => {
      const isLink = editor.isActive('link')
      setVisible(isLink)
      if (isLink) {
        const { from } = editor.state.selection
        const coords = editor.view.coordsAtPos(from)
        const editorRect = editor.view.dom.closest('.editor-content')?.getBoundingClientRect()
        if (editorRect) {
          setPosition({ top: coords.bottom - editorRect.top + 4, left: coords.left - editorRect.left })
        }
      } else {
        setEditing(false)
      }
    }
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => { editor.off('selectionUpdate', update); editor.off('transaction', update) }
  }, [editor])

  useEffect(() => { if (currentUrl) setUrl(currentUrl) }, [currentUrl])

  const handleSave = useCallback(() => {
    if (url.trim()) editor.chain().focus().setLink({ href: url.trim() }).run()
    else editor.chain().focus().unsetLink().run()
    setEditing(false)
  }, [editor, url])

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run()
    setEditing(false)
  }, [editor])

  if (!visible) return null

  return (
    <div
      ref={bubbleRef}
      className="absolute z-10 rounded-lg border border-border bg-popover shadow-md"
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-label="Edit link"
    >
      {editing ? (
        <div className="flex items-center gap-1.5 p-2">
          <input
            className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring min-w-[200px]"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } else if (e.key === 'Escape') setEditing(false) }}
            placeholder="https://..."
            autoFocus
            aria-label="Link URL"
          />
          <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSave}>Save</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 p-1.5">
          <a className="truncate max-w-[200px] rounded px-2 py-0.5 text-xs text-primary hover:underline" href={currentUrl} target="_blank" rel="noopener noreferrer">
            {currentUrl}
          </a>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setUrl(currentUrl || ''); setEditing(true) }} title="Edit">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={handleRemove} title="Remove">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
