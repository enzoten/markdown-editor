'use client'

import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function TableMenu({ editor }: { editor: Editor }) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const update = () => {
      const isTable = editor.isActive('table')
      setVisible(isTable)
      if (isTable) {
        const { from } = editor.state.selection
        const coords = editor.view.coordsAtPos(from)
        const editorRect = editor.view.dom.closest('.editor-content')?.getBoundingClientRect()
        if (editorRect) {
          setPosition({ top: coords.top - editorRect.top - 40, left: coords.left - editorRect.left })
        }
      }
    }
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => { editor.off('selectionUpdate', update); editor.off('transaction', update) }
  }, [editor])

  if (!visible) return null

  return (
    <div
      className="absolute z-10 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md"
      style={{ top: position.top, left: position.left }}
      role="toolbar"
      aria-label="Table actions"
    >
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row above">
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row below">
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column left">
        <ArrowLeft className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column right">
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().setCellAttribute('textAlign', 'left').run()} title="Align left">
        <AlignLeft className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().setCellAttribute('textAlign', 'center').run()} title="Align center">
        <AlignCenter className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().setCellAttribute('textAlign', 'right').run()} title="Align right">
        <AlignRight className="h-3.5 w-3.5" />
      </Button>
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
