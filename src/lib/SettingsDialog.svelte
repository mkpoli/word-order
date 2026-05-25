<script lang="ts">
	import { createBubbler, stopPropagation } from 'svelte/legacy';

	const bubble = createBubbler();
	import { LL } from '../i18n/i18n-svelte';
	import { llmSettings, type ProviderId } from './settings';
	import { PROVIDERS, getProvider } from './llm/providers';
	import type { KeyValidation } from './llm/types';
	import { clearTranslationCache, getCacheSize } from './llm/cache';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	let showKey = $state(false);
	let cacheSize = $state(0);
	let cacheClearedFlash = $state(false);

	$effect(() => {
		// Re-read cache size whenever the dialog opens; cheap and keeps the
		// number live if a translate happened while the dialog was closed.
		if (open) cacheSize = getCacheSize();
	});

	function onClearCache() {
		clearTranslationCache();
		cacheSize = 0;
		cacheClearedFlash = true;
		setTimeout(() => (cacheClearedFlash = false), 1800);
	}

	let provider = $derived(getProvider($llmSettings.provider));
	let currentKey = $derived($llmSettings.keys[$llmSettings.provider] ?? '');
	let currentModel = $derived($llmSettings.model || provider.defaultModel);

	type ValidationState = { status: 'idle' | 'checking' } | KeyValidation;
	let validation = $state<ValidationState>({ status: 'idle' });
	let validationTimer: ReturnType<typeof setTimeout> | null = null;
	let validationAbort: AbortController | null = null;
	/**
	 * Debounce key changes by 600ms so we don't spam the auth endpoint while
	 * the user types/pastes. Abort any in-flight check before starting a new
	 * one so the latest key always wins.
	 */
	$effect(() => {
		const key = currentKey;
		const p = provider;
		if (validationTimer) clearTimeout(validationTimer);
		if (validationAbort) validationAbort.abort();
		if (!key) {
			validation = { status: 'idle' };
			return;
		}
		validationTimer = setTimeout(async () => {
			const ctrl = new AbortController();
			validationAbort = ctrl;
			validation = { status: 'checking' };
			const result = await p.validateKey(key, ctrl.signal);
			if (!ctrl.signal.aborted) validation = result;
		}, 600);
		// Cleanup on unmount or before the effect re-runs: cancel the pending
		// debounce timer and abort any in-flight validation so we don't leak
		// a fetch into nowhere when the dialog closes mid-check.
		return () => {
			if (validationTimer) clearTimeout(validationTimer);
			if (validationAbort) validationAbort.abort();
		};
	});

	function close() {
		open = false;
		showKey = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}

	function onProviderChange(e: Event) {
		const id = (e.target as HTMLSelectElement).value as ProviderId;
		llmSettings.setProvider(id);
		const next = getProvider(id);
		if (!next.models.includes($llmSettings.model)) {
			llmSettings.setModel(next.defaultModel);
		}
	}

	function onModelChange(e: Event) {
		llmSettings.setModel((e.target as HTMLInputElement | HTMLSelectElement).value);
	}

	function onKeyInput(e: Event) {
		llmSettings.setKey($llmSettings.provider, (e.target as HTMLInputElement).value);
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<div class="backdrop" onclick={close} role="presentation">
		<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" onclick={stopPropagation(bubble('click'))}>
			<header>
				<h2 id="settings-title">
					<iconify-icon icon="mdi:cog-outline" inline="true"></iconify-icon>
					{$LL.settings.title()}
				</h2>
				<button class="dismiss" type="button" aria-label={$LL.settings.close()} onclick={close}>
					<iconify-icon icon="material-symbols:close-rounded" inline="true"></iconify-icon>
				</button>
			</header>

			<div class="field">
				<label for="settings-provider">{$LL.settings.provider()}</label>
				<select id="settings-provider" value={$llmSettings.provider} onchange={onProviderChange}>
					{#each PROVIDERS as p}
						<option value={p.id}>{p.label}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="settings-model">{$LL.settings.model()}</label>
				<input
					id="settings-model"
					type="text"
					list="settings-model-options"
					placeholder={provider.defaultModel}
					value={currentModel}
					oninput={onModelChange}
					onchange={onModelChange}
					autocomplete="off"
					spellcheck="false"
				/>
				<datalist id="settings-model-options">
					{#each provider.models as m}
						<option value={m}></option>
					{/each}
				</datalist>
			</div>

			<div class="field">
				<label for="settings-key">{$LL.settings.apiKey()}</label>
				<div class="key-row">
					<input
						id="settings-key"
						type={showKey ? 'text' : 'password'}
						placeholder={provider.keyHint}
						value={currentKey}
						oninput={onKeyInput}
						autocomplete="off"
						spellcheck="false"
					/>
					<button type="button" class="toggle" onclick={() => (showKey = !showKey)}>
						{showKey ? $LL.settings.hide() : $LL.settings.show()}
					</button>
				</div>
				{#if validation.status === 'checking'}
					<p class="key-status checking">
						<iconify-icon icon="mdi:loading" inline="true"></iconify-icon>
						<span>{$LL.settings.keyChecking()}</span>
					</p>
				{:else if validation.status === 'valid'}
					<p class="key-status valid">
						<iconify-icon icon="mdi:check-circle-outline" inline="true"></iconify-icon>
						<span>{$LL.settings.keyValid()}</span>
					</p>
				{:else if validation.status === 'invalid'}
					<p class="key-status invalid" title={validation.reason}>
						<iconify-icon icon="mdi:close-circle-outline" inline="true"></iconify-icon>
						<span>{$LL.settings.keyInvalid()}</span>
					</p>
				{:else if validation.status === 'network-error'}
					<p class="key-status network-error">
						<iconify-icon icon="mdi:cloud-off-outline" inline="true"></iconify-icon>
						<span>{$LL.settings.keyNetworkError()}</span>
					</p>
				{/if}
			</div>

			<div class="field cache-row">
				<span class="cache-label">
					{cacheClearedFlash ? $LL.settings.cacheCleared() : $LL.settings.cacheStored({ count: cacheSize })}
				</span>
				<button type="button" class="toggle" onclick={onClearCache} disabled={cacheSize === 0 && !cacheClearedFlash}>
					{$LL.settings.clearCache()}
				</button>
			</div>

			<p class="privacy">
				<iconify-icon icon="mdi:shield-lock-outline" inline="true"></iconify-icon>
				<span>{$LL.settings.privacy()}</span>
			</p>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgb(20 28 56 / 0.45);
		backdrop-filter: blur(3px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1em;
	}

	.dialog {
		background: var(--color-surface);
		color: var(--color-text);
		max-width: 32em;
		width: 100%;
		border-radius: 0.8em;
		box-shadow: 0 20px 60px var(--color-shadow);
		padding: 1.4em 1.6em;
		border: 1px solid var(--color-border-soft);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		margin-bottom: 0.4em;
	}

	header h2 {
		margin: 0;
		font-size: 1.25em;
		color: var(--color-accent-text);
		display: flex;
		align-items: center;
		gap: 0.4em;
	}

	.dismiss {
		appearance: none;
		background: none;
		border: none;
		font-size: 1.2em;
		cursor: pointer;
		color: var(--color-text-muted);
		padding: 0.2em 0.4em;
		border-radius: 0.3em;
	}

	.dismiss:hover {
		background: var(--color-hover);
	}

	.field {
		display: grid;
		gap: 0.35em;
		margin-bottom: 0.9em;
	}

	.field label {
		font-weight: 600;
		font-size: 0.92em;
		color: var(--color-text);
	}

	.field select,
	.field input {
		padding: 0.3em 0.5em;
		border: 1px solid var(--color-border);
		border-radius: 0.3em;
		font: inherit;
		background: var(--color-surface);
		color: var(--color-text);
	}

	.field select:hover,
	.field input:hover {
		border-color: var(--color-text-muted);
	}

	.field select:focus,
	.field input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}

	.key-row {
		display: flex;
		gap: 0.5em;
	}

	.key-row input {
		flex: 1;
		min-width: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.toggle {
		appearance: none;
		background: rgb(46 91 255 / 0.08);
		border: 1px solid rgb(46 91 255 / 0.3);
		color: var(--color-accent-text);
		padding: 0 0.85em;
		border-radius: 0.35em;
		font-weight: 600;
		cursor: pointer;
		font-size: 0.9em;
	}

	.toggle:hover {
		background: rgb(46 91 255 / 0.15);
	}
	.toggle:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.cache-row {
		display: flex;
		align-items: center;
		gap: 0.5em;
		justify-content: space-between;
	}
	.cache-label {
		font-size: 0.88em;
		color: var(--color-text-muted);
	}

	.key-status {
		display: flex;
		align-items: center;
		gap: 0.4em;
		font-size: 0.85em;
		margin: 0.35em 0 0;
	}
	.key-status :global(iconify-icon) {
		font-size: 1.1em;
	}
	.key-status.checking {
		color: var(--color-text-muted);
	}
	.key-status.valid {
		color: var(--color-success);
	}
	.key-status.invalid {
		color: var(--color-danger);
	}
	.key-status.network-error {
		color: var(--color-text-muted);
	}

	.privacy {
		display: flex;
		gap: 0.5em;
		align-items: flex-start;
		background: rgb(46 91 255 / 0.06);
		border: 1px solid rgb(46 91 255 / 0.15);
		color: var(--color-text);
		font-size: 0.88em;
		padding: 0.7em 0.85em;
		margin: 0.4em 0 0;
		border-radius: 0.4em;
		line-height: 1.5;
	}
</style>
