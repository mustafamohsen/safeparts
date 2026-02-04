import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for accessibility testing.
 * 
 * This config runs accessibility scans using axe-core on:
 * - Web app (Split and Combine screens)
 * - Docs site (English and Arabic locales)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        // Start the Vite dev server for the main web app
        {
          command: 'bun run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        },
        // Start the Starlight dev server for the docs site
        {
          command: 'cd help && bun run dev',
          url: 'http://localhost:4321/help/',
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        },
      ],
})
