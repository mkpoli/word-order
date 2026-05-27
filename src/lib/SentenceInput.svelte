<script lang="ts">
	import { run } from 'svelte/legacy';

	import { createEventDispatcher } from 'svelte';
	import { getLanguageName } from './lang';
	import { LL, locale } from '$i18n/i18n-svelte';
	import { tokenizeSentence } from './tokenize';
	import type { AnnotationPosition, Sentence } from './types';
	import { getSentenceWords } from './types';
	import Word from './Word.svelte';

	interface Props {
		modifying: number;
		sentences: Sentence[];
		text?: string;
		/** annotationsAbove[laneIndex][tokenIndex] — top lane first. */
		annotationsAbove?: string[][];
		/** annotationsBelow[laneIndex][tokenIndex] — lane closest to word first. */
		annotationsBelow?: string[][];
		glossEnabled?: boolean;
	}

	let {
		modifying,
		sentences,
		text = $bindable(''),
		annotationsAbove = $bindable([]),
		annotationsBelow = $bindable([]),
		glossEnabled = $bindable(false)
	}: Props = $props();

	let lang = $state('en');
	let displayName = $state('English');
	let displayNameIsCustomised = $state(false);

	let previousLang = 'en';

	let textArea: HTMLTextAreaElement | undefined = $state();

	function onmodifyingchange(modifying: number) {
		if (modifying !== -1) {
			previousLang = lang;
			const sentence = sentences[modifying];
			lang = sentence.lang;
			text = getSentenceWords(sentence).join('|');
			annotationsAbove = Array.from({ length: sentence.lanesAbove }, (_, laneIndex) =>
				sentence.tokens.map((t) => t.annotationsAbove[laneIndex] ?? '')
			);
			annotationsBelow = Array.from({ length: sentence.lanesBelow }, (_, laneIndex) =>
				sentence.tokens.map((t) => t.annotationsBelow[laneIndex] ?? '')
			);
			glossEnabled = sentence.showGloss || sentence.lanesAbove > 0 || sentence.lanesBelow > 0;
			textArea?.focus();
		} else {
			lang = previousLang;
			text = '';
			annotationsAbove = [];
			annotationsBelow = [];
			glossEnabled = false;
		}
	}

	const dispatch = createEventDispatcher<{
		submit: {
			lang: string;
			words: string[];
			annotationsAbove: string[][];
			annotationsBelow: string[][];
			showGloss: boolean;
		};
		openTranslate: void;
	}>();

	let empty = $state(false);

	function getWords(value: string): string[] {
		return modifying === -1 ? tokenizeSentence(value, lang) : value.split(/[|]/u).filter(Boolean);
	}

	function fitLanes(lanes: string[][], tokenCount: number): string[][] {
		return lanes.map((lane) => {
			const next = new Array(tokenCount).fill('');
			for (let i = 0; i < Math.min(lane.length, tokenCount); i++) next[i] = lane[i] ?? '';
			return next;
		});
	}

	function syncLanes(value: string) {
		const words = getWords(value);
		const nextAbove = fitLanes(annotationsAbove, words.length);
		const nextBelow = fitLanes(annotationsBelow, words.length);

		if (sameShape(nextAbove, annotationsAbove)) {
			// no-op
		} else {
			annotationsAbove = nextAbove;
		}
		if (sameShape(nextBelow, annotationsBelow)) {
			// no-op
		} else {
			annotationsBelow = nextBelow;
		}
	}

	function sameShape(a: string[][], b: string[][]): boolean {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (a[i].length !== b[i].length) return false;
			for (let j = 0; j < a[i].length; j++) {
				if (a[i][j] !== b[i][j]) return false;
			}
		}
		return true;
	}

	function isGlossableToken(word: string): boolean {
		return !word.match(/^(\s|\p{P}+)$/u);
	}

	function addLane(position: AnnotationPosition) {
		const words = getWords(text);
		const newLane = new Array(words.length).fill('');
		if (position === 'above') annotationsAbove = [...annotationsAbove, newLane];
		else annotationsBelow = [...annotationsBelow, newLane];
		glossEnabled = true;
	}

	function removeLane(position: AnnotationPosition, laneIndex: number) {
		if (position === 'above') annotationsAbove = annotationsAbove.filter((_, i) => i !== laneIndex);
		else annotationsBelow = annotationsBelow.filter((_, i) => i !== laneIndex);
	}

	run(() => {
		// When editing an existing sentence with a custom displayName override,
		// show that override (italic + accent) so the user can see *here* —
		// in the input area — that the label is customised. The final-render
		// diagram intentionally has no such styling. Falls back to the locale
		// default name whenever no override is set.
		const override = modifying !== -1 ? sentences[modifying]?.displayName : undefined;
		displayName = override ?? getLanguageName(lang, $locale);
		displayNameIsCustomised = override !== undefined;
	});
	run(() => {
		syncLanes(text);
	});
	run(() => {
		onmodifyingchange(modifying);
	});
	let words = $derived(getWords(text));
	let glossableTokens = $derived(words.map((word, tokenIndex) => ({ word, tokenIndex })).filter(({ word }) => isGlossableToken(word)));
	let reversedAboveIndices = $derived(annotationsAbove.map((_, i) => i).reverse());
	let hasAnyLane = $derived(annotationsAbove.length > 0 || annotationsBelow.length > 0);
</script>

<fieldset class:editing={modifying !== -1}>
	<legend>
		<iconify-icon icon="ri:input-cursor-move" inline="true"></iconify-icon>
		{$LL.input.input()}
	</legend>

	<div class="input-form">
		<textarea
			placeholder={$LL.input.placeholder()}
			class:empty
			bind:value={text}
			bind:this={textArea}
			onchange={() => {
				empty = false;
			}}
		></textarea>
		<details class="gloss-panel" bind:open={glossEnabled}>
			<summary>
				<iconify-icon icon="mdi:format-annotation-plus" inline="true"></iconify-icon>
				{$LL.input.gloss()}
			</summary>
			<div class="gloss-content">
				{#if glossableTokens.length === 0}
					<p class="gloss-empty">{$LL.input.glossEmpty()}</p>
				{:else}
					<div class="lane-scroll">
						<div class="lane-grid" style="--n: {glossableTokens.length}">
							<button type="button" class="lane-add lane-add-above" onclick={() => addLane('above')}>
								<span class="lane-add-label">
									<iconify-icon icon="mdi:plus" inline="true"></iconify-icon>
									{$LL.input.addLaneAbove()}
								</span>
							</button>

							<!-- Above lanes render top-to-bottom in REVERSE index order so
								"Above 1" = closest to word (just above WORD), "Above N" = furthest. -->
							{#each reversedAboveIndices as laneIndex (`above-${laneIndex}`)}
								<span class="lane-label">{$LL.input.laneAbove({ n: laneIndex + 1 })}</span>
								{#each glossableTokens as { tokenIndex } (tokenIndex)}
									<input
										type="text"
										class="lane-input"
										bind:value={annotationsAbove[laneIndex][tokenIndex]}
										placeholder={$LL.input.glossPlaceholder()}
									/>
								{/each}
								<button
									type="button"
									class="lane-remove"
									title={$LL.input.removeLane()}
									aria-label={$LL.input.removeLane()}
									onclick={() => removeLane('above', laneIndex)}
								>
									<iconify-icon icon="mdi:close" inline="true"></iconify-icon>
								</button>
							{/each}

							<span class="lane-label lane-label-word">{$LL.input.wordRow()}</span>
							{#each glossableTokens as { word, tokenIndex } (tokenIndex)}
								<span class="word-cell" {lang}><Word {word} /></span>
							{/each}
							<span class="lane-corner" aria-hidden="true"></span>

							{#each annotationsBelow as _lane, laneIndex (`below-${laneIndex}`)}
								<span class="lane-label">{$LL.input.laneBelow({ n: laneIndex + 1 })}</span>
								{#each glossableTokens as { tokenIndex } (tokenIndex)}
									<input
										type="text"
										class="lane-input"
										bind:value={annotationsBelow[laneIndex][tokenIndex]}
										placeholder={$LL.input.glossPlaceholder()}
									/>
								{/each}
								<button
									type="button"
									class="lane-remove"
									title={$LL.input.removeLane()}
									aria-label={$LL.input.removeLane()}
									onclick={() => removeLane('below', laneIndex)}
								>
									<iconify-icon icon="mdi:close" inline="true"></iconify-icon>
								</button>
							{/each}

							<button type="button" class="lane-add lane-add-below" onclick={() => addLane('below')}>
								<span class="lane-add-label">
									<iconify-icon icon="mdi:plus" inline="true"></iconify-icon>
									{$LL.input.addLaneBelow()}
								</span>
							</button>
						</div>
					</div>
				{/if}
			</div>
		</details>
		<div class="buttons">
			<input type="text" bind:value={lang} id="lang" />
			<label for="lang" class:customised={displayNameIsCustomised}>{displayName}</label>
			<div class="primary-actions">
				<button
					class="primary"
					onclick={() => {
						const w = getWords(text);
						if (w.length === 0) {
							empty = true;
							return;
						}
						text = '';
						const nextAbove = fitLanes(annotationsAbove, w.length);
						const nextBelow = fitLanes(annotationsBelow, w.length);
						dispatch('submit', {
							lang,
							words: w,
							annotationsAbove: nextAbove,
							annotationsBelow: nextBelow,
							showGloss: glossEnabled || hasAnyLane
						});
					}}
				>
					<iconify-icon icon={modifying === -1 ? 'ic:round-plus' : 'material-symbols:edit-rounded'} width="1.3em" height="1.3em"></iconify-icon>
					{modifying === -1 ? $LL.input.add() : $LL.input.modify()}
				</button>
				{#if modifying === -1}
					<button type="button" class="secondary" onclick={() => dispatch('openTranslate')} disabled={sentences.length === 0}>
						<iconify-icon icon="mdi:translate" width="1.2em" height="1.2em"></iconify-icon>
						{$LL.input.translate()}
					</button>
				{/if}
			</div>
		</div>
		<div class="guidance">
			<iconify-icon icon="ph:info" width="1.5em" height="1.5em"></iconify-icon>
			<p>
				{@html $LL.input.guidance(
					{
						delimiter: '<code title="(U+007C, VERTICAL LINE)">|</code>',
						example: `
	<code>我|愛|你。</code>
	→
	<span style="display:inline-flex; font-family: sans-serif;" lang="zh-HanT">
		<span style="color:orange">我</span>
		<span style="color:crimson">愛</span>
		<span style="color:hotpink">你</span>
		<span>。</span>
	</span>
	`
					},
					{ locale: $locale }
				)}
			</p>
		</div>
	</div>
</fieldset>

<style>
	fieldset {
		height: 100%;
		padding: 1.5em;
		margin: 0;
		border: 1px solid transparent;
		border-radius: 0.4em;
		min-width: 0;
		transition:
			border-color 180ms ease,
			box-shadow 180ms ease,
			background-color 180ms ease;
	}

	fieldset.editing {
		border-color: rgb(46 91 255 / 0.22);
		box-shadow: 0 0 0 0.22rem rgb(46 91 255 / 0.08);
	}

	.input-form {
		display: grid;

		grid-template-areas:
			't t t'
			'g g g'
			'l n b'
			'i i i';

		grid-template-rows: 1fr auto auto auto;

		gap: 1em;

		height: 100%;

		justify-self: stretch;
		align-items: center;
	}

	:global(code) {
		display: inline-block;
		margin: 0 0.2em;
		background: color-mix(in srgb, var(--color-surface) 70%, transparent);
		color: var(--color-text);
		border-radius: 0.2em;
		padding: 0.3em 0.5em;
		box-shadow: 1px 1px 5px 0 var(--color-shadow);
	}

	textarea {
		resize: none;
		height: 100%;

		grid-area: t;
	}

	.gloss-panel {
		grid-area: g;
		border: 1px solid rgb(44 71 255 / 18%);
		border-radius: 0.5em;
		background: var(--color-surface-elevated);
		overflow: hidden;
	}

	.gloss-panel summary {
		list-style: none;
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.8em 1em;
		cursor: pointer;
		font-weight: 600;
		color: var(--color-text);
	}

	.gloss-panel summary::-webkit-details-marker {
		display: none;
	}

	.gloss-content {
		padding: 0 1em 1em;
	}

	/* Horizontal scroll lives on this wrapper so wide sentences scroll within
	   the panel instead of clipping or pushing the whole input column wider.
	   Thin always-visible scrollbar so users see the affordance. */
	.lane-scroll {
		overflow-x: auto;
		overscroll-behavior-x: contain;
		-webkit-overflow-scrolling: touch;
		padding-bottom: 0.15em;
		scrollbar-width: thin;
		scrollbar-color: rgb(44 71 255 / 30%) transparent;
	}

	.lane-scroll::-webkit-scrollbar {
		height: 6px;
	}

	.lane-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.lane-scroll::-webkit-scrollbar-thumb {
		background: rgb(44 71 255 / 25%);
		border-radius: 3px;
	}

	.lane-scroll::-webkit-scrollbar-thumb:hover {
		background: rgb(44 71 255 / 45%);
	}

	/* Single aligned grid: [label] N×[input] [×]. Lane rows, word row, and
	   add-buttons all live in the same grid so columns line up across rows —
	   matching the actual output diagram. Each input column sizes to
	   max(word width, current input value width); field-sizing: content on
	   the inputs is what lets the column shrink when values are short. */
	.lane-grid {
		display: grid;
		grid-template-columns: max-content repeat(var(--n, 1), max-content) auto;
		min-width: max-content;
		gap: 0.35em 0.45em;
		align-items: center;
		padding: 0;
	}

	.lane-label {
		font-size: 0.74em;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		padding: 0.2em 0.5em 0.2em 0.1em;
		white-space: nowrap;
		/* Pin to the left so you can still see "Above 1 / Word / Below 2" when
		   scrolling horizontally through a long sentence. */
		position: sticky;
		left: 0;
		background: var(--color-surface-elevated);
		z-index: 1;
	}

	.lane-label-word {
		color: rgb(33 56 199);
	}

	.lane-input {
		/* Auto-size to the input's value (Chrome/Edge 123+, recent FF/Safari).
		   In older browsers the input keeps its default intrinsic width, which
		   is still functional, just wider than ideal. */
		field-sizing: content;
		padding: 0.28em 0.45em;
		border: 1px solid var(--color-border);
		border-radius: 0.3em;
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: 0.9em;
		min-width: 2.5ch;
		max-width: 16em;
		box-sizing: content-box;
		text-align: center;
	}

	.lane-input:hover {
		border-color: var(--color-text-muted);
	}

	.lane-input:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px rgb(46 91 255 / 0.18);
	}

	.word-cell {
		text-align: center;
		font-size: 1.05em;
		font-weight: 600;
		color: var(--color-text);
		padding: 0.35em 0.2em;
		background: rgb(46 91 255 / 0.06);
		border-radius: 0.25em;
	}

	.lane-remove {
		appearance: none;
		width: 1.5em;
		height: 1.5em;
		border: 1px solid rgb(220 60 60 / 25%);
		background: var(--color-surface);
		border-radius: 999px;
		color: rgb(220 80 80);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		justify-self: center;
	}

	.lane-remove:hover {
		background: rgb(220 60 60 / 12%);
	}

	/* Flat full-width bars at the top and bottom of the stack. The label inside
	   sticks to the left so it stays visible even when the user scrolls right. */
	.lane-add {
		appearance: none;
		grid-column: 1 / -1;
		justify-self: stretch;
		display: block;
		width: 100%;
		padding: 0.3em 0;
		border: none;
		border-radius: 0;
		background: rgb(46 91 255 / 0.06);
		color: rgb(33 56 199);
		font: inherit;
		font-size: 0.78em;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
	}

	.lane-add-above {
		border-bottom: 1px dashed rgb(44 71 255 / 25%);
	}

	.lane-add-below {
		border-top: 1px dashed rgb(44 71 255 / 25%);
	}

	.lane-add:hover {
		background: rgb(46 91 255 / 0.13);
	}

	.lane-add-label {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		padding: 0 0.6em;
		position: sticky;
		left: 0;
	}

	.gloss-empty {
		margin: 0;
		color: rgb(92 98 124);
		font-size: 0.92em;
	}

	.buttons {
		display: contents;
	}

	/* Italic + accent on the lang label tell the user "the displayed name on
	   the diagram is a custom override, not the locale default". The output
	   diagram itself never carries this styling (per UX feedback on #126). */
	label[for='lang'].customised {
		font-style: italic;
		color: var(--color-accent-text);
	}

	.primary-actions {
		grid-area: b;
		display: flex;
		gap: 0.5em;
		width: 100%;
	}

	.primary-actions button {
		width: auto;
		flex: 1;
	}

	.primary-actions .secondary {
		flex: 0 1 auto;
		background: var(--color-surface);
		color: rgb(33 56 199);
		border: 1px solid rgb(46 91 255 / 0.4);
	}

	.primary-actions .secondary:hover:not(:disabled) {
		background: rgb(46 91 255 / 0.06);
		opacity: 1;
	}

	.primary-actions .secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.guidance {
		background: rgb(0 123 255 / 0.1);
		padding: 1em 0.8em;
		border-radius: 0.2em;
		border: 1px solid rgb(0 123 255 / 0.5);

		color: var(--color-text);

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1em;
		grid-area: i;
	}

	.guidance > p {
		margin: 0;
	}

	button {
		appearance: none;
		background: linear-gradient(to bottom, rgb(73 132 255), rgb(44 71 255));

		font-weight: bold;

		border: none;
		border-radius: 0.2em;
		padding: 0.5em 1em;

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;

		color: white;
	}

	button:hover {
		opacity: 0.8;
	}

	.lane-remove,
	.lane-add {
		background: var(--color-surface);
		color: inherit;
		font-weight: 600;
	}

	.lane-add {
		color: rgb(33 56 199);
	}

	.lane-remove {
		color: rgb(170 30 30);
	}

	@media (max-width: 700px) {
		.input-form {
			grid-template-areas:
				't t t'
				'g g g'
				'n n n'
				'l l l'
				'b b b'
				'i i i';
		}

		.buttons > button,
		button[type='submit'] {
			width: 100%;
		}

		.lane-grid {
			/* On narrow screens columns can shrink to their min so the editor
			   stays scrollable within the panel rather than wrapping. */
			grid-template-columns: max-content repeat(var(--n, 1), minmax(3.2em, 1fr)) auto;
		}
	}

	.empty {
		border-color: var(--color-error);
	}
</style>
