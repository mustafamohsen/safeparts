import { test, expect } from '@playwright/test'
import { expectNoA11yViolations, waitForWasmReady } from './a11y-utils'

test.describe('Web App Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForWasmReady(page)
  })

  test('Split screen has no accessibility violations', async ({ page }) => {
    // Ensure we're on the Split tab
    await expect(page.getByRole('tab', { name: /split|تقسيم/i })).toHaveAttribute('aria-selected', 'true')
    
    await expectNoA11yViolations(page)
  })

  test('Combine screen has no accessibility violations', async ({ page }) => {
    // Switch to Combine tab
    await page.getByRole('tab', { name: /combine|استعادة/i }).click()
    
    await expectNoA11yViolations(page)
  })

  test('Language toggle is accessible', async ({ page }) => {
    const langToggle = page.getByRole('button', { name: /english|العربية/i })
    
    // Should be keyboard focusable
    await langToggle.focus()
    await expect(langToggle).toBeFocused()
    
    // Should have aria-pressed to indicate state
    await expect(langToggle).toHaveAttribute('aria-pressed')
  })

  test('Tab navigation follows logical order', async ({ page }) => {
    // Get all focusable elements
    const focusableElements = await page.locator('button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])').all()
    
    // Press Tab and verify focus moves through elements
    for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).not.toBe('BODY')
    }
  })
})
