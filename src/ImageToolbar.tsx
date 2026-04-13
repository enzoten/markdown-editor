import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'

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
          setPosition({
            top: coords.bottom - editorRect.top + 4,
            left: coords.left - editorRect.left,
          })
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
    <div className="image-toolbar" style={{ top: position.top, left: position.left }}>
      <label className="image-toolbar-label">Alt text:</label>
      <input
        className="image-toolbar-input"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        onBlur={handleAltSave}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAltSave() } }}
        placeholder="Describe this image..."
      />
      <button
        className="image-toolbar-btn image-toolbar-btn--danger"
        onClick={() => editor.chain().focus().deleteSelection().run()}
        title="Remove image"
      >
        Delete
      </button>
    </div>
  )
}
