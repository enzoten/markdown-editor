import { useState, useEffect, useCallback } from 'react'

interface FeedbackTicket {
  id: string
  type: 'bug' | 'feature' | 'note'
  title: string
  description: string
  createdAt: string
  synced: boolean
}

const STORAGE_KEY = 'md-editor-feedback'

function loadTickets(): FeedbackTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveTickets(tickets: FeedbackTicket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'form' | 'list'>('form')
  const [tickets, setTickets] = useState<FeedbackTicket[]>(loadTickets)
  const [toast, setToast] = useState<string | null>(null)

  // Form state
  const [type, setType] = useState<'bug' | 'feature' | 'note'>('bug')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const unsyncedCount = tickets.filter(t => !t.synced).length

  useEffect(() => { saveTickets(tickets) }, [tickets])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return
    const ticket: FeedbackTicket = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      synced: false,
    }
    setTickets(prev => [ticket, ...prev])
    setTitle('')
    setDescription('')
    setType('bug')
    setToast('Feedback saved!')
    setOpen(false)
  }, [type, title, description])

  const handleDelete = useCallback((id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      {/* Toast notification */}
      {toast && <div className="fb-toast">{toast}</div>}

      {/* Panel */}
      {open && (
        <div className="fb-panel" onKeyDown={handleKeyDown}>
          <div className="fb-header">
            <div className="fb-tabs">
              <button
                className={`fb-tab ${view === 'form' ? 'fb-tab--active' : ''}`}
                onClick={() => setView('form')}
              >
                New
              </button>
              <button
                className={`fb-tab ${view === 'list' ? 'fb-tab--active' : ''}`}
                onClick={() => setView('list')}
              >
                All ({tickets.length})
              </button>
            </div>
            <button className="fb-close" onClick={() => setOpen(false)}>&times;</button>
          </div>

          {view === 'form' ? (
            <div className="fb-form">
              <div className="fb-type-row">
                {(['bug', 'feature', 'note'] as const).map(t => (
                  <button
                    key={t}
                    className={`fb-type-chip ${type === t ? 'fb-type-chip--active' : ''}`}
                    onClick={() => setType(t)}
                  >
                    {t === 'bug' ? '🐛 Bug' : t === 'feature' ? '✨ Feature' : '📝 Note'}
                  </button>
                ))}
              </div>
              <input
                className="fb-input"
                placeholder="What's on your mind?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
              <textarea
                className="fb-textarea"
                placeholder="Details (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
              <button
                className="fb-submit"
                onClick={handleSubmit}
                disabled={!title.trim()}
              >
                Submit
              </button>
            </div>
          ) : (
            <div className="fb-list">
              {tickets.length === 0 ? (
                <div className="fb-empty">No feedback yet</div>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className="fb-ticket">
                    <div className="fb-ticket-header">
                      <span className={`fb-ticket-type fb-ticket-type--${t.type}`}>
                        {t.type === 'bug' ? '🐛' : t.type === 'feature' ? '✨' : '📝'}
                      </span>
                      <span className="fb-ticket-title">{t.title}</span>
                      <button className="fb-ticket-delete" onClick={() => handleDelete(t.id)}>&times;</button>
                    </div>
                    {t.description && (
                      <div className="fb-ticket-desc">{t.description}</div>
                    )}
                    <div className="fb-ticket-meta">
                      {new Date(t.createdAt).toLocaleDateString()} · {t.synced ? 'Synced' : 'Pending'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* FAB button */}
      <button className="fb-fab" onClick={() => setOpen(o => !o)} title="Send feedback">
        <span className="fb-fab-icon">{open ? '×' : '💬'}</span>
        {!open && unsyncedCount > 0 && (
          <span className="fb-fab-badge">{unsyncedCount}</span>
        )}
      </button>
    </>
  )
}
