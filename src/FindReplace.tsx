import { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'

export default function FindReplace({
  editor,
  mode,
  onClose,
}: {
  editor: Editor
  mode: 'find' | 'replace'
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [matches, setMatches] = useState<{ from: number; to: number }[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the search input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Find all matches in the document
  const findMatches = useCallback(() => {
    if (!query) { setMatches([]); return }

    const doc = editor.state.doc
    const text = doc.textBetween(0, doc.content.size, '\n')
    const searchText = caseSensitive ? query : query.toLowerCase()
    const docText = caseSensitive ? text : text.toLowerCase()

    const results: { from: number; to: number }[] = []
    let pos = 0
    let searchFrom = 0

    // Map text positions to doc positions
    // We need to walk the document to map text offsets to ProseMirror positions
    const textToPos: number[] = []
    doc.descendants((node, nodePos) => {
      if (node.isText) {
        for (let i = 0; i < node.text!.length; i++) {
          textToPos.push(nodePos + i)
        }
      } else if (node.isBlock && textToPos.length > 0) {
        textToPos.push(-1) // newline placeholder
      }
    })

    while ((pos = docText.indexOf(searchText, searchFrom)) !== -1) {
      // Map text offset to doc positions
      const fromDocPos = textToPos[pos]
      const toDocPos = textToPos[pos + searchText.length - 1]
      if (fromDocPos !== undefined && toDocPos !== undefined && fromDocPos >= 0 && toDocPos >= 0) {
        results.push({ from: fromDocPos, to: toDocPos + 1 })
      }
      searchFrom = pos + 1
    }

    setMatches(results)
    if (results.length > 0 && currentIndex >= results.length) {
      setCurrentIndex(0)
    }
  }, [query, caseSensitive, editor, currentIndex])

  useEffect(() => { findMatches() }, [findMatches])

  // Navigate to current match
  useEffect(() => {
    if (matches.length === 0) return
    const match = matches[currentIndex]
    if (!match) return

    editor.chain()
      .setTextSelection({ from: match.from, to: match.to })
      .scrollIntoView()
      .run()
  }, [currentIndex, matches, editor])

  const goNext = () => {
    if (matches.length === 0) return
    setCurrentIndex((currentIndex + 1) % matches.length)
  }

  const goPrev = () => {
    if (matches.length === 0) return
    setCurrentIndex((currentIndex - 1 + matches.length) % matches.length)
  }

  const replaceCurrent = () => {
    if (matches.length === 0) return
    const match = matches[currentIndex]
    if (!match) return

    editor.chain()
      .focus()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(replacement)
      .run()

    // Re-find after replace
    setTimeout(findMatches, 10)
  }

  const replaceAll = () => {
    if (matches.length === 0) return

    // Replace from end to start to preserve positions
    const sorted = [...matches].sort((a, b) => b.from - a.from)
    let chain = editor.chain()
    for (const match of sorted) {
      chain = chain
        .setTextSelection({ from: match.from, to: match.to })
        .insertContent(replacement)
    }
    chain.run()

    setTimeout(findMatches, 10)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      goNext()
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      goPrev()
    }
  }

  return (
    <div className="find-replace" onKeyDown={handleKeyDown} role="search" aria-label="Find and replace">
      <div className="find-row">
        <input
          ref={inputRef}
          className="find-input"
          placeholder="Find..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setCurrentIndex(0) }}
          aria-label="Search text"
        />
        <span className="find-count">
          {query ? `${matches.length > 0 ? currentIndex + 1 : 0} of ${matches.length}` : ''}
        </span>
        <button className="find-btn" onClick={goPrev} title="Previous (Shift+Enter)" disabled={matches.length === 0}>&#9650;</button>
        <button className="find-btn" onClick={goNext} title="Next (Enter)" disabled={matches.length === 0}>&#9660;</button>
        <label className="find-case" title="Case sensitive">
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
          Aa
        </label>
        <button className="find-close" onClick={onClose}>&times;</button>
      </div>
      {mode === 'replace' && (
        <div className="find-row">
          <input
            className="find-input"
            placeholder="Replace..."
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            aria-label="Replacement text"
          />
          <button className="find-btn find-btn--action" onClick={replaceCurrent} disabled={matches.length === 0}>Replace</button>
          <button className="find-btn find-btn--action" onClick={replaceAll} disabled={matches.length === 0}>All</button>
        </div>
      )}
    </div>
  )
}
