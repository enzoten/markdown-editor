'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import Editor from '@/components/Editor'

interface DocSummary {
  id: string
  title: string
  updatedAt: string
}

export default function AppShell({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const [documents, setDocuments] = useState<DocSummary[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [showDocList, setShowDocList] = useState(true)
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents')
      if (res.ok) {
        const docs = await res.json()
        setDocuments(docs)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleNew = async () => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled', content: '' }),
    })
    if (res.ok) {
      const doc = await res.json()
      await fetchDocuments()
      setActiveDocId(doc.id)
      setShowDocList(false)
    }
  }

  const handleOpen = (id: string) => {
    setActiveDocId(id)
    setShowDocList(false)
  }

  const handleBack = () => {
    setShowDocList(true)
    setActiveDocId(null)
    fetchDocuments()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (activeDocId === id) {
      setActiveDocId(null)
      setShowDocList(true)
    }
    fetchDocuments()
  }

  if (showDocList && !activeDocId) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Markdown Editor</h1>
          <div className="app-header-right">
            <span className="user-name">{user.name || user.email}</span>
            <button className="auth-btn" onClick={() => signOut()}>Sign out</button>
          </div>
        </header>
        <main className="doc-list-container">
          <div className="doc-list-header">
            <h2>Your Documents</h2>
            <button className="doc-new-btn" onClick={handleNew}>+ New Document</button>
          </div>
          {loading ? (
            <p className="doc-list-empty">Loading...</p>
          ) : documents.length === 0 ? (
            <div className="doc-list-empty">
              <p>No documents yet.</p>
              <button className="doc-new-btn" onClick={handleNew}>Create your first document</button>
            </div>
          ) : (
            <div className="doc-list">
              {documents.map(doc => (
                <div key={doc.id} className="doc-list-item" onClick={() => handleOpen(doc.id)}>
                  <div className="doc-list-item-title">{doc.title || 'Untitled'}</div>
                  <div className="doc-list-item-meta">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </div>
                  <button
                    className="doc-list-item-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }}
                    title="Delete document"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="back-btn" onClick={handleBack} title="Back to documents">&larr;</button>
        <h1>Markdown Editor</h1>
        <div className="app-header-right">
          <span className="user-name">{user.name || user.email}</span>
          <button className="auth-btn" onClick={() => signOut()}>Sign out</button>
        </div>
      </header>
      <main className="app-main">
        <Editor documentId={activeDocId} />
      </main>
    </div>
  )
}
