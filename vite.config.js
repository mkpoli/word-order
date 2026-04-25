import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['globalVariable', 'baseLocale'],
			emitTsDeclarations: true,
			isServer: 'import.meta.env.SSR'
		})
	]
};

export default config;
