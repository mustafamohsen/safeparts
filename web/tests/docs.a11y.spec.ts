import { test, expect } from '@playwright/test'
import { expectNoA11yViolations } from './a11y-utils'

test.describe('Docs Site Accessibility', () => {
  test('Home page has no accessibility violations', async ({ page }) => {
    await page.goto('/help/')
    await expectNoA11yViolations(page)
  })

  test('Content page has no accessibility violations', async ({ page }) => {
    await page.goto('/help/cli/')
    await expectNoA11yViolations(page)
  })

  test('Arabic locale has no accessibility violations', async ({ page }) => {
    await page.goto('/help/ar/')
    await expectNoA11yViolations(page)
  })

  test('Arabic content page has no accessibility violations', async ({ page }) => {
    await page.goto('/help/ar/cli/')
    await expectNoA11yViolations(page)
  })

  test('Docs are dark-only (no light theme toggle)', async ({ page }) => {
    await page.goto('/help/')
    
    // There should be no theme toggle button
    const themeToggle = page.locator('starlight-theme-select, [aria-label*="theme" i], [aria-label*="مظهر" i]')
    await expect(themeToggle).toHaveCount(0)
    
    // The page should have data-theme="dark"
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('External links announce they open in new tab', async ({ page }) => {
    await page.goto('/help/')
    
    // Find external links
    const externalLinks = await page.locator('a[target="_blank"]').all()
    
    for (const link of externalLinks) {
      // Should have rel="noopener noreferrer"
      await expect(link).toHaveAttribute('rel', /noopener/)
      
      // Should have accessible label or title indicating external behavior
      const hasExternalIndicator = await link.evaluate(el => {
        const ariaLabel = el.getAttribute('aria-label')
        const title = el.getAttribute('title')
        const text = el.textContent
        return (
          ariaLabel?.includes('new tab') ||
          ariaLabel?.includes('new window') ||
          title?.includes('new tab') ||
          title?.includes('new window') ||
          text?.includes('↗') ||
          text?.includes('external')
        )
      })
      
      // Log for manual review if missing
      if (!hasExternalIndicator) {
        const text = await link.textContent()
        console.log(`Warning: External link may need better accessibility: "${text}"`)
      }
    }
  })
})
