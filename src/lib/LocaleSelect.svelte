<script lang="ts">
	import { setLocale, locale } from '$i18n/i18n-svelte';
	import type { Locales } from '$i18n/i18n-types';
	import { LL } from '$i18n/i18n-svelte';
	import { getLocaleDirection, getLocaleDisplayCode, getLocaleOption, getLocaleOptions } from './lang';

	const switchLocale = async (newLocale: Locales) => {
		if (!newLocale || $locale === newLocale) return;

		// select locale
		setLocale(newLocale);

		if (document) {
			document.documentElement.lang = newLocale;
			document.documentElement.dir = getLocaleDirection(newLocale);
		}
		window.localStorage.setItem('locale', newLocale);
	};

	let menu: HTMLDetailsElement | undefined = $state();
	let trigger: HTMLElement | undefined = $state();
	let optionButtons: HTMLButtonElement[] = $state([]);
	let localeOptions = $derived(getLocaleOptions($locale));
	let selected = $derived(getLocaleOption($locale, $locale));
	let selectedIndex = $derived(localeOptions.findIndex((option) => option.value === $locale));

	function closeMenu() {
		menu?.removeAttribute('open');
		trigger?.focus();
	}

	function focusOption(index: number) {
		optionButtons[index]?.focus();
	}

	function openMenuAndFocus(index = selectedIndex) {
		if (!menu) return;
		menu.open = true;
		requestAnimationFrame(() => {
			focusOption(Math.max(0, index));
		});
	}

	async function onSelect(newLocale: Locales) {
		await switchLocale(newLocale);
		closeMenu();
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			openMenuAndFocus(event.key === 'ArrowDown' ? selectedIndex : Math.max(0, selectedIndex));
		}
	}

	function onOptionKeydown(event: KeyboardEvent, index: number, value: Locales) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			focusOption((index + 1) % localeOptions.length);
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			focusOption((index - 1 + localeOptions.length) % localeOptions.length);
			return;
		}

		if (event.key === 'Home') {
			event.preventDefault();
			focusOption(0);
			return;
		}

		if (event.key === 'End') {
			event.preventDefault();
			focusOption(localeOptions.length - 1);
			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			closeMenu();
			return;
		}

		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			onSelect(value);
		}
	}
</script>

<details class="locale-picker" bind:this={menu}>
	<summary aria-label={$LL.params.displayLanguage()} bind:this={trigger} onkeydown={onTriggerKeydown}>
		<span class="locale-trigger-icon">
			<iconify-icon icon="mdi:translate"></iconify-icon>
		</span>
		<span class="locale-trigger-copy">
			<span class="locale-trigger-label">{$LL.params.displayLanguage()}</span>
			<span class="locale-trigger-value" lang={selected.tag}>{selected.endonym}</span>
		</span>
		<span class="locale-trigger-code">{getLocaleDisplayCode(selected)}</span>
		<iconify-icon class="locale-trigger-caret" icon="mdi:chevron-down"></iconify-icon>
	</summary>

	<div class="locale-menu" role="listbox" aria-label={$LL.params.displayLanguage()}>
		{#each localeOptions as option, index}
			<button
				type="button"
				role="option"
				aria-selected={option.value === $locale}
				class:selected={option.value === $locale}
				bind:this={optionButtons[index]}
				onclick={() => onSelect(option.value)}
				onkeydown={(event) => onOptionKeydown(event, index, option.value)}
			>
				<span class="locale-option-copy">
					<span class="locale-option-title-row">
						<span class="locale-option-endonym" lang={option.tag}>{option.endonym}</span>
						{#if option.value === $locale}
							<span class="locale-option-badge" aria-label={$LL.ui.selected()}>
								<iconify-icon icon="material-symbols:check-rounded"></iconify-icon>
							</span>
						{/if}
					</span>
				</span>
				<span class="locale-option-meta">{getLocaleDisplayCode(option)}</span>
			</button>
		{/each}
	</div>
</details>

<style>
	.locale-picker {
		position: relative;
		min-width: min(15rem, 100%);
	}

	.locale-picker[open] {
		z-index: 50;
	}

	.locale-picker > summary {
		list-style: none;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.7rem;
		border-radius: 0.2em;
		border: none;
		background: var(--color-surface);
		color: var(--color-text);
		box-shadow: 1px 1px 5px 0 var(--color-shadow);
		cursor: pointer;
		user-select: none;
		transition:
			background-color 160ms ease,
			box-shadow 160ms ease;
	}

	.locale-picker > summary::-webkit-details-marker {
		display: none;
	}

	.locale-picker > summary:hover {
		background-color: var(--color-hover);
	}

	.locale-picker:has(:global(summary:focus-visible)) > summary {
		outline: none;
		background-color: var(--color-hover);
		box-shadow:
			0 0 0 2px rgb(0 0 0 / 14%),
			1px 1px 5px 0 var(--color-shadow);
	}

	.locale-picker[open] > summary {
		background-color: var(--color-hover);
	}

	.locale-trigger-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.3rem;
		height: 1.3rem;
		color: var(--color-text-muted);
		font-size: 0.95rem;
	}

	.locale-trigger-copy {
		min-width: 0;
		display: grid;
	}

	.locale-trigger-label {
		display: none;
	}

	.locale-trigger-value {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.locale-trigger-code {
		padding: 0.14rem 0.42rem;
		border-radius: 999px;
		background: var(--color-hover);
		color: var(--color-text-muted);
		font-size: 0.67rem;
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	.locale-trigger-caret {
		color: var(--color-text-muted);
		transition: transform 180ms ease;
	}

	.locale-picker[open] .locale-trigger-caret {
		transform: rotate(180deg);
	}

	.locale-menu {
		position: absolute;
		top: calc(100% + 0.35rem);
		inset-inline-end: 0;
		width: min(34rem, calc(100vw - 2rem));
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-content: start;
		padding: 0.3rem;
		border-radius: 0.45rem;
		border: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-surface) 94%, transparent);
		box-shadow: 1px 1px 8px 0 var(--color-shadow);
		backdrop-filter: blur(8px);
	}

	.locale-menu button {
		appearance: none;
		width: 100%;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.6rem;
		padding: 0.48rem 0.8rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		background: transparent;
		text-align: left;
		transition:
			background-color 160ms ease,
			border-color 160ms ease;
	}

	.locale-menu button:hover,
	.locale-menu button:focus-visible {
		outline: none;
		background: var(--color-hover);
	}

	.locale-menu button:focus-visible {
		box-shadow: inset 2px 0 0 var(--color-text-muted);
	}

	.locale-menu button.selected {
		background: var(--color-hover);
	}

	.locale-option-copy {
		min-width: 0;
		display: flex;
		align-items: center;
	}

	.locale-option-title-row {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		min-width: 0;
	}

	.locale-option-endonym {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.locale-option-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 999px;
		background: var(--color-hover);
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.locale-option-meta {
		display: flex;
		align-items: center;
		font-size: 0.69rem;
		color: var(--color-text-muted);
		white-space: nowrap;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	@media (max-width: 720px) {
		.locale-picker {
			min-width: min(15rem, 100%);
		}

		.locale-menu {
			inset-inline-end: 0;
			width: min(18rem, calc(100vw - 2rem));
			max-height: min(32rem, calc(100dvh - 8rem));
			overflow-y: auto;
			overflow-x: hidden;
			scroll-padding-block: 0.6rem;
			scrollbar-gutter: stable;
			grid-template-columns: 1fr;
		}

		.locale-menu::after {
			content: '';
			display: block;
			height: 0.8rem;
		}

		.locale-option-meta {
			justify-content: flex-end;
		}
	}
</style>
