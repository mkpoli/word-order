<script lang="ts">
	import { setLocale } from '$i18n/i18n-svelte';

	export let data;

	let { locale } = data;

	if (typeof window !== 'undefined') {
		const lang = window.localStorage.getItem('locale');
		if (lang) {
			locale = lang;
			window.localStorage.setItem('locale', lang);
		}
	}

	setLocale(locale);
</script>

<slot />
