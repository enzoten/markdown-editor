'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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

  // Refresh doc list when active document changes (e.g., after auto-save updates title)
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
      onOpen('')  // clear active doc
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
        className="filetree-toggle filetree-toggle--collapsed"
        onClick={onToggle}
        title="Show file tree (Cmd+Shift+E)"
        aria-label="Show file tree"
        aria-expanded={false}
      >
        <span className="filetree-toggle-icon">&#128196;</span>
      </button>
    )
  }

  return (
    <aside className="filetree-sidebar" aria-label="File tree">
      <div className="filetree-header">
        <span className="filetree-title">Documents</span>
        <button className="filetree-new" onClick={onNew} title="New document">+</button>
        <button
          className="filetree-toggle"
          onClick={onToggle}
          title="Hide file tree (Cmd+Shift+E)"
          aria-label="Hide file tree"
          aria-expanded={true}
        >
          &times;
        </button>
      </div>
      <nav className="filetree-list">
        {documents.length === 0 ? (
          <div className="filetree-empty">No documents</div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className={`filetree-item ${activeDocId === doc.id ? 'filetree-item--active' : ''}`}
              onClick={() => onOpen(doc.id)}
            >
              <span className="filetree-item-icon">&#128196;</span>
              {editingId === doc.id ? (
                <input
                  ref={renameInputRef}
                  className="filetree-rename-input"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onBlur={() => handleRenameSubmit(doc.id)}
                  onKeyDown={e => handleRenameKeyDown(e, doc.id)}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span
                  className="filetree-item-title"
                  onDoubleClick={e => handleRenameStart(e, doc)}
                >
                  {doc.title || 'Untitled'}
                </span>
              )}
              <button
                className="filetree-item-delete"
                onClick={e => handleDelete(e, doc.id)}
                title="Delete"
              >
                &times;
              </button>
            </div>
          ))
        )}
      </nav>
    </aside>
  )
}
