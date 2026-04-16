'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { AlignLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeadingItem {
  id: string
  level: number
  text: string
  pos: number
}

export default function OutlineSidebar({
  editor,
  visible,
  onToggle,
}: {
  editor: Editor
  visible: boolean
  onToggle: () => void
}) {
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const headingElemsRef = useRef<Map<string, Element>>(new Map())

  const extractHeadings = useCallback(() => {
    const items: HeadingItem[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        items.push({
          id: `heading-${pos}`,
          level: node.attrs.level as number,
          text: node.textContent,
          pos,
        })
      }
    })
    setHeadings(items)
  }, [editor])

  useEffect(() => {
    extractHeadings()
    let timer: ReturnType<typeof setTimeout>
    const handler = () => {
      clearTimeout(timer)
      timer = setTimeout(extractHeadings, 150)
    }
    editor.on('update', handler)
    return () => { clearTimeout(timer); editor.off('update', handler) }
  }, [editor, extractHeadings])

  useEffect(() => {
    if (!visible) return

    observerRef.current?.disconnect()
    headingElemsRef.current.clear()

    const editorEl = editor.view.dom
    const headingElements = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const elemToId = new Map<Element, string>()

    headingElements.forEach((el, index) => {
      if (index < headings.length) {
        elemToId.set(el, headings[index].id)
        headingElemsRef.current.set(headings[index].id, el)
      }
    })

    const visibleIds = new Set<string>()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = elemToId.get(entry.target)
          if (!id) return
          if (entry.isIntersecting) visibleIds.add(id)
          else visibleIds.delete(id)
        })

        for (const h of headings) {
          if (visibleIds.has(h.id)) {
            setActiveId(h.id)
            return
          }
        }

        if (visibleIds.size === 0 && headings.length > 0) {
          const scrollContainer = editorEl.closest('.editor-content') || editorEl
          const containerRect = scrollContainer.getBoundingClientRect()
          let lastAbove: string | null = null
          for (const h of headings) {
            const el = headingElemsRef.current.get(h.id)
            if (el) {
              const rect = el.getBoundingClientRect()
              if (rect.top < containerRect.top + 50) lastAbove = h.id
            }
          }
          if (lastAbove) setActiveId(lastAbove)
        }
      },
      { rootMargin: '-10px 0px -60% 0px', threshold: 0 },
    )

    headingElements.forEach((el) => observerRef.current?.observe(el))
    return () => { observerRef.current?.disconnect() }
  }, [editor, headings, visible])

  const handleClick = (heading: HeadingItem) => {
    const headingElements = editor.view.dom.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const idx = headings.findIndex(h => h.id === heading.id)
    if (idx >= 0 && headingElements[idx]) {
      headingElements[idx].scrollIntoView({ behavior: 'smooth', block: 'start' })
      editor.chain().focus().setTextSelection(heading.pos + 1).run()
    }
  }

  if (!visible) {
    return (
      <button
        className="flex items-start border-r border-border bg-transparent p-2 text-muted-foreground hover:bg-accent"
        onClick={onToggle}
        title="Show outline (Cmd+Shift+O)"
        aria-label="Show document outline"
        aria-expanded={false}
      >
        <AlignLeft className="h-4 w-4" />
      </button>
    )
  }

  const minLevel = headings.length > 0 ? Math.min(...headings.map(h => h.level)) : 1

  return (
    <aside className="flex w-52 min-w-[160px] flex-col border-r border-border bg-muted/30" aria-label="Document outline">
      <div className="flex items-center border-b border-border px-3 py-2">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Outline</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle} title="Hide outline (Cmd+Shift+O)">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto py-1">
        {headings.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">No headings yet</div>
        ) : (
          headings.map((h) => (
            <button
              key={h.id}
              className={cn(
                'flex w-full items-center text-left text-xs py-1 pr-2 border-l-2 border-transparent hover:bg-accent/50 transition-colors',
                activeId === h.id && 'border-l-primary bg-accent text-accent-foreground font-medium',
              )}
              style={{ paddingLeft: `${(h.level - minLevel) * 14 + 12}px` }}
              onClick={() => handleClick(h)}
              title={h.text}
              aria-current={activeId === h.id ? 'location' : undefined}
            >
              <span className="truncate">{h.text}</span>
            </button>
          ))
        )}
      </nav>
    </aside>
  )
}
