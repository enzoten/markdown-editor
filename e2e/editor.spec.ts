import { test, expect } from '@playwright/test'

// These tests require authentication. In CI, use a test account or
// mock the auth session. For local testing, sign in manually first
// and reuse the browser state.
//
// To set up authenticated tests:
// 1. Run: npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:3000
// 2. Sign in with Google in the browser that opens
// 3. Close the browser — the session is saved to e2e/.auth/user.json

test.describe('Editor (authenticated)', () => {
  // Skip if no auth state file exists
  test.skip(
    () => {
      try {
        require('fs').accessSync('e2e/.auth/user.json')
        return false
      } catch {
        return true
      }
    },
    'Skipped: no auth state. Run `npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:3000` and sign in first.',
  )

  test.use({ storageState: 'e2e/.auth/user.json' })

  test('shows document list when authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Documents')).toBeVisible()
    await expect(page.getByText('Sign out')).toBeVisible()
  })

  test('can create a new document', async ({ page }) => {
    await page.goto('/')
    await page.getByTitle('New document').click()
    // Should show the editor with toolbar
    await expect(page.locator('[role="toolbar"]')).toBeVisible()
  })

  test('can type in the editor', async ({ page }) => {
    await page.goto('/')
    await page.getByTitle('New document').click()
    await expect(page.locator('[role="toolbar"]')).toBeVisible()

    // Click into the editor content area and type
    const editor = page.locator('.editor-content .tiptap')
    await editor.click()
    await editor.pressSequentially('Hello, Playwright!')
    await expect(editor).toContainText('Hello, Playwright!')
  })

  test('toolbar formatting buttons work', async ({ page }) => {
    await page.goto('/')
    await page.getByTitle('New document').click()

    const editor = page.locator('.editor-content .tiptap')
    await editor.click()
    await editor.pressSequentially('Bold text')

    // Select all text and apply bold
    await page.keyboard.press('Control+a')
    await page.getByLabel('Bold (Cmd+B)').click()

    // Check that bold is active
    await expect(page.getByLabel('Bold (Cmd+B)')).toHaveAttribute('aria-pressed', 'true')
  })

  test('toolbar keyboard navigation works', async ({ page }) => {
    await page.goto('/')
    await page.getByTitle('New document').click()
    await expect(page.locator('[role="toolbar"]')).toBeVisible()

    // Focus the block type selector
    const toolbar = page.locator('[role="toolbar"]')
    const select = toolbar.locator('select')
    await select.focus()

    // Arrow right should move to the next button
    await page.keyboard.press('ArrowRight')
    const focused = toolbar.locator(':focus')
    await expect(focused).toHaveAttribute('aria-label', 'Bold (Cmd+B)')
  })

  test('document outline sidebar works', async ({ page }) => {
    await page.goto('/')
    await page.getByTitle('New document').click()

    const editor = page.locator('.editor-content .tiptap')
    await editor.click()

    // Type a heading using keyboard shortcut
    await page.keyboard.press('Control+1')
    await editor.pressSequentially('My Heading')

    // The outline should show the heading
    await expect(page.locator('.outline-sidebar')).toContainText('My Heading')
  })

  test('file tree shows created document', async ({ page }) => {
    await page.goto('/')

    // Create a new doc
    await page.getByTitle('New document').click()
    await expect(page.locator('[role="toolbar"]')).toBeVisible()

    // The file tree should list the new "Untitled" document
    await expect(page.locator('.filetree-sidebar')).toContainText('Untitled')
  })

  test('find and replace opens with Cmd+F', async ({ page }) => {
    await page.goto('/')
    await page.getByTitle('New document').click()

    const editor = page.locator('.editor-content .tiptap')
    await editor.click()
    await editor.pressSequentially('Search for this text')

    await page.keyboard.press('Control+f')
    await expect(page.locator('.find-replace')).toBeVisible()
    await expect(page.getByPlaceholder('Find...')).toBeFocused()
  })
})
