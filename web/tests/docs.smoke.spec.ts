import { expect, test } from '@playwright/test'
import { expectNoA11yViolations } from './a11y-utils'

const SMOKE_ROUTES = [
  '/help/',
  '/help/use-cases/',
  '/help/security/',
  '/help/ar/',
  '/help/ar/use-cases/',
  '/help/ar/security/',
]

test.describe('Docs Accessibility Smoke @smoke', () => {
  for (const route of SMOKE_ROUTES) {
    test(`No accessibility violations: ${route}`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await expectNoA11yViolations(page)
    })
  }

  test('English custody guidance covers every storage and transport boundary', async ({ page }) => {
    await page.goto('/help/security/')
    await expect(page.locator('main')).toContainText(
      'Keep fewer Recovery shares than the Threshold in every account, device, location, administrator domain, and transport channel.',
    )
  })

  test('Arabic custody guidance covers every storage and transport boundary', async ({ page }) => {
    await page.goto('/help/ar/security/')
    await expect(page.locator('main')).toContainText(
      'احتفظ بعدد من حصص الاسترداد أقل من العتبة في كل حساب وجهاز وموقع ونطاق إدارة وقناة نقل.',
    )
  })
})
