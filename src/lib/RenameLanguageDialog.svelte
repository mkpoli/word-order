<script lang="ts">
	import { LL } from '$i18n/i18n-svelte';

	interface Props {
		open?: boolean;
		/** BCP-47 code of the sentence being renamed — shown read-only as context. */
		lang?: string;
		/** Auto-derived language name (used as placeholder + the "Reset" target). */
		defaultLabel?: string;
		/** Current override, or undefined when the sentence uses the default label. */
		displayName?: string | undefined;
		onsave?: (displayName: string | undefined) => void;
	}

	let { open = $bindable(false), lang = '', defaultLabel = '', displayName = undefined, onsave }: Props = $props();

	let draft = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	// Reset the draft to the current override each time the dialog opens, so
	// re-opening for the same sentence shows what's actually stored — not the
	// last-edited string from the previous dialog session.
	$effect(() => {
		if (open) {
			draft = displayName ?? '';
			// Defer focus so the input is mounted before we try to focus it.
			queueMicrotask(() => {
				inputEl?.focus();
				inputEl?.select();
			});
		}
	});

	let trimmed = $derived(draft.replace(/\s+/g, ' ').trim());
	let resolvedDisplayName = $derived<string | undefined>(trimmed === '' || trimmed === defaultLabel ? undefined : trimmed);
	let isCustomised = $derived(resolvedDisplayName !== undefined);
	let isChangedFromStored = $derived(resolvedDisplayName !== displayName);

	function save() {
		onsave?.(resolvedDisplayName);
		open = false;
	}

	function resetToDefault() {
		draft = '';
		inputEl?.focus();
	}

	function close() {
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'Enter' && document.activeElement === inputEl) {
			e.preventDefault();
			save();
		}
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<div class="backdrop" onclick={close} role="presentation">
		<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="rename-title" onclick={(e) => e.stopPropagation()}>
			<header>
				<h2 id="rename-title">
					<iconify-icon icon="mdi:rename-outline" inline="true"></iconify-icon>
					{$LL.renameLanguage.title()}
				</h2>
				<button class="dismiss" type="button" aria-label={$LL.renameLanguage.close()} onclick={close}>
					<iconify-icon icon="material-symbols:close-rounded" inline="true"></iconify-icon>
				</button>
			</header>

			<div class="field">
				<label for="rename-default">{$LL.renameLanguage.defaultLabel()}</label>
				<div class="readonly-row">
					<span class="readonly" id="rename-default">{defaultLabel}</span>
					<span class="lang-code" title={lang}>{lang}</span>
				</div>
			</div>

			<div class="field">
				<label for="rename-input">
					{$LL.renameLanguage.customLabel()}
					{#if isCustomised}
						<span class="customised-badge">
							<iconify-icon icon="mdi:star-outline" inline="true"></iconify-icon>
							{$LL.renameLanguage.customised()}
						</span>
					{/if}
				</label>
				<input
					bind:this={inputEl}
					id="rename-input"
					type="text"
					placeholder={defaultLabel}
					bind:value={draft}
					autocomplete="off"
					spellcheck="false"
					class:customised={isCustomised}
				/>
			</div>

			<div class="actions">
				<button type="button" class="text reset" onclick={resetToDefault} disabled={draft === ''}>
					<iconify-icon icon="mdi:restore" inline="true"></iconify-icon>
					{$LL.renameLanguage.reset()}
				</button>
				<div class="primary-actions">
					<button type="button" class="text" onclick={close}>{$LL.renameLanguage.cancel()}</button>
					<button type="button" class="fill" onclick={save} disabled={!isChangedFromStored}>
						{$LL.renameLanguage.save()}
					</button>
				</div>
			</div>
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
		max-width: 28em;
		width: 100%;
		border-radius: 0.8em;
		box-shadow: 0 20px 60px var(--color-shadow);
		padding: 1.4em 1.6em;
		border: 1px solid var(--color-border-soft);
		display: grid;
		gap: 1em;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
	}

	header h2 {
		margin: 0;
		font-size: 1.2em;
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
	}

	.field label {
		font-weight: 600;
		font-size: 0.9em;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.readonly-row {
		display: flex;
		gap: 0.5em;
		align-items: center;
	}

	.readonly {
		flex: 1;
		padding: 0.3em 0.5em;
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border-soft);
		border-radius: 0.3em;
		font-style: normal;
	}

	.lang-code {
		font-family: monospace;
		font-size: 0.82em;
		color: var(--color-text-muted);
		padding: 0.15em 0.4em;
		border: 1px solid var(--color-border-soft);
		border-radius: 0.3em;
	}

	.customised-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.2em;
		font-size: 0.78em;
		font-weight: 500;
		color: var(--color-accent-text);
		background: var(--color-hover);
		padding: 0.1em 0.45em;
		border-radius: 999px;
	}

	#rename-input {
		padding: 0.4em 0.55em;
		border: 1px solid var(--color-border);
		border-radius: 0.3em;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.95em;
	}

	#rename-input.customised {
		font-style: italic;
		border-color: var(--color-accent);
	}

	.hint {
		margin: 0;
		font-size: 0.78em;
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.6em;
	}

	.primary-actions {
		display: flex;
		gap: 0.5em;
	}

	.actions :global(button) {
		font-size: 0.92em;
		padding: 0.4em 0.85em;
	}

	.actions button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
