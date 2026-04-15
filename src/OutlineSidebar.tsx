import { useEffect, useState, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'

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

  // Extract headings from the editor document
  const extractHeadings = useCallback(() => {
    const items: HeadingItem[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const id = `heading-${pos}`
        items.push({
          id,
          level: node.attrs.level as number,
          text: node.textContent,
          pos,
        })
      }
    })
    setHeadings(items)
  }, [editor])

  // Extract headings on mount and on document changes (debounced)
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

  // Set up IntersectionObserver for scroll-based active heading tracking
  useEffect(() => {
    if (!visible) return

    // Clean up old observer
    observerRef.current?.disconnect()
    headingElemsRef.current.clear()

    const editorEl = editor.view.dom

    // Find all heading DOM elements and map them to our heading items
    const headingElements = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const elemToId = new Map<Element, string>()

    headingElements.forEach((el, index) => {
      if (index < headings.length) {
        elemToId.set(el, headings[index].id)
        headingElemsRef.current.set(headings[index].id, el)
      }
    })

    // Track which headings are visible, highlight the topmost one
    const visibleIds = new Set<string>()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = elemToId.get(entry.target)
          if (!id) return
          if (entry.isIntersecting) {
            visibleIds.add(id)
          } else {
            visibleIds.delete(id)
          }
        })

        // Find the first visible heading (topmost in document order)
        for (const h of headings) {
          if (visibleIds.has(h.id)) {
            setActiveId(h.id)
            return
          }
        }

        // If no heading is visible, find the last heading above the viewport
        if (visibleIds.size === 0 && headings.length > 0) {
          const scrollContainer = editorEl.closest('.editor-content') || editorEl
          const containerRect = scrollContainer.getBoundingClientRect()

          let lastAbove: string | null = null
          for (const h of headings) {
            const el = headingElemsRef.current.get(h.id)
            if (el) {
              const rect = el.getBoundingClientRect()
              if (rect.top < containerRect.top + 50) {
                lastAbove = h.id
              }
            }
          }
          if (lastAbove) setActiveId(lastAbove)
        }
      },
      {
        rootMargin: '-10px 0px -60% 0px',
        threshold: 0,
      }
    )

    headingElements.forEach((el) => {
      observerRef.current?.observe(el)
    })

    return () => { observerRef.current?.disconnect() }
  }, [editor, headings, visible])

  const handleClick = (heading: HeadingItem) => {
    // Find the DOM element for this heading and scroll to it
    const headingElements = editor.view.dom.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const idx = headings.findIndex(h => h.id === heading.id)
    if (idx >= 0 && headingElements[idx]) {
      headingElements[idx].scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Also place the cursor at the heading
      editor.chain().focus().setTextSelection(heading.pos + 1).run()
    }
  }

  if (!visible) {
    return (
      <button className="outline-toggle outline-toggle--collapsed" onClick={onToggle} title="Show outline (Cmd+Shift+O)" aria-label="Show document outline" aria-expanded={false}>
        <span className="outline-toggle-icon">&#9776;</span>
      </button>
    )
  }

  // Compute min heading level for indentation normalization
  const minLevel = headings.length > 0 ? Math.min(...headings.map(h => h.level)) : 1

  return (
    <aside className="outline-sidebar" aria-label="Document outline">
      <div className="outline-header">
        <span className="outline-title">Outline</span>
        <button className="outline-toggle" onClick={onToggle} title="Hide outline (Cmd+Shift+O)" aria-label="Hide document outline" aria-expanded={true}>
          &times;
        </button>
      </div>
      <nav className="outline-list">
        {headings.length === 0 ? (
          <div className="outline-empty">No headings yet</div>
        ) : (
          headings.map((h) => (
            <button
              key={h.id}
              className={`outline-item ${activeId === h.id ? 'outline-item--active' : ''}`}
              style={{ paddingLeft: `${(h.level - minLevel) * 16 + 12}px` }}
              onClick={() => handleClick(h)}
              title={h.text}
              aria-current={activeId === h.id ? 'location' : undefined}
            >
              <span className="outline-item-text">{h.text}</span>
            </button>
          ))
        )}
      </nav>
    </aside>
  )
}
