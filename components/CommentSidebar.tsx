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
}: {
  editor: Editor
  documentId: string
  visible: boolean
  onToggle: () => void
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const replyInputRef = useRef<HTMLInputElement>(null)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`)
      if (res.ok) {
        setComments(await res.json())
      }
    } catch { /* network error */ }
  }, [documentId])

  useEffect(() => { fetchComments() }, [fetchComments])

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

  const handleResolve = async (commentId: string, resolved: boolean) => {
    await fetch(`/api/documents/${documentId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved }),
    })
    fetchComments()
  }

  const handleDelete = async (commentId: string) => {
    // Remove the mark from the editor
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
    // Scroll to the highlighted text in the editor
    const { state } = editor
    state.doc.descendants((node, pos) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'comment' && mark.attrs.commentId === commentId) {
          editor.chain().setTextSelection(pos).scrollIntoView().run()
        }
      })
    })
  }

  const filteredComments = showResolved
    ? comments
    : comments.filter(c => !c.resolved)

  if (!visible) {
    return (
      <button
        className="comment-toggle comment-toggle--collapsed"
        onClick={onToggle}
        title="Show comments"
        aria-label="Show comments"
      >
        <span className="comment-toggle-icon">💬</span>
        {comments.filter(c => !c.resolved).length > 0 && (
          <span className="comment-badge">{comments.filter(c => !c.resolved).length}</span>
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
          Show resolved
        </label>
        <button className="comment-close" onClick={onToggle} title="Hide comments">&times;</button>
      </div>
      <div className="comment-list">
        {filteredComments.length === 0 ? (
          <div className="comment-empty">
            {comments.length === 0
              ? 'No comments yet. Select text and click the comment button to add one.'
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
                  <span className="comment-author">{comment.user.name || comment.user.email}</span>
                  <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="comment-content">{comment.content}</div>
                <div className="comment-actions">
                  <button
                    className="comment-action-btn"
                    onClick={e => { e.stopPropagation(); handleResolve(comment.id, !comment.resolved) }}
                  >
                    {comment.resolved ? 'Re-open' : 'Resolve'}
                  </button>
                  <button
                    className="comment-action-btn comment-action-btn--danger"
                    onClick={e => { e.stopPropagation(); handleDelete(comment.id) }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {comment.replies.map(reply => (
                <div key={reply.id} className="comment-reply">
                  <div className="comment-meta">
                    <span className="comment-author">{reply.user.name || reply.user.email}</span>
                    <span className="comment-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="comment-content">{reply.content}</div>
                </div>
              ))}
              {activeCommentId === comment.id && !comment.resolved && (
                <div className="comment-reply-form">
                  <input
                    ref={replyInputRef}
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
                    Reply
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
