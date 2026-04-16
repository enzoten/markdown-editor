'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'

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
      if (res.ok) {
        setComments(await res.json())
      }
    } catch { /* network error */ }
  }, [documentId])

  useEffect(() => { fetchComments() }, [fetchComments])

  // Capture selection when entering "adding comment" mode
  useEffect(() => {
    if (addingComment) {
      const { from, to } = editor.state.selection
      if (from !== to) {
        selectionRef.current = { from, to }
      }
      setTimeout(() => newCommentRef.current?.focus(), 50)
    } else {
      setNewCommentText('')
      selectionRef.current = null
    }
  }, [addingComment, editor])

  // Highlight active comment when clicking on commented text
  useEffect(() => {
    const handleClick = () => {
      const attrs = editor.getAttributes('comment')
      const commentId = attrs?.commentId as string | undefined
      setActiveCommentId(commentId || null)
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
        editor.chain()
          .setTextSelection({ from, to })
          .setComment(comment.id)
          .run()
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

    await fetch(`/api/documents/${documentId}/comments/${commentId}`, {
      method: 'DELETE',
    })
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
    if (user.name) {
      return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    }
    return user.email[0].toUpperCase()
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredComments = showResolved
    ? comments
    : comments.filter(c => !c.resolved)

  if (!visible) {
    const openCount = comments.filter(c => !c.resolved).length
    return (
      <button
        className="comment-toggle comment-toggle--collapsed"
        onClick={onToggle}
        title="Show comments"
        aria-label="Show comments"
      >
        <span className="comment-toggle-icon">💬</span>
        {openCount > 0 && (
          <span className="comment-badge">{openCount}</span>
        )}
      </button>
    )
  }

  return (
    <aside className="comment-sidebar" aria-label="Comments">
      <div className="comment-header">
        <span className="comment-title">Comments</span>
        <label className="comment-resolved-toggle">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={e => setShowResolved(e.target.checked)}
          />
          Resolved
        </label>
        <button className="comment-close" onClick={onToggle} title="Hide comments">&times;</button>
      </div>

      <div className="comment-list">
        {/* New comment input — appears at top when adding */}
        {addingComment && (
          <div className="comment-thread comment-thread--active comment-thread--new">
            <div className="comment-main">
              <textarea
                ref={newCommentRef}
                className="comment-new-textarea"
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
              <div className="comment-new-actions">
                <button className="comment-new-cancel" onClick={onCancelAdd}>Cancel</button>
                <button
                  className="comment-new-submit"
                  onClick={handleNewComment}
                  disabled={!newCommentText.trim() || submitting}
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredComments.length === 0 && !addingComment ? (
          <div className="comment-empty">
            {comments.length === 0
              ? 'Select text and click 💬 to add a comment.'
              : 'No open comments.'}
          </div>
        ) : (
          filteredComments.map(comment => (
            <div
              key={comment.id}
              className={`comment-thread ${activeCommentId === comment.id ? 'comment-thread--active' : ''} ${comment.resolved ? 'comment-thread--resolved' : ''}`}
              onClick={() => handleCommentClick(comment.id)}
            >
              <div className="comment-main">
                <div className="comment-meta">
                  <span className="comment-avatar">{getInitials(comment.user)}</span>
                  <div className="comment-meta-text">
                    <span className="comment-author">{comment.user.name || comment.user.email}</span>
                    <span className="comment-date">{formatTime(comment.createdAt)}</span>
                  </div>
                  <div className="comment-actions">
                    {comment.resolved ? (
                      <button
                        className="comment-action-btn"
                        onClick={e => { e.stopPropagation(); handleResolve(comment.id, false) }}
                        title="Re-open"
                      >
                        ↩
                      </button>
                    ) : (
                      <button
                        className="comment-action-btn"
                        onClick={e => { e.stopPropagation(); handleResolve(comment.id, true) }}
                        title="Resolve"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="comment-action-btn comment-action-btn--danger"
                      onClick={e => { e.stopPropagation(); handleDelete(comment.id) }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="comment-content">{comment.content}</div>
              </div>

              {comment.replies.map(reply => (
                <div key={reply.id} className="comment-reply">
                  <div className="comment-meta">
                    <span className="comment-avatar comment-avatar--small">{getInitials(reply.user)}</span>
                    <div className="comment-meta-text">
                      <span className="comment-author">{reply.user.name || reply.user.email}</span>
                      <span className="comment-date">{formatTime(reply.createdAt)}</span>
                    </div>
                  </div>
                  <div className="comment-content">{reply.content}</div>
                </div>
              ))}

              {activeCommentId === comment.id && !comment.resolved && (
                <div className="comment-reply-form">
                  <input
                    className="comment-reply-input"
                    placeholder="Reply..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleReply(comment.id)
                      }
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    className="comment-reply-submit"
                    onClick={e => { e.stopPropagation(); handleReply(comment.id) }}
                    disabled={!replyText.trim()}
                  >
                    ↵
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
