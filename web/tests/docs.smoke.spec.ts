import { test } from '@playwright/test'
import { expectNoA11yViolations } from './a11y-utils'

const SMOKE_ROUTES = ['/help/', '/help/use-cases/', '/help/ar/', '/help/ar/use-cases/']

test.describe('Docs Accessibility Smoke @smoke', () => {
  for (const route of SMOKE_ROUTES) {
    test(`No accessibility violations: ${route}`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await expectNoA11yViolations(page)
    })
  }
})
