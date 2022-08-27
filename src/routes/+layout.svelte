<script lang="ts">
	import { getAliasedLocale } from '$i18n/alias';
	import { setLocale } from '$i18n/i18n-svelte';
	import type { Locales } from '$i18n/i18n-types';
	import { loadLocale } from '$i18n/i18n-util.sync';

	export let data;

	let { locale } = data;

	if (typeof window !== 'undefined') {
		const lang = window.localStorage.getItem('locale');

		if (lang) {
			if (lang !== locale) {
				loadLocale(lang as Locales);
				locale = getAliasedLocale(lang);
			}
			window.localStorage.setItem('locale', lang);
		}
	}

	setLocale(locale);
</script>

<slot />

<style global>
	* {
		box-sizing: border-box;
	}

	fieldset {
		display: flex;
		flex-direction: column;
		gap: 0.4em;

		padding: 1em 1.5em;
		border-radius: 0.5em;
		border: none;
		box-shadow: 1px 1px 5px 0 #ccc;
	}

	legend {
		background: white;
		padding: 0.2em 0.8em;
		border-radius: 0.3em;
		box-shadow: 1px 1px 5px 0 #ccc;
		font-weight: bold;
	}

	input[type='text'],
	textarea {
		padding: 0.3em 0.5em;
		border-radius: 0.3em;
		border: 1px solid #767676;
	}

	input[type='text']:hover,
	textarea:hover {
		border: 1px solid #4f4f4f;
	}
</style>
