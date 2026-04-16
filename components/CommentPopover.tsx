'use client'

import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { MessageSquare } from 'lucide-react'

export default function CommentPopover({
  editor,
  onStartComment,
}: {
  editor: Editor
  onStartComment: () => void
}) {
  const [showButton, setShowButton] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

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
      menu.className = 'fixed z-50 min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md'
      menu.style.top = `${mouseEvent.clientY}px`
      menu.style.left = `${mouseEvent.clientX}px`
      menu.innerHTML = `<div class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        Comment
      </div>`
      document.body.appendChild(menu)

      const item = menu.querySelector('div > div')!
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
      className="absolute z-10 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-md transition-all hover:shadow-lg hover:scale-105 hover:text-foreground"
      style={{ top: position.top, left: position.left }}
      onClick={onStartComment}
      title="Add comment"
    >
      <MessageSquare className="h-3.5 w-3.5" />
      Comment
    </button>
  )
}
