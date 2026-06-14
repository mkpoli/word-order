<script lang="ts">
	import { getAliasedLocale } from '$i18n/alias';
	import { setLocale } from '$i18n/i18n-svelte';
	import type { Locales } from '$i18n/i18n-types';
	import { getLocaleDirection } from '$lib/lang';

	interface Props {
		data: { locale: Locales };
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	let { locale } = data;

	if (typeof window !== 'undefined') {
		const lang = window.localStorage.getItem('locale');

		if (lang) {
			if (lang !== locale) {
				locale = getAliasedLocale(lang);
			}
			window.localStorage.setItem('locale', lang);
		}
		document.documentElement.lang = locale;
		document.documentElement.dir = getLocaleDirection(locale);
	}

	setLocale(locale);
</script>

{@render children?.()}

<style>
	:global {
		:root {
			color-scheme: light;

			--color-accent-light: rgb(73 132 255);
			--color-accent: rgb(44 71 255);
			--color-inactive: rgb(61, 66, 66);
			--color-error: rgb(255 0 50);
			--color-success: rgb(20 130 60);
			--color-danger: rgb(180 40 40);

			--color-bg: #ffffff;
			--color-surface: #ffffff;
			--color-surface-elevated: #ffffff;
			--color-text: #222222;
			--color-text-muted: #555555;
			--color-text-faint: #777777;
			--color-border: #cccccc;
			--color-border-soft: #eeeeee;
			--color-hover: #eeeeee;
			--color-shadow: rgb(0 0 0 / 0.18);
			/* Accent text for dialog headers / link buttons / chips.
			   Light value is a deep blue that reads as accent on white;
			   dark override lifts it so it doesn't disappear against the dark surface. */
			--color-accent-text: rgb(33 56 199);

			accent-color: var(--color-accent);
		}

		:root[data-theme='dark'] {
			color-scheme: dark;

			/* Deeper page bg and lifted surface so panels visibly sit above the page,
			   instead of all three greys living within ~8 brightness units of each other. */
			--color-bg: #0d1117;
			--color-surface: #1c2128;
			--color-surface-elevated: #2a313a;
			--color-text: #e6eaef;
			--color-text-muted: #aab2bc;
			--color-text-faint: #7e8794;
			--color-border: #3a4452;
			--color-border-soft: #262d36;
			--color-hover: #2f3742;
			--color-shadow: rgb(0 0 0 / 0.55);
			/* Inactive button text/border needs to be visible against the
			   dark page bg; lift to a mid-grey instead of the near-black light default. */
			--color-inactive: rgb(170 178 188);
			--color-accent-text: rgb(135 165 255);
			--color-success: rgb(85 200 130);
			--color-danger: rgb(240 110 110);
		}

		@media (prefers-color-scheme: dark) {
			:root:not([data-theme='light']) {
				color-scheme: dark;

				--color-bg: #0d1117;
				--color-surface: #1c2128;
				--color-surface-elevated: #2a313a;
				--color-text: #e6eaef;
				--color-text-muted: #aab2bc;
				--color-text-faint: #7e8794;
				--color-border: #3a4452;
				--color-border-soft: #262d36;
				--color-hover: #2f3742;
				--color-shadow: rgb(0 0 0 / 0.55);
				--color-inactive: rgb(170 178 188);
				--color-accent-text: rgb(135 165 255);
				--color-success: rgb(85 200 130);
				--color-danger: rgb(240 110 110);
			}
		}

		html,
		body {
			background-color: var(--color-bg);
			color: var(--color-text);
			/* Let the browser space CJK against Latin/digits automatically so
			   translations never hand-author spaces between e.g. 导出 and SVG.
			   Progressive enhancement — engines without support ignore it. */
			text-autospace: normal;
			/* Mirrors of border-soft / shadow that descendants can use when they
			   need page-theme values even after they've overridden the palette
			   locally (e.g. the output canvas pins itself to light). */
			--page-border-soft: var(--color-border-soft);
			--page-shadow: var(--color-shadow);
		}

		* {
			box-sizing: border-box;
		}

		fieldset {
			display: flex;
			flex-direction: column;
			gap: 0.4em;

			padding: 1em 1.5em;
			border-radius: 0.5em;
			border: 1px solid var(--color-border-soft);
			box-shadow: 0 1px 3px 0 var(--color-shadow);
			background: var(--color-surface);
		}

		legend {
			/* Use the elevated surface so the legend chip stands away from the
			   fieldset bg even when fieldset and surface share the same tone. */
			background: var(--color-surface-elevated);
			color: var(--color-text);
			padding: 0.2em 0.8em;
			border-radius: 0.3em;
			border: 1px solid var(--color-border-soft);
			box-shadow: 0 1px 3px 0 var(--color-shadow);
			font-weight: bold;
		}

		input[type='text'],
		textarea {
			padding: 0.3em 0.5em;
			border-radius: 0.3em;
			border: 1px solid var(--color-border);
			background: var(--color-surface);
			color: var(--color-text);
		}

		input[type='text']:hover,
		textarea:hover {
			border: 1px solid var(--color-text-muted);
		}

		button.fill {
			appearance: none;
			background: linear-gradient(to bottom, var(--color-accent-light), var(--color-accent));

			border-radius: 0.3em;
			padding: 0.5em 1em;

			border: 1px solid var(--color-accent);

			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5em;

			font-weight: bold;
			color: white;
		}

		button.text {
			appearance: none;
			background: transparent;
			border: 1px solid var(--color-accent);
			border-radius: 0.3em;
			padding: 0.5em 1em;

			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5em;

			font-weight: bold;
			color: var(--color-accent);
		}

		button.text > span {
			background: var(--color-accent);
			background: linear-gradient(to bottom, var(--color-accent-light), var(--color-accent));
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}
	}
</style>
