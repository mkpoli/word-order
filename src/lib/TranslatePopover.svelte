<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { LL, locale } from '../i18n/i18n-svelte';
	import { getLanguageName, getLocaleOptions } from './lang';
	import { llmSettings, hasKey } from './settings';
	import { MAX_SOURCE_TOKENS } from './llm/translate';
	import { getProvider } from './llm/providers';

	export let open = false;
	export let sourceLangs: string[] = [];
	export let sourceTokenCounts: number[] = [];

	const DEFAULT_TARGETS = ['en', 'ja', 'zh-HanS'];

	const dispatch = createEventDispatcher<{
		submit: { targets: string[] };
		openSettings: void;
		close: void;
	}>();

	$: sourceLangSet = new Set(sourceLangs);
	$: options = getLocaleOptions($locale).filter((opt) => !sourceLangSet.has(opt.value));
	$: provider = getProvider($llmSettings.provider);
	$: keyMissing = !hasKey($llmSettings);
	$: tooLong = sourceTokenCounts.find((c) => c > MAX_SOURCE_TOKENS) ?? 0;
	$: sourceSummary = sourceLangs.map((l) => getLanguageName(l, $locale)).join(', ');

	// "selected" can hold both known locale codes and ad-hoc custom BCP-47 codes.
	let selected: Set<string> = new Set();
	let initializedFor = '';
	let customCode = '';

	$: signature = `${sourceLangs.join('|')}::${$locale}`;
	$: if (open && initializedFor !== signature) {
		const baseDefaults = [String($locale), ...DEFAULT_TARGETS]
			.filter((v) => v && !sourceLangSet.has(v))
			.filter((v) => options.some((o) => o.value === v));
		selected = new Set(baseDefaults);
		initializedFor = signature;
		customCode = '';
	}

	$: if (!open) initializedFor = '';

	function toggle(value: string) {
		if (selected.has(value)) selected.delete(value);
		else selected.add(value);
		selected = selected;
	}

	function addCustom() {
		const v = customCode.trim();
		if (!v) return;
		if (sourceLangSet.has(v)) return;
		selected.add(v);
		selected = selected;
		customCode = '';
	}

	function onCustomKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addCustom();
		}
	}

	function onSubmit() {
		if (selected.size === 0 || keyMissing || tooLong) return;
		dispatch('submit', { targets: Array.from(selected) });
	}

	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') dispatch('close');
	}

	// Custom chips = selected entries that aren't in the known options list and aren't sources.
	$: customChips = Array.from(selected).filter((v) => !options.some((o) => o.value === v));
</script>

<svelte:window on:keydown={onkeydown} />

{#if open}
	<div class="backdrop" on:click={() => dispatch('close')} role="presentation">
		<div class="popover" role="dialog" aria-modal="true" aria-labelledby="translate-popover-title" on:click|stopPropagation>
			<header>
				<h2 id="translate-popover-title">
					<iconify-icon icon="mdi:translate" inline="true" />
					{$LL.translate.title()}
				</h2>
				<button class="dismiss" type="button" aria-label={$LL.translate.close()} on:click={() => dispatch('close')}>
					<iconify-icon icon="material-symbols:close-rounded" inline="true" />
				</button>
			</header>

			<p class="muted">
				{$LL.translate.usingProvider({ provider: provider.label })}
				{#if sourceLangs.length > 0}
					· {$LL.translate.fromSources({ count: String(sourceLangs.length), langs: sourceSummary })}
				{/if}
			</p>

			<p class="cost">
				<iconify-icon icon="mdi:credit-card-outline" inline="true" />
				<span>{$LL.translate.costNotice({ provider: provider.label })}</span>
			</p>

			{#if keyMissing}
				<div class="warn">
					<iconify-icon icon="mdi:key-alert-outline" inline="true" />
					<span>{$LL.translate.noKey({ provider: provider.label })}</span>
					<button type="button" class="link" on:click={() => dispatch('openSettings')}>
						{$LL.translate.openSettings()}
					</button>
				</div>
			{:else if tooLong}
				<div class="warn">
					<iconify-icon icon="mdi:alert-outline" inline="true" />
					<span>{$LL.translate.tooLong({ count: String(tooLong), max: String(MAX_SOURCE_TOKENS) })}</span>
				</div>
			{:else}
				<fieldset class="targets">
					<legend>{$LL.translate.targets()}</legend>
					<div class="chips">
						{#each options as opt}
							<label class="chip" class:on={selected.has(opt.value)}>
								<input type="checkbox" checked={selected.has(opt.value)} on:change={() => toggle(opt.value)} />
								<span class="endonym" lang={opt.tag}>{opt.endonym}</span>
								<span class="exonym">{opt.exonym}</span>
							</label>
						{/each}
						{#each customChips as code (code)}
							<button type="button" class="chip on custom" on:click={() => toggle(code)} title={$LL.translate.removeCustom()}>
								<span class="endonym">{code}</span>
								<iconify-icon icon="material-symbols:close-rounded" inline="true" />
							</button>
						{/each}
					</div>
					<div class="custom-row">
						<input
							type="text"
							placeholder={$LL.translate.customPlaceholder()}
							bind:value={customCode}
							on:keydown={onCustomKey}
							autocomplete="off"
							spellcheck="false"
						/>
						<button type="button" class="add" on:click={addCustom} disabled={!customCode.trim()}>
							{$LL.translate.addCustom()}
						</button>
					</div>
				</fieldset>
			{/if}

			<div class="actions">
				<button type="button" class="submit" on:click={onSubmit} disabled={selected.size === 0 || keyMissing || !!tooLong}>
					<iconify-icon icon="mdi:translate" inline="true" />
					{$LL.translate.submit({ count: String(selected.size) })}
				</button>
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

	.popover {
		background: var(--color-surface);
		color: var(--color-text);
		max-width: 36em;
		width: 100%;
		border-radius: 0.8em;
		box-shadow: 0 20px 60px var(--color-shadow);
		padding: 1.2em 1.4em;
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
		font-size: 1.15em;
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

	.muted {
		color: var(--color-text-muted);
		font-size: 0.9em;
		margin: 0 0 0.5em;
	}

	.cost {
		display: flex;
		gap: 0.5em;
		align-items: flex-start;
		background: rgb(46 91 255 / 0.06);
		border: 1px solid rgb(46 91 255 / 0.15);
		color: var(--color-text);
		font-size: 0.85em;
		padding: 0.55em 0.75em;
		margin: 0 0 0.9em;
		border-radius: 0.4em;
		line-height: 1.5;
	}

	.cost span {
		flex: 1;
	}

	.warn {
		display: flex;
		gap: 0.5em;
		align-items: center;
		flex-wrap: wrap;
		background: rgb(255 196 0 / 0.1);
		border: 1px solid rgb(255 196 0 / 0.4);
		color: rgb(102 73 0);
		font-size: 0.92em;
		padding: 0.7em 0.85em;
		border-radius: 0.4em;
		margin-bottom: 0.9em;
	}

	.link {
		appearance: none;
		background: none;
		border: none;
		padding: 0;
		color: rgb(33 56 199);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
	}

	.targets {
		border: 1px solid rgb(46 91 255 / 0.18);
		border-radius: 0.5em;
		padding: 0.8em 0.85em;
		margin: 0 0 0.9em;
	}

	.targets legend {
		font-weight: 600;
		color: var(--color-text);
		padding: 0 0.4em;
		font-size: 0.9em;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45em;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.35em 0.7em;
		border: 1px solid rgb(46 91 255 / 0.3);
		border-radius: 999px;
		cursor: pointer;
		font-size: 0.88em;
		background: var(--color-surface);
		color: var(--color-text);
	}

	.chip:hover {
		background: rgb(46 91 255 / 0.06);
	}

	.chip.on {
		background: rgb(46 91 255 / 0.12);
		border-color: rgb(46 91 255 / 0.55);
		color: rgb(33 56 199);
	}

	.chip.custom {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		background: rgb(46 91 255 / 0.18);
		border-style: dashed;
	}

	.chip input {
		display: none;
	}

	.endonym {
		font-weight: 600;
	}

	.exonym {
		color: var(--color-text-muted);
		font-size: 0.84em;
	}

	.custom-row {
		display: flex;
		gap: 0.4em;
		margin-top: 0.7em;
	}

	.custom-row input {
		flex: 1;
		min-width: 0;
		padding: 0.4em 0.6em;
		border: 1px solid rgb(46 91 255 / 0.3);
		border-radius: 0.35em;
		font: inherit;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.88em;
	}

	.custom-row .add {
		appearance: none;
		background: rgb(46 91 255 / 0.08);
		border: 1px solid rgb(46 91 255 / 0.3);
		color: rgb(33 56 199);
		padding: 0 0.85em;
		border-radius: 0.35em;
		font-weight: 600;
		cursor: pointer;
		font-size: 0.88em;
	}

	.custom-row .add:hover:not(:disabled) {
		background: rgb(46 91 255 / 0.15);
	}

	.custom-row .add:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
	}

	.submit {
		appearance: none;
		background: linear-gradient(to bottom, rgb(73 132 255), rgb(44 71 255));
		color: white;
		font-weight: bold;
		border: none;
		border-radius: 0.35em;
		padding: 0.55em 1.1em;
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
		cursor: pointer;
	}

	.submit:disabled {
		background: rgb(120 130 160);
		cursor: not-allowed;
		opacity: 0.65;
	}

	.submit:not(:disabled):hover {
		opacity: 0.9;
	}
</style>
