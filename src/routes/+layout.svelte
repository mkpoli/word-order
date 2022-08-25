<script lang="ts">
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
			}
			locale = lang;
			window.localStorage.setItem('locale', lang);
		}
	}

	setLocale(locale);
</script>

<slot />
