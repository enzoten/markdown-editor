'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import Editor from '@/components/Editor'
import FileTree from '@/components/FileTree'
import { Button } from '@/components/ui/button'

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
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
        <h1 className="flex-1 text-sm font-semibold text-muted-foreground tracking-wide">Markdown Editor</h1>
        <span className="text-xs text-muted-foreground">{user.name || user.email}</span>
        <Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <FileTree
          activeDocId={activeDocId}
          onOpen={handleOpen}
          onNew={handleNew}
          visible={fileTreeVisible}
          onToggle={() => setFileTreeVisible(v => !v)}
        />
        <main className="flex-1 flex overflow-hidden">
          {activeDocId ? (
            <Editor key={activeDocId} documentId={activeDocId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground gap-4">
              <p className="text-sm">Select a document or create a new one.</p>
              <Button onClick={handleNew}>+ New Document</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
