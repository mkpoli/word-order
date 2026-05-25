import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Svelte 5 + vitePreprocess handles <script lang="ts"> natively; no
	// svelte-preprocess needed.
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			$i18n: 'src/i18n',
			$lib: 'src/lib'
		}
	}
};

export default config;
