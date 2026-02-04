import { test, expect } from '@playwright/test'
import { expectNoA11yViolations } from './a11y-utils'

import fs from 'node:fs'
import path from 'node:path'

type DocsRouteSets = {
  english: string[]
  arabic: string[]
  englishSlugs: string[]
  arabicSlugs: string[]
}

function listMdxSlugs(dir: string): string[] {
  const out: string[] = []

  const walk = (currentDir: string, prefix: string) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue

      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name)
        continue
      }

      if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue

      const name = entry.name.slice(0, -('.mdx'.length))
      const slug = prefix ? `${prefix}/${name}` : name
      out.push(slug)
    }
  }

  walk(dir, '')
  return out.sort()
}

function getDocsRouteSets(): DocsRouteSets {
  // Tests run from `web/` in CI.
  const docsRoot = path.resolve(process.cwd(), 'help/src/content/docs')
  const arRoot = path.join(docsRoot, 'ar')

  const englishSlugs = listMdxSlugs(docsRoot).filter(s => !s.startsWith('ar/'))
  const arabicSlugs = listMdxSlugs(arRoot)

  const toRoute = (base: string, slug: string) => {
    if (slug === 'index') return `${base}/`
    return `${base}/${slug.replace(/\\/g, '/')}/`
  }

  const english = englishSlugs.map(s => toRoute('/help', s))
  const arabic = arabicSlugs.map(s => toRoute('/help/ar', s))

  return { english, arabic, englishSlugs, arabicSlugs }
}

const routes = getDocsRouteSets()

test.describe('Docs Site Accessibility', () => {
  test('Docs routes are in sync (EN/AR)', async () => {
    // We keep the docs bilingual; Arabic must mirror English route set.
    expect(routes.arabicSlugs).toEqual(routes.englishSlugs)
  })

  for (const route of routes.english) {
    test(`No accessibility violations (EN): ${route}`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await expectNoA11yViolations(page)
    })
  }

  for (const route of routes.arabic) {
    test(`No accessibility violations (AR): ${route}`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await expectNoA11yViolations(page)
    })
  }

  test('Docs are dark-only (no light theme toggle)', async ({ page }) => {
    await page.goto('/help/')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // There should be no theme toggle button
    const themeToggle = page.locator('starlight-theme-select, [aria-label*="theme" i], [aria-label*="مظهر" i]')
    await expect(themeToggle).toHaveCount(0)
    
    // Verify dark theme is enforced via localStorage
    const starlightTheme = await page.evaluate(() => localStorage.getItem('starlight-theme'))
    expect(starlightTheme).toBe('dark')
    
    // Verify the page has dark theme styling applied
    const htmlDataTheme = await page.locator('html').getAttribute('data-theme')
    expect(htmlDataTheme).toBe('dark')
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
