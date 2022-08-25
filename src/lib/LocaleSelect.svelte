<script lang="ts">
	import { setLocale, locale } from '$i18n/i18n-svelte';
	import type { Locales } from '$i18n/i18n-types';
	import { locales } from '$i18n/i18n-util';
	import { loadLocaleAsync } from '$i18n/i18n-util.async';
	import { getLanguageName } from './lang';

	const switchLocale = async (newLocale: Locales) => {
		if (!newLocale || $locale === newLocale) return;

		// load new dictionary from server
		await loadLocaleAsync(newLocale);

		// select locale
		setLocale(newLocale);

		window.localStorage.setItem('locale', newLocale);
	};

	let selected = $locale;
</script>

<select
	bind:value={selected}
	id="locale"
	name="locale"
	on:change={() => {
		switchLocale(selected);
	}}
>
	{#each locales as l}
		<option value={l}>{getLanguageName(l, l)}</option>
	{/each}
</select>
