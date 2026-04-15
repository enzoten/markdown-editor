'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'

export default function LinkBubble({ editor }: { editor: Editor }) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState('')
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const bubbleRef = useRef<HTMLDivElement>(null)

  const currentUrl = editor.getAttributes('link').href as string | undefined

  // Show/hide and position based on link state
  useEffect(() => {
    const update = () => {
      const isLink = editor.isActive('link')
      setVisible(isLink)

      if (isLink) {
        const { from } = editor.state.selection
        const coords = editor.view.coordsAtPos(from)
        const editorRect = editor.view.dom.closest('.editor-content')?.getBoundingClientRect()
        if (editorRect) {
          setPosition({
            top: coords.bottom - editorRect.top + 4,
            left: coords.left - editorRect.left,
          })
        }
      } else {
        setEditing(false)
      }
    }

    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  useEffect(() => {
    if (currentUrl) setUrl(currentUrl)
  }, [currentUrl])

  const handleSave = useCallback(() => {
    if (url.trim()) {
      editor.chain().focus().setLink({ href: url.trim() }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setEditing(false)
  }, [editor, url])

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run()
    setEditing(false)
  }, [editor])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setEditing(false)
    }
  }

  if (!visible) return null

  return (
    <div
      ref={bubbleRef}
      className="link-bubble"
      role="dialog"
      aria-label="Edit link"
      style={{ top: position.top, left: position.left }}
    >
      {editing ? (
        <div className="link-bubble-edit">
          <input
            className="link-bubble-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://..."
            autoFocus
            aria-label="Link URL"
          />
          <button className="link-bubble-btn link-bubble-save" onClick={handleSave}>Save</button>
          <button className="link-bubble-btn" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="link-bubble-preview">
          <a
            className="link-bubble-url"
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {currentUrl}
          </a>
          <button className="link-bubble-btn" onClick={() => { setUrl(currentUrl || ''); setEditing(true) }}>Edit</button>
          <button className="link-bubble-btn link-bubble-remove" onClick={handleRemove}>Remove</button>
        </div>
      )}
    </div>
  )
}
