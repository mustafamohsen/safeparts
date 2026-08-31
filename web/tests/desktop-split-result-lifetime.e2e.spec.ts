import { expect, test, type Page } from '@playwright/test'

const desktopUrl = 'http://localhost:1420'
const splitPanel = (page: Page) => page.locator('#split-panel')
const recoverySharesHeading = (page: Page) =>
  splitPanel(page).getByRole('heading', { name: /^(recovery shares|حصص الاسترداد)$/i })

async function installTauriSplitMock(page: Page, delayed: boolean) {
  await page.addInitScript(({ shouldDelay }) => {
    type TauriMockWindow = Window & {
      __TAURI_INTERNALS__: {
        invoke: (command: string) => Promise<unknown>
      }
      resolveSyntheticSplit: () => void
    }

    const mockWindow = window as TauriMockWindow
    let resolvePending: (() => void) | undefined
    mockWindow.resolveSyntheticSplit = () => resolvePending?.()
    mockWindow.__TAURI_INTERNALS__ = {
      invoke: async (command: string) => {
        if (command !== 'split_secret_command') {
          throw new Error(`Unexpected synthetic Tauri command: ${command}`)
        }

        if (shouldDelay) {
          await new Promise<void>((resolve) => {
            resolvePending = resolve
          })
        }

        return {
          shares: ['synthetic-recovery-share-1', 'synthetic-recovery-share-2', 'synthetic-recovery-share-3'],
          threshold: 2,
          shareCount: 3,
          encoding: 'mnemo-words',
          passphraseProtected: false,
        }
      },
    }
  }, { shouldDelay: delayed })
}

async function generateRecoveryShares(page: Page) {
  await splitPanel(page).locator('textarea').fill('synthetic-desktop-lifetime-secret')
  await splitPanel(page).getByRole('button', { name: /^split$/i }).click()
  await expect(recoverySharesHeading(page)).toBeVisible()
}

async function expectRecoverySharesInvalidated(page: Page) {
  await expect(recoverySharesHeading(page)).toHaveCount(0)
  await expect(
    splitPanel(page).getByRole('button', { name: /^copy recovery share \d+$/i }),
  ).toHaveCount(0)
  await expect(splitPanel(page).getByRole('status')).toHaveCount(0)
}

test.describe('Tauri Split result lifetime @smoke', () => {
  test('changing each Split input removes the rendered desktop result', async ({ page }) => {
    await installTauriSplitMock(page, false)
    await page.goto(desktopUrl)

    const cases: Array<{ name: string; change: () => Promise<void> }> = [
      {
        name: 'Secret',
        change: () => splitPanel(page).locator('textarea').fill('changed-synthetic-desktop-secret'),
      },
      {
        name: 'Threshold',
        change: () => splitPanel(page).locator('#split-k').fill('3'),
      },
      {
        name: 'Share count',
        change: () => splitPanel(page).locator('#split-n').fill('4'),
      },
      {
        name: 'Share encoding',
        change: () => splitPanel(page).getByText('Letters', { exact: true }).click(),
      },
      {
        name: 'Passphrase protection',
        change: () => splitPanel(page).locator('#split-passphrase').fill('synthetic-passphrase'),
      },
    ]

    for (const dependency of cases) {
      await test.step(dependency.name, async () => {
        await generateRecoveryShares(page)
        await expect(splitPanel(page).getByRole('status')).toHaveText('3 Recovery shares ready.')
        await dependency.change()
        await expectRecoverySharesInvalidated(page)
      })
    }
  })

  test('input changed during a pending Tauri Split rejects the late result', async ({ page }) => {
    await installTauriSplitMock(page, true)
    await page.goto(desktopUrl)
    await splitPanel(page).locator('textarea').fill('synthetic-pending-desktop-secret')
    await splitPanel(page).getByRole('button', { name: /^split$/i }).click()
    await expect(splitPanel(page).getByRole('button', { name: /^working…$/i })).toBeVisible()

    await splitPanel(page).locator('textarea').fill('changed-while-tauri-split-pending')
    await page.evaluate(() => {
      const mockWindow = window as Window & { resolveSyntheticSplit: () => void }
      mockWindow.resolveSyntheticSplit()
    })
    await page.waitForTimeout(100)

    await expectRecoverySharesInvalidated(page)
    await expect(splitPanel(page).getByRole('button', { name: /^split$/i })).toBeEnabled()
  })
})
