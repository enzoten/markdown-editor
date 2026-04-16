import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileTree from '@/components/FileTree'

const mockDocs = [
  { id: '1', title: 'First Doc', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', title: 'Second Doc', updatedAt: '2026-01-02T00:00:00Z' },
]

beforeEach(() => {
  vi.restoreAllMocks()
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockDocs),
  }) as unknown as typeof fetch
})

describe('FileTree', () => {
  it('renders document list after loading', async () => {
    render(
      <FileTree activeDocId={null} onOpen={() => {}} onNew={() => {}} visible={true} onToggle={() => {}} />
    )
    await waitFor(() => {
      expect(screen.getByText('First Doc')).toBeInTheDocument()
      expect(screen.getByText('Second Doc')).toBeInTheDocument()
    })
  })

  it('shows collapsed toggle when not visible', () => {
    render(
      <FileTree activeDocId={null} onOpen={() => {}} onNew={() => {}} visible={false} onToggle={() => {}} />
    )
    expect(screen.getByTitle('Show file tree (Cmd+Shift+E)')).toBeInTheDocument()
  })

  it('highlights active document', async () => {
    render(
      <FileTree activeDocId="1" onOpen={() => {}} onNew={() => {}} visible={true} onToggle={() => {}} />
    )
    await waitFor(() => {
      const item = screen.getByText('First Doc').closest('.filetree-item')
      expect(item).toHaveClass('filetree-item--active')
    })
  })

  it('calls onOpen when a document is clicked', async () => {
    const onOpen = vi.fn()
    render(
      <FileTree activeDocId={null} onOpen={onOpen} onNew={() => {}} visible={true} onToggle={() => {}} />
    )
    await waitFor(() => screen.getByText('First Doc'))
    await userEvent.click(screen.getByText('First Doc'))
    expect(onOpen).toHaveBeenCalledWith('1')
  })

  it('calls onNew when + button is clicked', async () => {
    const onNew = vi.fn()
    render(
      <FileTree activeDocId={null} onOpen={() => {}} onNew={onNew} visible={true} onToggle={() => {}} />
    )
    await userEvent.click(screen.getByTitle('New document'))
    expect(onNew).toHaveBeenCalled()
  })

  it('calls onToggle when close button is clicked', async () => {
    const onToggle = vi.fn()
    render(
      <FileTree activeDocId={null} onOpen={() => {}} onNew={() => {}} visible={true} onToggle={onToggle} />
    )
    await userEvent.click(screen.getByTitle('Hide file tree (Cmd+Shift+E)'))
    expect(onToggle).toHaveBeenCalled()
  })

  it('shows empty state when no documents', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as unknown as typeof fetch

    render(
      <FileTree activeDocId={null} onOpen={() => {}} onNew={() => {}} visible={true} onToggle={() => {}} />
    )
    await waitFor(() => {
      expect(screen.getByText('No documents')).toBeInTheDocument()
    })
  })

  it('shows delete button on hover', async () => {
    render(
      <FileTree activeDocId={null} onOpen={() => {}} onNew={() => {}} visible={true} onToggle={() => {}} />
    )
    await waitFor(() => screen.getByText('First Doc'))
    // Delete buttons exist but are hidden via CSS (opacity: 0)
    const deleteButtons = screen.getAllByTitle('Delete')
    expect(deleteButtons.length).toBe(2)
  })
})
