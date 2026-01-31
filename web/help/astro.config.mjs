// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	// This Starlight site is deployed under the main web UI at `/help/`.
	base: '/help',
	// Build into the Vite app's dist directory so Netlify can publish both.
	outDir: '../dist/help',
	integrations: [
		starlight({
			title: { en: 'Safeparts Help', ar: 'مساعدة Safeparts' },
			description:
				'Split a secret into shares and recover it with k of n. Guides for Web, CLI, and TUI.',
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				ar: { label: 'العربية', lang: 'ar', dir: 'rtl' },
			},
			logo: {
				src: './src/assets/logo.svg',
				alt: 'Safeparts',
			},
			favicon: '/favicon.svg',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/mustafamohsen/safeparts',
				},
			],
			customCss: ['./src/styles/theme.css'],
			head: [
				{ tag: 'meta', attrs: { name: 'color-scheme', content: 'dark' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{
					tag: 'link',
					attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
				},
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href:
							'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
					},
				},
			],
			sidebar: [
				{
					label: 'Start Here',
					translations: { ar: 'ابدأ هنا' },
					items: [{ slug: 'project' }, { slug: 'use-cases' }],
				},
				{
					label: 'Interfaces',
					translations: { ar: 'الواجهات' },
					items: [{ slug: 'web-ui' }, { slug: 'cli' }, { slug: 'tui' }],
				},
				{
					label: 'Build & Run',
					translations: { ar: 'البناء والتشغيل' },
					items: [{ slug: 'build-and-run' }],
				},
				{
					label: 'Reference',
					translations: { ar: 'مراجع' },
					items: [{ slug: 'encodings' }, { slug: 'troubleshooting' }],
				},
			],
		}),
	],
});
