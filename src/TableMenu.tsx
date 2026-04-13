import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'

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
          setPosition({
            top: coords.top - editorRect.top - 36,
            left: coords.left - editorRect.left,
          })
        }
      }
    }

    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  if (!visible) return null

  return (
    <div className="table-menu" style={{ top: position.top, left: position.left }}>
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        title="Add row above"
      >
        ↑ Row
      </button>
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="Add row below"
      >
        ↓ Row
      </button>
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        title="Add column left"
      >
        ← Col
      </button>
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="Add column right"
      >
        → Col
      </button>
      <span className="table-menu-sep" />
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().setCellAttribute('textAlign', 'left').run()}
        title="Align left"
      >
        ≡←
      </button>
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().setCellAttribute('textAlign', 'center').run()}
        title="Align center"
      >
        ≡↔
      </button>
      <button
        className="table-menu-btn"
        onClick={() => editor.chain().focus().setCellAttribute('textAlign', 'right').run()}
        title="Align right"
      >
        ≡→
      </button>
      <span className="table-menu-sep" />
      <button
        className="table-menu-btn table-menu-btn--danger"
        onClick={() => editor.chain().focus().deleteRow().run()}
        title="Delete row"
      >
        Del Row
      </button>
      <button
        className="table-menu-btn table-menu-btn--danger"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="Delete column"
      >
        Del Col
      </button>
      <span className="table-menu-sep" />
      <button
        className="table-menu-btn table-menu-btn--danger"
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Delete table"
      >
        Del Table
      </button>
    </div>
  )
}
