<script lang="ts">
	import { setLocale } from '$i18n/i18n-svelte';
	import type { Locales } from '$i18n/i18n-types';

	if (typeof window !== 'undefined') {
		const lang = window?.localStorage.getItem('lang') || window?.navigator.language || 'en';
		setLocale(lang as Locales);
		window.localStorage.setItem('lang', lang);
	}
</script>

<slot />
