<script lang="ts">
	import { LL } from '../i18n/i18n-svelte';
	import { llmSettings, type ProviderId } from './settings';
	import { PROVIDERS, getProvider } from './llm/providers';
	import { themePref, type ThemePref } from './theme';

	const THEMES: ThemePref[] = ['system', 'light', 'dark'];
	const themeLabelKey = (t: ThemePref) => `theme${t.charAt(0).toUpperCase() + t.slice(1)}` as 'themeSystem' | 'themeLight' | 'themeDark';

	export let open = false;

	let showKey = false;

	$: provider = getProvider($llmSettings.provider);
	$: currentKey = $llmSettings.keys[$llmSettings.provider] ?? '';
	$: currentModel = $llmSettings.model || provider.defaultModel;

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

<svelte:window on:keydown={onkeydown} />

{#if open}
	<div class="backdrop" on:click={close} role="presentation">
		<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" on:click|stopPropagation>
			<header>
				<h2 id="settings-title">
					<iconify-icon icon="mdi:cog-outline" inline="true" />
					{$LL.settings.title()}
				</h2>
				<button class="dismiss" type="button" aria-label={$LL.settings.close()} on:click={close}>
					<iconify-icon icon="material-symbols:close-rounded" inline="true" />
				</button>
			</header>

			<p class="lede">{$LL.settings.tagline()}</p>

			<div class="field">
				<span class="field-label">{$LL.settings.theme()}</span>
				<div class="theme-row" role="radiogroup" aria-label={$LL.settings.theme()}>
					{#each THEMES as t (t)}
						<label class="theme-option" class:selected={$themePref === t}>
							<input type="radio" name="theme" value={t} checked={$themePref === t} on:change={() => themePref.set(t)} />
							<span>{$LL.settings[themeLabelKey(t)]()}</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="field">
				<label for="settings-provider">{$LL.settings.provider()}</label>
				<select id="settings-provider" value={$llmSettings.provider} on:change={onProviderChange}>
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
					on:input={onModelChange}
					on:change={onModelChange}
					autocomplete="off"
					spellcheck="false"
				/>
				<datalist id="settings-model-options">
					{#each provider.models as m}
						<option value={m}></option>
					{/each}
				</datalist>
				<p class="field-hint">{$LL.settings.modelHint()}</p>
			</div>

			<div class="field">
				<label for="settings-key">{$LL.settings.apiKey()}</label>
				<div class="key-row">
					<input
						id="settings-key"
						type={showKey ? 'text' : 'password'}
						placeholder={provider.keyHint}
						value={currentKey}
						on:input={onKeyInput}
						autocomplete="off"
						spellcheck="false"
					/>
					<button type="button" class="toggle" on:click={() => (showKey = !showKey)}>
						{showKey ? $LL.settings.hide() : $LL.settings.show()}
					</button>
				</div>
			</div>

			<p class="privacy">
				<iconify-icon icon="mdi:shield-lock-outline" inline="true" />
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

	.theme-row {
		display: flex;
		gap: 0.4em;
		flex-wrap: wrap;
	}

	.theme-option {
		display: flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.4em 0.7em;
		border-radius: 0.3em;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
		font-size: 0.9em;
		font-weight: 600;
		user-select: none;
	}

	.theme-option:hover {
		background: var(--color-hover);
	}

	.theme-option.selected {
		border-color: var(--color-accent);
		color: var(--color-accent);
		background: rgb(46 91 255 / 0.08);
	}

	.theme-option input {
		appearance: none;
		margin: 0;
		width: 0;
		height: 0;
	}

	.field-label {
		font-weight: 600;
		font-size: 0.92em;
		color: var(--color-text);
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
		color: rgb(33 56 199);
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

	.lede {
		font-size: 1.05em;
		color: var(--color-text);
		margin: 0.6em 0 1em;
		line-height: 1.5;
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
		padding: 0.5em 0.65em;
		border: 1px solid rgb(46 91 255 / 0.3);
		border-radius: 0.35em;
		font: inherit;
		background: var(--color-surface);
		color: var(--color-text);
	}

	.field select:focus,
	.field input:focus {
		outline: 2px solid rgb(46 91 255 / 0.4);
		outline-offset: -1px;
	}

	.field-hint {
		font-size: 0.82em;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.4;
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
		color: rgb(33 56 199);
		padding: 0 0.85em;
		border-radius: 0.35em;
		font-weight: 600;
		cursor: pointer;
		font-size: 0.9em;
	}

	.toggle:hover {
		background: rgb(46 91 255 / 0.15);
	}

	.privacy {
		display: flex;
		gap: 0.5em;
		align-items: flex-start;
		background: rgb(46 91 255 / 0.06);
		border: 1px solid rgb(46 91 255 / 0.15);
		color: rgb(45 55 80);
		font-size: 0.88em;
		padding: 0.7em 0.85em;
		margin: 0.4em 0 0;
		border-radius: 0.4em;
		line-height: 1.5;
	}
</style>
