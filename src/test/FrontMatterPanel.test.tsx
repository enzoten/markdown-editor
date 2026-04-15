import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FrontMatterPanel from '../FrontMatterPanel'

describe('FrontMatterPanel', () => {
  it('shows "Add Front Matter" when data is null', () => {
    render(<FrontMatterPanel data={null} onChange={() => {}} />)
    expect(screen.getByText('+ Add Front Matter')).toBeInTheDocument()
  })

  it('calls onChange with default data when "Add Front Matter" is clicked', async () => {
    const onChange = vi.fn()
    render(<FrontMatterPanel data={null} onChange={onChange} />)
    await userEvent.click(screen.getByText('+ Add Front Matter'))
    expect(onChange).toHaveBeenCalledWith({ title: '', status: 'draft' })
  })

  it('renders collapsed by default when data is present', () => {
    render(<FrontMatterPanel data={{ title: 'Test' }} onChange={() => {}} />)
    expect(screen.getByText('Front Matter')).toBeInTheDocument()
    expect(screen.getByText('1 fields')).toBeInTheDocument()
  })

  it('expands when collapsed toggle is clicked', async () => {
    render(<FrontMatterPanel data={{ title: 'Test', status: 'draft' }} onChange={() => {}} />)
    // Initially collapsed
    expect(screen.getByText('2 fields')).toBeInTheDocument()
    // Click to expand
    await userEvent.click(screen.getByText('Front Matter'))
    // Should now show the field key
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('status')).toBeInTheDocument()
  })

  it('renders string fields as text inputs when expanded', async () => {
    render(<FrontMatterPanel data={{ title: 'Hello' }} onChange={() => {}} />)
    await userEvent.click(screen.getByText('Front Matter'))
    const input = screen.getByDisplayValue('Hello')
    expect(input).toBeInTheDocument()
  })

  it('renders boolean fields as checkboxes when expanded', async () => {
    render(<FrontMatterPanel data={{ draft: true }} onChange={() => {}} />)
    await userEvent.click(screen.getByText('Front Matter'))
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('renders array fields as tags when expanded', async () => {
    render(<FrontMatterPanel data={{ tags: ['one', 'two'] }} onChange={() => {}} />)
    await userEvent.click(screen.getByText('Front Matter'))
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })

  it('calls onChange when a string field is edited', async () => {
    const onChange = vi.fn()
    render(<FrontMatterPanel data={{ title: 'Old' }} onChange={onChange} />)
    await userEvent.click(screen.getByText('Front Matter'))
    const input = screen.getByDisplayValue('Old')
    await userEvent.type(input, 'X')
    // onChange should have been called with the updated value
    expect(onChange).toHaveBeenCalledWith({ title: 'OldX' })
  })

  it('calls onChange when a tag is removed', async () => {
    const onChange = vi.fn()
    render(<FrontMatterPanel data={{ tags: ['keep', 'remove'] }} onChange={onChange} />)
    await userEvent.click(screen.getByText('Front Matter'))
    // Each tag has an x button
    const removeButtons = screen.getAllByText('\u00d7') // ×
    // The first × is the field remove, tags have their own ×
    // Find the tag remove buttons (inside frontmatter-tag-remove class)
    const tagRemoveButtons = removeButtons.filter(
      btn => btn.classList.contains('frontmatter-tag-remove')
    )
    // Remove the second tag
    await userEvent.click(tagRemoveButtons[1])
    expect(onChange).toHaveBeenCalledWith({ tags: ['keep'] })
  })
})
