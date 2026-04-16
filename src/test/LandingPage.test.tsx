import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

import LandingPage from '@/components/LandingPage'
import { signIn } from 'next-auth/react'

describe('LandingPage', () => {
  it('renders the title and subtitle', () => {
    render(<LandingPage />)
    expect(screen.getByText('Markdown Editor')).toBeInTheDocument()
    expect(screen.getByText(/zero syntax reveal/)).toBeInTheDocument()
  })

  it('renders the sign-in button', () => {
    render(<LandingPage />)
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  it('calls signIn with google when button is clicked', async () => {
    render(<LandingPage />)
    await userEvent.click(screen.getByText('Sign in with Google'))
    expect(signIn).toHaveBeenCalledWith('google')
  })
})
