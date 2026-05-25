<script lang="ts">
	import { themePref, type ThemePref } from './theme';
	import { LL } from '../i18n/i18n-svelte';
	import 'iconify-icon';

	const ICONS: Record<ThemePref, string> = {
		system: 'mdi:theme-light-dark',
		light: 'mdi:weather-sunny',
		dark: 'mdi:weather-night'
	};

	const ORDER: ThemePref[] = ['system', 'light', 'dark'];

	function cycle() {
		const i = ORDER.indexOf($themePref);
		themePref.set(ORDER[(i + 1) % ORDER.length]);
	}

	function labelKey(t: ThemePref): 'themeSystem' | 'themeLight' | 'themeDark' {
		return `theme${t.charAt(0).toUpperCase() + t.slice(1)}` as 'themeSystem' | 'themeLight' | 'themeDark';
	}
</script>

<button
	class="theme-toggle"
	type="button"
	on:click={cycle}
	title={`${$LL.theme.label()}: ${$LL.theme[labelKey($themePref)]()}`}
	aria-label={`${$LL.theme.label()}: ${$LL.theme[labelKey($themePref)]()}`}
>
	<iconify-icon icon={ICONS[$themePref]} inline="true" />
</button>

<style>
	.theme-toggle {
		appearance: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.2rem;
		height: 2.2rem;
		padding: 0;
		border: none;
		border-radius: 0.2em;
		background: var(--color-surface);
		color: var(--color-text);
		box-shadow: 1px 1px 5px 0 var(--color-shadow);
		cursor: pointer;
		font-size: 1.15rem;
		transition:
			background-color 160ms ease,
			box-shadow 160ms ease;
	}

	.theme-toggle:hover {
		background: var(--color-hover);
	}

	.theme-toggle:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}
</style>
