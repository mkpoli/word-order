import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: ['node_modules/**', 'build/**', '.svelte-kit/**', '.vercel/**', 'package/**', 'src/lib/paraglide/**', 'static/**', 'bun.lockb']
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		rules: {
			'no-useless-assignment': 'off',
			'no-useless-escape': 'off',
			'no-fallthrough': 'off',
			'svelte/require-each-key': 'off',
			'svelte/no-at-html-tags': 'off',
			'svelte/require-event-dispatcher-types': 'off',
			'svelte/infinite-reactive-loop': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
		}
	}
];
