'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import Editor from '@/components/Editor'
import FileTree from '@/components/FileTree'

export default function AppShell({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [fileTreeVisible, setFileTreeVisible] = useState(true)

  const handleNew = useCallback(async () => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled', content: '' }),
    })
    if (res.ok) {
      const doc = await res.json()
      setActiveDocId(doc.id)
    }
  }, [])

  const handleOpen = useCallback((id: string) => {
    if (id) {
      setActiveDocId(id)
    } else {
      setActiveDocId(null)
    }
  }, [])

  // Keyboard shortcut: Cmd+Shift+E to toggle file tree
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        setFileTreeVisible(v => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Markdown Editor</h1>
        <div className="app-header-right">
          <span className="user-name">{user.name || user.email}</span>
          <button className="auth-btn" onClick={() => signOut()}>Sign out</button>
        </div>
      </header>
      <div className="app-body">
        <FileTree
          activeDocId={activeDocId}
          onOpen={handleOpen}
          onNew={handleNew}
          visible={fileTreeVisible}
          onToggle={() => setFileTreeVisible(v => !v)}
        />
        <main className="app-main">
          {activeDocId ? (
            <Editor key={activeDocId} documentId={activeDocId} />
          ) : (
            <div className="app-empty">
              <p>Select a document or create a new one.</p>
              <button className="doc-new-btn" onClick={handleNew}>+ New Document</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
