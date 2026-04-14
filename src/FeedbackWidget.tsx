import { useState, useEffect, useCallback } from 'react'
import { getGitHubToken, setGitHubToken, clearGitHubToken, syncTicketToGitHub, validateToken } from './githubSync'

interface FeedbackTicket {
  id: string
  type: 'bug' | 'feature' | 'note'
  title: string
  description: string
  createdAt: string
  synced: boolean
  issueNumber?: number
  issueUrl?: string
  syncError?: string
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
  const [view, setView] = useState<'form' | 'list' | 'settings'>('form')
  const [tickets, setTickets] = useState<FeedbackTicket[]>(loadTickets)
  const [toast, setToast] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<Set<string>>(new Set())

  // Form state
  const [type, setType] = useState<'bug' | 'feature' | 'note'>('bug')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Settings state
  const [tokenInput, setTokenInput] = useState('')
  const [hasToken, setHasToken] = useState(() => !!getGitHubToken())
  const [tokenValidating, setTokenValidating] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const unsyncedCount = tickets.filter(t => !t.synced).length

  useEffect(() => { saveTickets(tickets) }, [tickets])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const syncTicket = useCallback(async (ticket: FeedbackTicket) => {
    if (!getGitHubToken()) {
      setToast('Set up GitHub token in Settings first')
      return
    }

    setSyncing(prev => new Set(prev).add(ticket.id))

    const result = await syncTicketToGitHub({
      type: ticket.type,
      title: ticket.title,
      description: ticket.description,
    })

    setSyncing(prev => {
      const next = new Set(prev)
      next.delete(ticket.id)
      return next
    })

    if (result.success) {
      setTickets(prev => prev.map(t =>
        t.id === ticket.id
          ? { ...t, synced: true, issueNumber: result.issueNumber, issueUrl: result.issueUrl, syncError: undefined }
          : t
      ))
      setToast(`Synced as issue #${result.issueNumber}`)
    } else {
      setTickets(prev => prev.map(t =>
        t.id === ticket.id
          ? { ...t, syncError: result.error }
          : t
      ))
      setToast(`Sync failed: ${result.error}`)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
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

    // Auto-sync if token is configured
    if (getGitHubToken()) {
      // Small delay so the UI updates first
      setTimeout(() => syncTicket(ticket), 100)
    }
  }, [type, title, description, syncTicket])

  const handleSyncAll = useCallback(async () => {
    const unsynced = tickets.filter(t => !t.synced)
    for (const ticket of unsynced) {
      await syncTicket(ticket)
    }
  }, [tickets, syncTicket])

  const handleDelete = useCallback((id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleSaveToken = useCallback(async () => {
    const trimmed = tokenInput.trim()
    if (!trimmed) return

    setTokenValidating(true)
    setTokenError(null)

    const valid = await validateToken(trimmed)

    setTokenValidating(false)

    if (valid) {
      setGitHubToken(trimmed)
      setHasToken(true)
      setTokenInput('')
      setToast('GitHub token saved')
    } else {
      setTokenError('Invalid token — could not authenticate with GitHub')
    }
  }, [tokenInput])

  const handleRemoveToken = useCallback(() => {
    clearGitHubToken()
    setHasToken(false)
    setTokenInput('')
    setTokenError(null)
    setToast('GitHub token removed')
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
              <button
                className={`fb-tab ${view === 'settings' ? 'fb-tab--active' : ''}`}
                onClick={() => setView('settings')}
                title="Settings"
              >
                Settings
              </button>
            </div>
            <button className="fb-close" onClick={() => setOpen(false)}>&times;</button>
          </div>

          {view === 'form' ? (
            <div className="fb-form">
              {!hasToken && (
                <div className="fb-notice">
                  Add a GitHub token in <button className="fb-notice-link" onClick={() => setView('settings')}>Settings</button> to sync feedback as issues.
                </div>
              )}
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
                Submit{hasToken ? ' & Sync' : ''}
              </button>
            </div>
          ) : view === 'list' ? (
            <div className="fb-list">
              {unsyncedCount > 0 && hasToken && (
                <button className="fb-sync-all" onClick={handleSyncAll}>
                  Sync {unsyncedCount} unsynced {unsyncedCount === 1 ? 'ticket' : 'tickets'}
                </button>
              )}
              {tickets.length === 0 ? (
                <div className="fb-empty">No feedback yet</div>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className={`fb-ticket ${t.syncError ? 'fb-ticket--error' : ''}`}>
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
                      {new Date(t.createdAt).toLocaleDateString()}
                      {' · '}
                      {syncing.has(t.id) ? (
                        <span className="fb-ticket-syncing">Syncing...</span>
                      ) : t.synced ? (
                        <a
                          className="fb-ticket-link"
                          href={t.issueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          #{t.issueNumber}
                        </a>
                      ) : (
                        <>
                          <span className="fb-ticket-pending">Pending</span>
                          {hasToken && (
                            <button
                              className="fb-ticket-retry"
                              onClick={() => syncTicket(t)}
                            >
                              Sync
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {t.syncError && (
                      <div className="fb-ticket-error">{t.syncError}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="fb-settings">
              <div className="fb-settings-section">
                <div className="fb-settings-label">GitHub Token</div>
                <p className="fb-settings-help">
                  A personal access token with <code>repo</code> scope, used to create issues in the project repo.
                </p>
                {hasToken ? (
                  <div className="fb-settings-token-active">
                    <span className="fb-settings-token-status">Token configured</span>
                    <button className="fb-settings-remove" onClick={handleRemoveToken}>Remove</button>
                  </div>
                ) : (
                  <>
                    <input
                      className="fb-input"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={tokenInput}
                      onChange={e => { setTokenInput(e.target.value); setTokenError(null) }}
                      autoFocus
                    />
                    {tokenError && <div className="fb-settings-error">{tokenError}</div>}
                    <button
                      className="fb-submit"
                      onClick={handleSaveToken}
                      disabled={!tokenInput.trim() || tokenValidating}
                    >
                      {tokenValidating ? 'Validating...' : 'Save Token'}
                    </button>
                  </>
                )}
              </div>
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
