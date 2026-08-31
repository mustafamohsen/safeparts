import { expect, test, type Page } from '@playwright/test'

const desktopUrl = process.env.DESKTOP_BASE_URL ?? 'http://127.0.0.1:1420'
const splitPanel = (page: Page) => page.locator('#split-panel')
const combinePanel = (page: Page) => page.locator('#combine-panel')

async function installDelayedTauriSplit(page: Page) {
  await page.addInitScript(() => {
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

        await new Promise<void>((resolve) => {
          resolvePending = resolve
        })

        return {
          shares: [
            'synthetic-recovery-share-1',
            'synthetic-recovery-share-2',
            'synthetic-recovery-share-3',
          ],
          threshold: 2,
          shareCount: 3,
          encoding: 'mnemo-words',
          passphraseProtected: true,
        }
      },
    }
  })
}

async function installDelayedTauriCombine(page: Page) {
  await page.addInitScript(() => {
    type TauriMockWindow = Window & {
      __TAURI_INTERNALS__: {
        invoke: (command: string) => Promise<unknown>
      }
      resolveSyntheticCombine: () => void
    }

    const mockWindow = window as TauriMockWindow
    let resolvePending: (() => void) | undefined
    mockWindow.resolveSyntheticCombine = () => resolvePending?.()
    mockWindow.__TAURI_INTERNALS__ = {
      invoke: async (command: string) => {
        if (command !== 'combine_shares_command') {
          throw new Error(`Unexpected synthetic Tauri command: ${command}`)
        }

        await new Promise<void>((resolve) => {
          resolvePending = resolve
        })

        return {
          secret: Array.from(new TextEncoder().encode('synthetic-recovered-secret')),
          byteCount: 26,
          isUtf8: true,
          text: 'synthetic-recovered-secret',
          encoding: 'mnemo-words',
          shareCount: 2,
        }
      },
    }
  })
}

test.describe('Tauri Passphrase protection @smoke', () => {
  test('changing the passphrase rejects a pending Split result', async ({ page }) => {
    await installDelayedTauriSplit(page)
    await page.goto(desktopUrl)

    await splitPanel(page).locator('textarea').fill('synthetic-pending-passphrase-secret')
    await splitPanel(page).getByLabel('Passphrase (optional)').fill('synthetic-first-passphrase')
    await splitPanel(page).getByLabel('Confirm passphrase').fill('synthetic-first-passphrase')
    await splitPanel(page).getByRole('button', { name: /^split$/i }).click()
    await expect(splitPanel(page).getByRole('button', { name: /^working…$/i })).toBeVisible()

    await splitPanel(page).getByLabel('Passphrase (optional)').fill('synthetic-changed-passphrase')
    await page.evaluate(() => {
      const mockWindow = window as Window & { resolveSyntheticSplit: () => void }
      mockWindow.resolveSyntheticSplit()
    })

    await expect(splitPanel(page).getByRole('heading', { name: /^shares$/i })).toHaveCount(0)
    await expect(splitPanel(page).getByRole('button', { name: /^copy$/i })).toHaveCount(0)
    await expect(splitPanel(page).getByRole('button', { name: /^split$/i })).toBeDisabled()
  })

  test('changing the confirmation rejects a pending Split result', async ({ page }) => {
    await installDelayedTauriSplit(page)
    await page.goto(desktopUrl)

    await splitPanel(page).locator('textarea').fill('synthetic-pending-confirmation-secret')
    await splitPanel(page).getByLabel('Passphrase (optional)').fill('synthetic-confirmed-passphrase')
    await splitPanel(page).getByLabel('Confirm passphrase').fill('synthetic-confirmed-passphrase')
    await splitPanel(page).getByRole('button', { name: /^split$/i }).click()
    await expect(splitPanel(page).getByRole('button', { name: /^working…$/i })).toBeVisible()

    await splitPanel(page).getByLabel('Confirm passphrase').fill('synthetic-changed-confirmation')
    await page.evaluate(() => {
      const mockWindow = window as Window & { resolveSyntheticSplit: () => void }
      mockWindow.resolveSyntheticSplit()
    })

    await expect(splitPanel(page).getByRole('heading', { name: /^shares$/i })).toHaveCount(0)
    await expect(splitPanel(page).getByRole('button', { name: /^copy$/i })).toHaveCount(0)
    await expect(splitPanel(page).getByRole('button', { name: /^split$/i })).toBeDisabled()
  })

  test('changing the Recover passphrase rejects a pending result', async ({ page }) => {
    await installDelayedTauriCombine(page)
    await page.goto(desktopUrl)
    await page.getByRole('tab', { name: /^combine$/i }).click()

    await combinePanel(page).locator('textarea').first().fill('synthetic-recovery-share')
    await combinePanel(page).getByLabel('Passphrase (optional)').fill('synthetic-first-passphrase')
    await combinePanel(page).getByRole('button', { name: /^combine$/i }).click()
    await expect(combinePanel(page).getByRole('button', { name: /^working…$/i })).toBeVisible()

    await combinePanel(page).getByLabel('Passphrase (optional)').fill('synthetic-changed-passphrase')
    await page.evaluate(() => {
      const mockWindow = window as Window & { resolveSyntheticCombine: () => void }
      mockWindow.resolveSyntheticCombine()
    })

    await expect(combinePanel(page).getByRole('heading', { name: /^recovered secret$/i })).toHaveCount(0)
    await expect(combinePanel(page).getByRole('button', { name: /^copy$/i })).toHaveCount(0)
    await expect(combinePanel(page).getByRole('button', { name: /^combine$/i })).toBeEnabled()
  })
})
