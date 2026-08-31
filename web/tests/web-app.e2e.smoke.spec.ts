import { expect, test, type Page } from '@playwright/test'

import { waitForWasmReady } from './a11y-utils'

async function instrumentClipboard(page: Page, shouldFail = false): Promise<void> {
  await page.evaluate((failWrites) => {
    const writes: string[] = []
    Object.defineProperty(window, '__clipboardWrites', {
      configurable: true,
      value: writes,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          if (failWrites) throw new Error('synthetic clipboard failure')
          writes.push(text)
        },
      },
    })
  }, shouldFail)
}

async function clipboardWrites(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    return (window as Window & { __clipboardWrites?: string[] }).__clipboardWrites ?? []
  })
}

type BrowserWasmModule = {
  default?: () => Promise<unknown>
  split_secret: (
    secret: Uint8Array,
    threshold: number,
    shareCount: number,
    encoding: string,
  ) => Iterable<string>
}

async function splitSyntheticBytes(
  page: Page,
  secret: number[],
  encoding = 'base64url',
): Promise<string[]> {
  return page.evaluate(
    async ({ bytes, shareEncoding }) => {
      const dynamicImport = new Function('path', 'return import(path)') as (
        path: string,
      ) => Promise<BrowserWasmModule>
      const wasm = await dynamicImport('/src/wasm_pkg/safeparts_wasm.js')
      if (typeof wasm.default === 'function') await wasm.default()
      return Array.from(
        wasm.split_secret(new Uint8Array(bytes), 2, 3, shareEncoding),
      )
    },
    { bytes: secret, shareEncoding: encoding },
  )
}

async function splitAndCollectShares(
  page: Page,
  secret: string,
  options?: { passphrase?: string },
): Promise<string[]> {
  await page.getByRole('tab', { name: /split|تقسيم/i }).click()
  await page.locator('#split-panel textarea').first().fill(secret)

  if (options?.passphrase) {
    await page
      .locator('#split-panel input[aria-labelledby="passphrase-label"]')
      .fill(options.passphrase)
  }

  await page.getByRole('button', { name: /^(split|قسم)$/i }).click()
  await expect(page.getByRole('heading', { name: /shares|الحصص/i })).toBeVisible()

  const shareValues = await page.locator('#split-panel div[dir="ltr"].input .sr-only').allTextContents()
  return shareValues.map((share) => share.trim()).filter(Boolean)
}

async function recoverShares(
  page: Page,
  shares: string[],
  encoding: 'base64url' | 'mnemo-words' = 'mnemo-words',
): Promise<void> {
  await page.getByRole('tab', { name: /combine|استعادة/i }).click()
  await page
    .locator('#combine-panel label')
    .filter({
      hasText: encoding === 'base64url' ? /Letters|أحرف/i : /Words|كلمات/i,
    })
    .click()

  const shareFields = page.locator('#combine-panel textarea')
  await shareFields.nth(0).fill(shares[0] ?? '')
  await shareFields.nth(1).fill(shares[1] ?? '')
  await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
}

function recoveredSecret(page: Page) {
  return page.locator('#combine-panel div[dir="auto"].input .sr-only')
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
    expect(recovered?.trim() ?? '').toBe(secret)
  })

  test('preserves valid Unicode and embedded NUL text exactly', async ({ page }) => {
    const secret = 'Safeparts العربية עברית 🌍\u0000after-nul'
    const shares = await splitAndCollectShares(page, secret)

    await recoverShares(page, shares)

    await expect(page.getByRole('heading', { name: /recovered secret/i })).toBeVisible()
    await expect(recoveredSecret(page)).toHaveText(secret)

    const liveStatus = page.locator('[aria-live="polite"]')
    await expect(liveStatus).toContainText('Secret recovered.')
    await expect(liveStatus).not.toContainText(secret)
  })

  test('preserves every valid UTF-8 character in recovered output and shortcut copy', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const secret = '\uFEFF \tSafeparts العربية עברית 🌍\u0000after-nul \n'
    const shares = await splitSyntheticBytes(
      page,
      Array.from(new TextEncoder().encode(secret)),
    )

    await recoverShares(page, shares, 'base64url')

    await expect(page.getByRole('heading', { name: /recovered secret/i })).toBeVisible()
    expect(await recoveredSecret(page).textContent()).toBe(secret)

    await page.evaluate(() => navigator.clipboard.writeText('clipboard-sentinel'))
    await page.keyboard.press('Control+Shift+C')
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(secret)
  })

  test('removes recovered output and copy source when recovery inputs change', async ({ page }) => {
    const shares = await splitAndCollectShares(page, 'stale-recovery-output')
    const recoveredHeading = page.getByRole('heading', { name: /recovered secret/i })
    const copyButton = page.locator('#combine-panel').getByRole('button', { name: /^Copy$/ })

    await recoverShares(page, shares)
    await expect(recoveredHeading).toBeVisible()
    await expect(copyButton).toBeVisible()

    const shareFields = page.locator('#combine-panel textarea')
    await shareFields.nth(0).fill(`${shares[0]} changed`)
    await expect(recoveredHeading).toHaveCount(0)
    await expect(copyButton).toHaveCount(0)

    await shareFields.nth(0).fill(shares[0] ?? '')
    await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
    await expect(recoveredHeading).toBeVisible()
    await page.getByRole('button', { name: /add share/i }).click()
    await expect(recoveredHeading).toHaveCount(0)

    await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
    await expect(recoveredHeading).toBeVisible()
    await page.locator('#combine-panel input[aria-labelledby="passphrase-label"]').fill('changed')
    await expect(recoveredHeading).toHaveCount(0)

    await page.locator('#combine-panel input[aria-labelledby="passphrase-label"]').fill('')
    await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
    await expect(recoveredHeading).toBeVisible()
    await page
      .locator('#combine-panel label')
      .filter({ hasText: /Letters/i })
      .click()
    await expect(recoveredHeading).toHaveCount(0)
    await expect(copyButton).toHaveCount(0)
  })

  test('discards recovery that finishes after a Recovery share changes', async ({ page }) => {
    const shares = await splitSyntheticBytes(
      page,
      Array.from(new TextEncoder().encode('pending-recovery-result')),
    )
    let releaseWasm: (() => void) | undefined
    const wasmGate = new Promise<void>((resolve) => {
      releaseWasm = resolve
    })

    await page.route('**/safeparts_wasm_bg.wasm*', async (route) => {
      await wasmGate
      await route.continue()
    })

    try {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('tab', { name: /combine|استعادة/i }).click()
      await page
        .locator('#combine-panel label')
        .filter({ hasText: /Letters/i })
        .click()
      const shareFields = page.locator('#combine-panel textarea')
      await shareFields.nth(0).fill(shares[0] ?? '')
      await shareFields.nth(1).fill(shares[1] ?? '')
      await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
      await expect(page.getByRole('button', { name: /Working/i })).toBeVisible()

      await shareFields.nth(0).fill(`${shares[0]} changed`)
      releaseWasm?.()

      await expect(page.getByRole('button', { name: /^Combine$/i })).toBeEnabled()
      await expect(page.getByRole('heading', { name: /recovered secret/i })).toHaveCount(0)
      await expect(
        page.locator('#combine-panel').getByRole('button', { name: /^Copy$/ }),
      ).toHaveCount(0)
    } finally {
      releaseWasm?.()
      await page.unroute('**/safeparts_wasm_bg.wasm*')
    }
  })

  test('refuses invalid UTF-8 without changing the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.evaluate(() => navigator.clipboard.writeText('clipboard-sentinel'))
    const shares = await splitSyntheticBytes(page, [0xff, 0xfe, 0x41])

    await recoverShares(page, shares, 'base64url')

    await expect(page.locator('#combine-panel .alert-error')).toContainText(
      'This recovered Secret is not valid UTF-8 text. Use the CLI, TUI, or a native file workflow to recover the exact bytes.',
    )
    await expect(page.getByRole('heading', { name: /recovered secret/i })).toHaveCount(0)
    await expect(
      page.locator('#combine-panel').getByRole('button', { name: /^Copy$/ }),
    ).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(
      'clipboard-sentinel',
    )
  })

  test('localizes invalid UTF-8 guidance in Arabic', async ({ page }) => {
    const shares = await splitSyntheticBytes(page, [0x80, 0x41])
    await page.getByRole('button', { name: 'العربية' }).click()

    await recoverShares(page, shares, 'base64url')

    await expect(page.locator('#combine-panel .alert-error')).toContainText(
      'السر المستعاد ليس نصًا صالحًا بترميز UTF-8. استخدم CLI أو TUI أو سير عمل ملفات أصليًا لاستعادة البايتات بدقة.',
    )
    await expect(page.getByRole('heading', { name: /السر المستعاد/i })).toHaveCount(0)
  })

  test('shows useful validation when shares are insufficient', async ({ page }) => {
    const shares = await splitAndCollectShares(page, 'smoke-insufficient-shares')

    await page.getByRole('tab', { name: /combine|استعادة/i }).click()
    const shareFields = page.locator('#combine-panel textarea')
    await shareFields.nth(0).fill(shares[0] ?? '')
    await shareFields.nth(1).fill('')

    await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
    await expect(page.locator('#combine-panel .alert-error')).toContainText(/add 1 more share to recover this secret/i)
    await expect(page.locator('#combine-panel textarea[aria-invalid="true"]')).toHaveCount(1)
  })

  test('arabic combine share placeholder stays rtl while input stays ltr', async ({ page }) => {
    await page.getByRole('button', { name: 'العربية' }).click()
    await page.getByRole('tab', { name: /combine|استعادة/i }).click()

    const shareField = page.locator('#combine-panel textarea').first()
    const placeholder = page.locator('#combine-panel [aria-hidden="true"]').filter({ hasText: 'الصق الحصة هنا…' }).first()

    await expect(placeholder).toBeVisible()
    await expect(placeholder).toHaveAttribute('dir', 'rtl')
    await expect(shareField).toHaveAttribute('dir', 'ltr')

    const padding = await shareField.evaluate((node) => {
      const styles = window.getComputedStyle(node)
      return {
        left: styles.paddingLeft,
        right: styles.paddingRight,
      }
    })

    expect(padding).toEqual({ left: '12px', right: '48px' })
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

  test('Split renders the custody rule in English and Arabic', async ({ page }) => {
    await splitAndCollectShares(page, 'synthetic-custody-guidance-secret')
    await expect(page.locator('#split-panel')).toContainText(
      'Keep fewer Recovery shares than the Threshold in every account, device, location, administrator domain, and transport channel.',
    )

    await page.getByRole('button', { name: 'العربية' }).click()
    await expect(page.locator('#split-panel')).toContainText(
      'احتفظ بعدد من حصص الاسترداد أقل من العتبة في كل حساب وجهاز وموقع ونطاق إدارة وقناة نقل.',
    )
  })

  test('Split copies one Recovery share at a time and has no global copy-result action', async ({ page }) => {
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
    await instrumentClipboard(page)

    const shares = await splitAndCollectShares(page, 'synthetic-individual-copy-secret')
    await page.keyboard.press(`${mod}+Shift+C`)
    expect(await clipboardWrites(page)).toEqual([])

    await page
      .locator('#split-panel')
      .getByRole('button', { name: 'Copy Recovery share 1' })
      .click()
    await expect.poll(() => clipboardWrites(page)).toEqual([shares[0]])
  })

  test('Combine copy-result shortcut writes the stable recovered Secret', async ({ page }) => {
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
    await instrumentClipboard(page)

    const secret = 'synthetic-shortcut-recovered-secret'
    const shares = await splitAndCollectShares(page, secret)
    await page.getByRole('tab', { name: /combine|استعادة/i }).click()
    const shareFields = page.locator('#combine-panel textarea')
    await shareFields.nth(0).fill(shares[0] ?? '')
    await shareFields.nth(1).fill(shares[1] ?? '')
    await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
    await expect(page.getByRole('heading', { name: /recovered secret|السر المستعاد/i })).toBeVisible()

    await page.keyboard.press(`${mod}+Shift+C`)
    await expect.poll(() => clipboardWrites(page)).toEqual([secret])
  })

  test('clipboard failures surface a consistent non-sensitive error', async ({ page }) => {
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
    await instrumentClipboard(page, true)
    const shares = await splitAndCollectShares(page, 'synthetic-clipboard-failure-secret')

    const errorRegion = page.locator('[aria-live="assertive"]')
    await page
      .locator('#split-panel')
      .getByRole('button', { name: 'Copy Recovery share 1' })
      .click()
    await expect(errorRegion).toContainText('Could not copy to the clipboard.')
    await expect(errorRegion).not.toContainText('synthetic-clipboard-failure-secret')
    await expect(errorRegion).toBeEmpty({ timeout: 2_000 })

    await page.getByRole('tab', { name: /combine|استعادة/i }).click()
    const shareFields = page.locator('#combine-panel textarea')
    await shareFields.nth(0).fill(shares[0] ?? '')
    await shareFields.nth(1).fill(shares[1] ?? '')
    await page.getByRole('button', { name: /^(combine|استعادة)$/i }).click()
    await expect(page.getByRole('heading', { name: /recovered secret|السر المستعاد/i })).toBeVisible()

    await page.keyboard.press(`${mod}+Shift+C`)
    await expect(errorRegion).toContainText('Could not copy to the clipboard.')
    await expect(errorRegion).not.toContainText('synthetic-clipboard-failure-secret')
  })

  test('keyboard shortcuts work for tab switch, help dialog, and submit', async ({ page }) => {
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control'

    await page.keyboard.press('2')
    await expect(page.getByRole('tab', { name: /combine|استعادة/i })).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press(`${mod}+/`)
    const helpDialog = page.getByRole('dialog', { name: /keyboard shortcuts|اختصارات لوحة المفاتيح/i })
    await expect(helpDialog).toBeVisible()
    await expect(helpDialog).toContainText('Copy recovered Secret (Combine only)')
    await page.keyboard.press('Escape')
    await expect(helpDialog).toHaveCount(0)

    await page.keyboard.press('1')
    await page.locator('#split-panel textarea').first().fill('shortcut-submit-secret')
    await page.keyboard.press(`${mod}+Enter`)
    await expect(page.getByRole('heading', { name: /shares|الحصص/i })).toBeVisible()
  })
})
