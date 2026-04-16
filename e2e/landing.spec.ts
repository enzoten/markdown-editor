import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('shows sign-in button when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Markdown Editor')).toBeVisible()
    await expect(page.getByText('Sign in with Google')).toBeVisible()
  })

  test('has correct page title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Markdown Editor')
  })

  test('sign-in button triggers OAuth flow', async ({ page }) => {
    await page.goto('/')
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.getByText('Sign in with Google').click(),
    ])
    // Should navigate to Google OAuth or the NextAuth sign-in page
    if (popup) {
      expect(popup.url()).toContain('accounts.google.com')
    } else {
      // If no popup, the page itself navigated
      await page.waitForURL(/auth|google/, { timeout: 5000 }).catch(() => {})
      const url = page.url()
      expect(url.includes('auth') || url.includes('google') || url.includes('signin')).toBeTruthy()
    }
  })
})
