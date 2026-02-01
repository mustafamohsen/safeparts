## 0. Branch and Setup

- [x] 0.1 Create new branch: `git checkout -b feat/getting-started-guide`
- [x] 0.2 Verify branch is clean and matches main before starting

## 1. Create English Guide Content

- [x] 1.1 Create web/help/src/content/docs/getting-started.mdx with structure
- [x] 1.2 Write "Why Secret Sharing?" section with ASCII diagrams
- [x] 1.3 Write k-of-n Mental Model section with vault analogy and table
- [x] 1.4 Write Tool Selection section with decision tree and comparison tables
- [x] 1.5 Write Quick Start section with Web UI and CLI examples
- [x] 1.6 Write Examples section with 12+ real-world scenarios (personal, family, team, enterprise, high-risk)
- [x] 1.7 Write Best Practices section (DO and DON'T)
- [x] 1.8 Write Common Mistakes section with table
- [x] 1.9 Write Next Steps section with links to other docs

## 2. Create Arabic Guide Content

- [x] 2.1 Create web/help/src/content/docs/ar/getting-started.mdx
- [x] 2.2 Translate all sections to Arabic with proper technical terminology
- [x] 2.3 Ensure RTL layout works correctly
- [x] 2.4 Verify all tabs and formatting match English version

## 3. Update Configuration Files

- [x] 3.1 Update web/help/astro.config.mjs sidebar to link getting-started instead of use-cases
- [x] 3.2 Update web/help/src/content/docs/index.mdx link to point to getting-started

## 4. Remove Old Files

- [x] 4.1 Delete web/help/src/content/docs/use-cases.mdx
- [x] 4.2 Delete web/help/src/content/docs/ar/use-cases.mdx

## 5. Verify and Test

- [x] 5.1 Run `cd web/help && bun install && bun run build` to verify build succeeds
- [x] 5.2 Check generated HTML files exist for getting-started (English and Arabic)
- [x] 5.3 Verify all internal links work correctly
- [x] 5.4 Test bilingual tab switching functionality
- [x] 5.5 Review content for accuracy and completeness against spec requirements

## 6. Commit and Push

- [ ] 6.1 Stage all changes: `git add -A`
- [ ] 6.2 Commit with descriptive message: `git commit -m "feat(docs): add comprehensive getting started guide"`
- [ ] 6.3 Push branch: `git push -u origin feat/getting-started-guide`
- [ ] 6.4 Create PR at: https://github.com/mustafamohsen/safeparts/pull/new/feat/getting-started-guide
