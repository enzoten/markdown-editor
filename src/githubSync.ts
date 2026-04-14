const TOKEN_KEY = 'md-editor-gh-token'
const REPO_OWNER = 'enzoten'
const REPO_NAME = 'markdown-editor'

export function getGitHubToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setGitHubToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearGitHubToken() {
  localStorage.removeItem(TOKEN_KEY)
}

const TYPE_LABELS: Record<string, string[]> = {
  bug: ['bug'],
  feature: ['enhancement'],
  note: ['feedback'],
}

interface SyncTicket {
  type: 'bug' | 'feature' | 'note'
  title: string
  description: string
}

interface SyncResult {
  success: boolean
  issueNumber?: number
  issueUrl?: string
  error?: string
}

export async function syncTicketToGitHub(ticket: SyncTicket): Promise<SyncResult> {
  const token = getGitHubToken()
  if (!token) {
    return { success: false, error: 'No GitHub token configured' }
  }

  const labels = TYPE_LABELS[ticket.type] || []
  const body = ticket.description || '_No description provided._'

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: ticket.title,
          body: body,
          labels: labels,
        }),
      }
    )

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      const message = errBody.message || `GitHub API returned ${res.status}`
      return { success: false, error: message }
    }

    const data = await res.json()
    return {
      success: true,
      issueNumber: data.number,
      issueUrl: data.html_url,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    })
    return res.ok
  } catch {
    return false
  }
}
