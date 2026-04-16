'use client'

import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'

export default function CommentPopover({
  editor,
  onStartComment,
}: {
  editor: Editor
  onStartComment: () => void
}) {
  const [showButton, setShowButton] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  // Show floating button when text is selected
  useEffect(() => {
    const update = () => {
      const { from, to } = editor.state.selection
      const hasSelection = from !== to
      const isComment = editor.isActive('comment')

      if (hasSelection && !isComment) {
        const coords = editor.view.coordsAtPos(to)
        const editorRect = editor.view.dom.closest('.editor-content')?.getBoundingClientRect()
        if (editorRect) {
          setPosition({
            top: coords.bottom - editorRect.top + 8,
            left: Math.min(coords.left - editorRect.left, editorRect.width - 50),
          })
        }
        setShowButton(true)
      } else {
        setShowButton(false)
      }
    }

    editor.on('selectionUpdate', update)
    return () => { editor.off('selectionUpdate', update) }
  }, [editor])

  // Right-click context menu
  useEffect(() => {
    const editorDom = editor.view.dom

    const handleContextMenu = (e: Event) => {
      const mouseEvent = e as MouseEvent
      const { from, to } = editor.state.selection
      if (from === to) return

      document.querySelector('.comment-context-menu')?.remove()

      const menu = document.createElement('div')
      menu.className = 'comment-context-menu'
      menu.innerHTML = '<div class="comment-context-item">💬 Comment</div>'
      menu.style.top = `${mouseEvent.clientY}px`
      menu.style.left = `${mouseEvent.clientX}px`
      document.body.appendChild(menu)

      const item = menu.querySelector('.comment-context-item')!
      item.addEventListener('click', () => {
        menu.remove()
        onStartComment()
      })

      const close = (evt: MouseEvent) => {
        if (!menu.contains(evt.target as Node)) {
          menu.remove()
          document.removeEventListener('click', close)
        }
      }
      setTimeout(() => document.addEventListener('click', close), 0)
      mouseEvent.preventDefault()
    }

    editorDom.addEventListener('contextmenu', handleContextMenu)
    return () => { editorDom.removeEventListener('contextmenu', handleContextMenu) }
  }, [editor, onStartComment])

  if (!showButton) return null

  return (
    <button
      className="comment-float-btn"
      style={{ top: position.top, left: position.left }}
      onClick={onStartComment}
      title="Add comment"
    >
      💬
    </button>
  )
}
