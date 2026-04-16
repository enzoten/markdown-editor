'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Plus, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DocSummary {
  id: string
  title: string
  updatedAt: string
}

export default function FileTree({
  activeDocId,
  onOpen,
  onNew,
  visible,
  onToggle,
}: {
  activeDocId: string | null
  onOpen: (id: string) => void
  onNew: () => void
  visible: boolean
  onToggle: () => void
}) {
  const [documents, setDocuments] = useState<DocSummary[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents')
      if (res.ok) {
        setDocuments(await res.json())
      }
    } catch { /* network error */ }
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  useEffect(() => {
    const timer = setInterval(fetchDocuments, 10000)
    return () => clearInterval(timer)
  }, [fetchDocuments])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    fetchDocuments()
    if (activeDocId === id) {
      onOpen('')
    }
  }

  const handleRenameStart = (e: React.MouseEvent, doc: DocSummary) => {
    e.stopPropagation()
    setEditingId(doc.id)
    setEditingTitle(doc.title || 'Untitled')
    setTimeout(() => renameInputRef.current?.select(), 0)
  }

  const handleRenameSubmit = async (id: string) => {
    const trimmed = editingTitle.trim()
    if (trimmed) {
      await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      fetchDocuments()
    }
    setEditingId(null)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSubmit(id)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  if (!visible) {
    return (
      <button
        className="flex items-start border-r border-border bg-transparent p-2 text-muted-foreground hover:bg-accent"
        onClick={onToggle}
        title="Show file tree (Cmd+Shift+E)"
        aria-label="Show file tree"
        aria-expanded={false}
      >
        <FileText className="h-4 w-4" />
      </button>
    )
  }

  return (
    <aside className="flex w-56 min-w-[180px] flex-col border-r border-border bg-muted/50" aria-label="File tree">
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNew} title="New document">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle} title="Hide file tree (Cmd+Shift+E)">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto py-1">
        {documents.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">No documents</div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className={cn(
                'group flex items-center gap-2 border-l-2 border-transparent px-3 py-1.5 cursor-pointer hover:bg-accent/50',
                activeDocId === doc.id && 'border-l-primary bg-accent text-accent-foreground',
              )}
              onClick={() => onOpen(doc.id)}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {editingId === doc.id ? (
                <input
                  ref={renameInputRef}
                  className="flex-1 min-w-0 rounded border border-ring bg-background px-1.5 py-0.5 text-xs outline-none"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onBlur={() => handleRenameSubmit(doc.id)}
                  onKeyDown={e => handleRenameKeyDown(e, doc.id)}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span
                  className={cn(
                    'flex-1 truncate text-xs',
                    activeDocId === doc.id ? 'font-medium text-primary' : 'text-foreground',
                  )}
                  onDoubleClick={e => handleRenameStart(e, doc)}
                >
                  {doc.title || 'Untitled'}
                </span>
              )}
              <button
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                onClick={e => handleDelete(e, doc.id)}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </nav>
    </aside>
  )
}
