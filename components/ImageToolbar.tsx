'use client'

import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ImageToolbar({ editor }: { editor: Editor }) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [altText, setAltText] = useState('')

  useEffect(() => {
    const update = () => {
      const isImage = editor.isActive('image')
      setVisible(isImage)
      if (isImage) {
        const attrs = editor.getAttributes('image')
        setAltText(attrs.alt || '')
        const { from } = editor.state.selection
        const coords = editor.view.coordsAtPos(from)
        const editorRect = editor.view.dom.closest('.editor-content')?.getBoundingClientRect()
        if (editorRect) {
          setPosition({ top: coords.bottom - editorRect.top + 4, left: coords.left - editorRect.left })
        }
      }
    }
    editor.on('selectionUpdate', update)
    return () => { editor.off('selectionUpdate', update) }
  }, [editor])

  if (!visible) return null

  const handleAltSave = () => {
    editor.chain().focus().updateAttributes('image', { alt: altText }).run()
  }

  return (
    <div
      className="absolute z-10 flex items-center gap-1.5 rounded-lg border border-border bg-popover p-1.5 shadow-md"
      style={{ top: position.top, left: position.left }}
      role="toolbar"
      aria-label="Image actions"
    >
      <label className="text-[11px] text-muted-foreground">Alt:</label>
      <input
        className="rounded-md border border-input bg-background px-2 py-0.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring min-w-[150px]"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        onBlur={handleAltSave}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAltSave() } }}
        placeholder="Describe this image..."
      />
      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => editor.chain().focus().deleteSelection().run()} title="Remove image">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
