import { expect, test, type Page } from '@playwright/test'

import { waitForWasmReady } from './a11y-utils'

async function splitAndCollectShares(
  page: Page,
  secret: string,
  opts?: { passphrase?: string },
): Promise<string[]> {
  await page.getByRole('tab', { name: /split|تقسيم/i }).click()
  await page.locator('#split-panel textarea').first().fill(secret)

  if (opts?.passphrase) {
    await page.locator('#split-panel input[aria-labelledby="passphrase-label"]').fill(opts.passphrase)
  }

  await page.getByRole('button', { name: /^(split|قسم)$/i }).click()
  await expect(page.getByRole('heading', { name: /shares|الحصص/i })).toBeVisible()

  const shareValues = await page.locator('#split-panel div[dir="ltr"].input .sr-only').allTextContents()
  return shareValues.map((v) => v.trim()).filter(Boolean)
}

test.describe('Web App E2E Smoke @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForWasmReady(page)
  })

  test('round-trip flow works in the browser', async ({ page }) => {
    const secret = 'smoke-roundtrip-secret-123'
    const shares = await splitAndCollectShares(page, secret)

    expect(shares.length).toBeGreaterThanOrEqual(2)

    await page.getByRole('tab', { name: /combine|استعادة/i }).click()
    const shareFields = page.locator('#combine-panel textarea')
    await shareFields.nth(0).fill(shares[0] ?? '')
    await shareFields.nth(1).fill(shares[1] ?? '')

    await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
    await expect(page.getByRole('heading', { name: /recovered secret|السر المستعاد/i })).toBeVisible()

    const recovered = await page.locator('#combine-panel div[dir="auto"].input .sr-only').textContent()
    expect((recovered ?? '').trim()).toBe(secret)
  })

  test('shows useful validation when shares are insufficient', async ({ page }) => {
    const shares = await splitAndCollectShares(page, 'smoke-insufficient-shares')

    await page.getByRole('tab', { name: /combine|استعادة/i }).click()
    const shareFields = page.locator('#combine-panel textarea')
    await shareFields.nth(0).fill(shares[0] ?? '')
    await shareFields.nth(1).fill('')

    await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
    await expect(page.locator('#combine-panel .alert-error')).toContainText(/need at least k shares/i)
    await expect(page.locator('#combine-panel textarea[aria-invalid="true"]')).toHaveCount(1)
  })

  test('wrong passphrase fails cleanly', async ({ page }) => {
    const shares = await splitAndCollectShares(page, 'smoke-passphrase-secret', { passphrase: 'correct-passphrase' })

    await page.getByRole('tab', { name: /combine|استعادة/i }).click()
    const shareFields = page.locator('#combine-panel textarea')
    await shareFields.nth(0).fill(shares[0] ?? '')
    await shareFields.nth(1).fill(shares[1] ?? '')
    await page.locator('#combine-panel input[aria-labelledby="passphrase-label"]').fill('wrong-passphrase')

    await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
    await expect(page.locator('#combine-panel .alert-error')).toBeVisible()
  })

  test('keyboard shortcuts work for tab switch, help dialog, and submit', async ({ page }) => {
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control'

    await page.keyboard.press('2')
    await expect(page.getByRole('tab', { name: /combine|استعادة/i })).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press(`${mod}+/`)
    await expect(page.getByRole('dialog', { name: /keyboard shortcuts|اختصارات لوحة المفاتيح/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /keyboard shortcuts|اختصارات لوحة المفاتيح/i })).toHaveCount(0)

    await page.keyboard.press('1')
    await page.locator('#split-panel textarea').first().fill('shortcut-submit-secret')
    await page.keyboard.press(`${mod}+Enter`)
    await expect(page.getByRole('heading', { name: /shares|الحصص/i })).toBeVisible()
  })
})
