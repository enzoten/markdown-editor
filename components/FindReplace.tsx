'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  useEffect(() => { inputRef.current?.focus() }, [])

  const findMatches = useCallback(() => {
    if (!query) { setMatches([]); return }
    const doc = editor.state.doc
    const text = doc.textBetween(0, doc.content.size, '\n')
    const searchText = caseSensitive ? query : query.toLowerCase()
    const docText = caseSensitive ? text : text.toLowerCase()
    const results: { from: number; to: number }[] = []
    let pos = 0
    let searchFrom = 0
    const textToPos: number[] = []
    doc.descendants((node, nodePos) => {
      if (node.isText) {
        for (let i = 0; i < node.text!.length; i++) textToPos.push(nodePos + i)
      } else if (node.isBlock && textToPos.length > 0) {
        textToPos.push(-1)
      }
    })
    while ((pos = docText.indexOf(searchText, searchFrom)) !== -1) {
      const fromDocPos = textToPos[pos]
      const toDocPos = textToPos[pos + searchText.length - 1]
      if (fromDocPos !== undefined && toDocPos !== undefined && fromDocPos >= 0 && toDocPos >= 0) {
        results.push({ from: fromDocPos, to: toDocPos + 1 })
      }
      searchFrom = pos + 1
    }
    setMatches(results)
    if (results.length > 0 && currentIndex >= results.length) setCurrentIndex(0)
  }, [query, caseSensitive, editor, currentIndex])

  useEffect(() => { findMatches() }, [findMatches])

  useEffect(() => {
    if (matches.length === 0) return
    const match = matches[currentIndex]
    if (!match) return
    editor.chain().setTextSelection({ from: match.from, to: match.to }).scrollIntoView().run()
  }, [currentIndex, matches, editor])

  const goNext = () => { if (matches.length > 0) setCurrentIndex((currentIndex + 1) % matches.length) }
  const goPrev = () => { if (matches.length > 0) setCurrentIndex((currentIndex - 1 + matches.length) % matches.length) }

  const replaceCurrent = () => {
    if (matches.length === 0) return
    const match = matches[currentIndex]
    if (!match) return
    editor.chain().focus().setTextSelection({ from: match.from, to: match.to }).insertContent(replacement).run()
    setTimeout(findMatches, 10)
  }

  const replaceAll = () => {
    if (matches.length === 0) return
    const sorted = [...matches].sort((a, b) => b.from - a.from)
    let chain = editor.chain()
    for (const match of sorted) {
      chain = chain.setTextSelection({ from: match.from, to: match.to }).insertContent(replacement)
    }
    chain.run()
    setTimeout(findMatches, 10)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); goNext() }
    else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); goPrev() }
  }

  return (
    <div className="border-b border-border bg-muted/30 px-3 py-1.5 flex flex-col gap-1" onKeyDown={handleKeyDown} role="search" aria-label="Find and replace">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          placeholder="Find..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setCurrentIndex(0) }}
          aria-label="Search text"
        />
        <span className="text-[10px] text-muted-foreground min-w-[60px] text-center">
          {query ? `${matches.length > 0 ? currentIndex + 1 : 0} of ${matches.length}` : ''}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goPrev} disabled={matches.length === 0} title="Previous (Shift+Enter)">
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goNext} disabled={matches.length === 0} title="Next (Enter)">
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer px-1" title="Case sensitive">
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="rounded" />
          Aa
        </label>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {mode === 'replace' && (
        <div className="flex items-center gap-1.5">
          <input
            className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            placeholder="Replace..."
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            aria-label="Replacement text"
          />
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={replaceCurrent} disabled={matches.length === 0}>Replace</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={replaceAll} disabled={matches.length === 0}>All</Button>
        </div>
      )}
    </div>
  )
}
