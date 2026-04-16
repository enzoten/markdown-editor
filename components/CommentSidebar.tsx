'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { MessageSquare, Check, X, Undo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CommentUser {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Reply {
  id: string
  content: string
  user: CommentUser
  createdAt: string
}

interface Comment {
  id: string
  content: string
  resolved: boolean
  user: CommentUser
  replies: Reply[]
  createdAt: string
}

export default function CommentSidebar({
  editor,
  documentId,
  visible,
  onToggle,
  addingComment,
  onCancelAdd,
}: {
  editor: Editor
  documentId: string
  visible: boolean
  onToggle: () => void
  addingComment: boolean
  onCancelAdd: () => void
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [newCommentText, setNewCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const newCommentRef = useRef<HTMLTextAreaElement>(null)
  const selectionRef = useRef<{ from: number; to: number } | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`)
      if (res.ok) setComments(await res.json())
    } catch { /* network error */ }
  }, [documentId])

  useEffect(() => { fetchComments() }, [fetchComments])

  useEffect(() => {
    if (addingComment) {
      const { from, to } = editor.state.selection
      if (from !== to) selectionRef.current = { from, to }
      setTimeout(() => newCommentRef.current?.focus(), 50)
    } else {
      setNewCommentText('')
      selectionRef.current = null
    }
  }, [addingComment, editor])

  useEffect(() => {
    const handleClick = () => {
      const attrs = editor.getAttributes('comment')
      setActiveCommentId((attrs?.commentId as string) || null)
    }
    editor.on('selectionUpdate', handleClick)
    return () => { editor.off('selectionUpdate', handleClick) }
  }, [editor])

  const handleNewComment = async () => {
    if (!newCommentText.trim() || submitting || !selectionRef.current) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newCommentText.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        const { from, to } = selectionRef.current
        editor.chain().setTextSelection({ from, to }).setComment(comment.id).run()
        fetchComments()
        onCancelAdd()
        setActiveCommentId(comment.id)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (commentId: string, resolved: boolean) => {
    await fetch(`/api/documents/${documentId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved }),
    })
    fetchComments()
  }

  const handleDelete = async (commentId: string) => {
    const { state } = editor
    const { tr } = state
    let removed = false
    state.doc.descendants((node, pos) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'comment' && mark.attrs.commentId === commentId) {
          tr.removeMark(pos, pos + node.nodeSize, mark.type.create({ commentId }))
          removed = true
        }
      })
    })
    if (removed) editor.view.dispatch(tr)
    await fetch(`/api/documents/${documentId}/comments/${commentId}`, { method: 'DELETE' })
    fetchComments()
    if (activeCommentId === commentId) setActiveCommentId(null)
  }

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return
    await fetch(`/api/documents/${documentId}/comments/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText.trim() }),
    })
    setReplyText('')
    fetchComments()
  }

  const handleCommentClick = (commentId: string) => {
    setActiveCommentId(commentId)
    const { state } = editor
    state.doc.descendants((node, pos) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'comment' && mark.attrs.commentId === commentId) {
          editor.chain().setTextSelection(pos).scrollIntoView().run()
        }
      })
    })
  }

  const getInitials = (user: CommentUser) => {
    if (user.name) return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    return user.email[0].toUpperCase()
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredComments = showResolved ? comments : comments.filter(c => !c.resolved)

  if (!visible) {
    const openCount = comments.filter(c => !c.resolved).length
    return (
      <button
        className="flex flex-col items-center gap-1 border-l border-border bg-transparent p-2 text-muted-foreground hover:bg-accent"
        onClick={onToggle}
        title="Show comments"
        aria-label="Show comments"
      >
        <MessageSquare className="h-4 w-4" />
        {openCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{openCount}</span>
        )}
      </button>
    )
  }

  return (
    <aside className="flex w-72 min-w-[240px] flex-col border-l border-border bg-muted/30" aria-label="Comments">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comments</span>
        <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} className="rounded" />
          Resolved
        </label>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle} title="Hide comments">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {addingComment && (
          <div className="rounded-lg border-2 border-primary bg-card p-3 shadow-sm">
            <textarea
              ref={newCommentRef}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="Add a comment..."
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleNewComment()
                } else if (e.key === 'Escape') {
                  onCancelAdd()
                }
              }}
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" size="sm" onClick={onCancelAdd}>Cancel</Button>
              <Button size="sm" onClick={handleNewComment} disabled={!newCommentText.trim() || submitting}>
                Comment
              </Button>
            </div>
          </div>
        )}

        {filteredComments.length === 0 && !addingComment ? (
          <div className="px-2 py-8 text-center text-xs text-muted-foreground leading-relaxed">
            {comments.length === 0 ? 'Select text and click the comment button to add one.' : 'No open comments.'}
          </div>
        ) : (
          filteredComments.map(comment => (
            <div
              key={comment.id}
              className={cn(
                'rounded-lg border border-border bg-card cursor-pointer transition-all hover:border-muted-foreground/30',
                activeCommentId === comment.id && 'border-primary ring-1 ring-primary',
                comment.resolved && 'opacity-60',
              )}
              onClick={() => handleCommentClick(comment.id)}
            >
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {getInitials(comment.user)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{comment.user.name || comment.user.email}</div>
                    <div className="text-[10px] text-muted-foreground">{formatTime(comment.createdAt)}</div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={e => { e.stopPropagation(); handleResolve(comment.id, !comment.resolved) }}
                      title={comment.resolved ? 'Re-open' : 'Resolve'}
                    >
                      {comment.resolved ? <Undo className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                      onClick={e => { e.stopPropagation(); handleDelete(comment.id) }}
                      title="Delete"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-foreground/80 leading-relaxed">{comment.content}</div>
              </div>

              {comment.replies.map(reply => (
                <div key={reply.id} className="border-t border-border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 text-[8px] font-semibold text-foreground">
                      {getInitials(reply.user)}
                    </span>
                    <span className="text-[11px] font-medium text-foreground">{reply.user.name || reply.user.email}</span>
                    <span className="text-[10px] text-muted-foreground">{formatTime(reply.createdAt)}</span>
                  </div>
                  <div className="text-xs text-foreground/70 leading-relaxed">{reply.content}</div>
                </div>
              ))}

              {activeCommentId === comment.id && !comment.resolved && (
                <div className="flex gap-1.5 border-t border-border p-2">
                  <input
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="Reply..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleReply(comment.id) } }}
                    onClick={e => e.stopPropagation()}
                  />
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={e => { e.stopPropagation(); handleReply(comment.id) }} disabled={!replyText.trim()}>
                    Reply
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
