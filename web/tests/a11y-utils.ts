import { Page, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility test utilities using axe-core.
 * 
 * WCAG 2.2 AA compliance requires 0 serious and 0 critical violations.
 */

export interface A11yResult {
  violations: Array<{
    id: string
    impact: 'minor' | 'moderate' | 'serious' | 'critical'
    description: string
    help: string
    helpUrl: string
    nodes: Array<{
      html: string
      target: string[]
      failureSummary: string
    }>
  }>
}

/**
 * Run axe accessibility scan on a page.
 * Fails the test if serious or critical violations are found.
 */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()

  const seriousAndCritical = accessibilityScanResults.violations.filter(
    v => v.impact === 'serious' || v.impact === 'critical'
  )

  // Log all violations for debugging
  if (accessibilityScanResults.violations.length > 0) {
    console.log('Accessibility violations found:')
    for (const violation of accessibilityScanResults.violations) {
      console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`)
      for (const node of violation.nodes.slice(0, 3)) {
        console.log(`    - ${node.target.join(', ')}`)
      }
    }
  }

  // Assert no serious or critical violations
  expect(
    seriousAndCritical,
    `Found ${seriousAndCritical.length} serious/critical accessibility violations`
  ).toHaveLength(0)

  // Also assert no violations at all (ideal state)
  expect(
    accessibilityScanResults.violations,
    `Found ${accessibilityScanResults.violations.length} total accessibility violations`
  ).toHaveLength(0)
}

/**
 * Wait for the WASM module to be ready.
 * The web app shows a loading state until WASM is initialized.
 */
export async function waitForWasmReady(page: Page): Promise<void> {
  // Wait for the WASM initialization to complete
  // The app shows a hint when WASM is not ready
  await page.waitForFunction(() => {
    const wasmHint = document.querySelector('[data-testid="wasm-hint"]')
    return !wasmHint || wasmHint.classList.contains('hidden')
  }, { timeout: 30000 })
}
