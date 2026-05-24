<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getLanguageName } from './lang';
	import { LL, locale } from '$i18n/i18n-svelte';
	import { tokenizeSentence } from './tokenize';
	import type { AnnotationPosition, Sentence } from './types';
	import { getSentenceWords } from './types';
	import Word from './Word.svelte';

	export let modifying: number;
	export let sentences: Sentence[];
	export let text = '';
	/** annotationsAbove[laneIndex][tokenIndex] — top lane first. */
	export let annotationsAbove: string[][] = [];
	/** annotationsBelow[laneIndex][tokenIndex] — lane closest to word first. */
	export let annotationsBelow: string[][] = [];
	export let glossEnabled = false;

	let lang = 'en';
	let displayName = 'English';

	$: displayName = getLanguageName(lang, $locale);
	$: syncLanes(text);

	let previousLang = 'en';

	let textArea: HTMLTextAreaElement;

	$: onmodifyingchange(modifying);

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
			textArea.focus();
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
	}>();

	let empty = false;

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

	$: words = getWords(text);
	$: glossableTokens = words
		.map((word, tokenIndex) => ({ word, tokenIndex }))
		.filter(({ word }) => isGlossableToken(word));
	$: hasAnyLane = annotationsAbove.length > 0 || annotationsBelow.length > 0;
</script>

<fieldset class:editing={modifying !== -1}>
	<legend>
		<iconify-icon icon="ri:input-cursor-move" inline="true" />
		{$LL.input.input()}
	</legend>

	<div class="input-form">
		<textarea
			placeholder={$LL.input.placeholder()}
			class:empty
			bind:value={text}
			bind:this={textArea}
			on:change={() => {
				empty = false;
			}}
		></textarea>
		<details class="gloss-panel" bind:open={glossEnabled}>
			<summary>
				<iconify-icon icon="mdi:format-annotation-plus" inline="true" />
				{$LL.input.gloss()}
			</summary>
			<div class="gloss-content">
				{#if glossableTokens.length === 0}
					<p class="gloss-empty">{$LL.input.glossEmpty()}</p>
				{:else}
					<div class="lane-grid" style="--n: {glossableTokens.length}">
						{#each annotationsAbove as lane, laneIndex (`above-${laneIndex}`)}
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
								on:click={() => removeLane('above', laneIndex)}
							>
								<iconify-icon icon="mdi:close" inline="true" />
							</button>
						{/each}

						<button type="button" class="lane-add lane-add-above" on:click={() => addLane('above')}>
							<iconify-icon icon="mdi:plus" inline="true" />
							{$LL.input.addLaneAbove()}
						</button>

						<span class="lane-label lane-label-word">{$LL.input.wordRow()}</span>
						{#each glossableTokens as { word, tokenIndex } (tokenIndex)}
							<span class="word-cell" {lang}><Word {word} /></span>
						{/each}
						<span class="lane-corner" aria-hidden="true"></span>

						<button type="button" class="lane-add lane-add-below" on:click={() => addLane('below')}>
							<iconify-icon icon="mdi:plus" inline="true" />
							{$LL.input.addLaneBelow()}
						</button>

						{#each annotationsBelow as lane, laneIndex (`below-${laneIndex}`)}
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
								on:click={() => removeLane('below', laneIndex)}
							>
								<iconify-icon icon="mdi:close" inline="true" />
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</details>
		<div class="buttons">
			<input type="text" bind:value={lang} id="lang" />
			<label for="lang">{displayName}</label>
			<button
				on:click={() => {
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
				<iconify-icon icon={modifying === -1 ? 'ic:round-plus' : 'material-symbols:edit-rounded'} width="1.3em" height="1.3em" />
				{modifying === -1 ? $LL.input.add() : $LL.input.modify()}
			</button>
		</div>
		<div class="guidance">
			<iconify-icon icon="ph:info" width="1.5em" height="1.5em" />
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
		background: rgba(255, 255, 255, 0.7);
		border-radius: 0.2em;
		padding: 0.3em 0.5em;
		box-shadow: 1px 1px 5px 0 #ccc;
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
		background: rgb(249 251 255 / 92%);
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
		color: rgb(35 51 120);
	}

	.gloss-panel summary::-webkit-details-marker {
		display: none;
	}

	.gloss-content {
		padding: 0 1em 1em;
	}

	/* Single aligned grid: [label] N×[input] [×]. Lane rows, word row, and
	   add-buttons all live in the same grid so columns line up across rows —
	   matching the actual output diagram. */
	.lane-grid {
		display: grid;
		grid-template-columns: max-content repeat(var(--n, 1), minmax(4em, 1fr)) auto;
		gap: 0.35em 0.45em;
		align-items: center;
		padding: 0.2em 0.1em;
	}

	.lane-label {
		font-size: 0.74em;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: rgb(74 89 142);
		padding-right: 0.4em;
		white-space: nowrap;
	}

	.lane-label-word {
		color: rgb(33 56 199);
	}

	.lane-input {
		padding: 0.28em 0.4em;
		border: 1px solid rgb(44 71 255 / 20%);
		border-radius: 0.3em;
		background: white;
		font: inherit;
		font-size: 0.9em;
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
		text-align: center;
	}

	.lane-input:focus {
		outline: none;
		border-color: rgb(44 71 255 / 55%);
		box-shadow: 0 0 0 2px rgb(44 71 255 / 12%);
	}

	.word-cell {
		text-align: center;
		font-size: 1.05em;
		font-weight: 600;
		color: rgb(33 51 110);
		padding: 0.35em 0.2em;
		background: rgb(46 91 255 / 0.06);
		border-radius: 0.25em;
	}

	.lane-remove {
		appearance: none;
		width: 1.5em;
		height: 1.5em;
		border: 1px solid rgb(220 60 60 / 25%);
		background: white;
		border-radius: 999px;
		color: rgb(170 30 30);
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

	/* Span the entire row so auto-flow lands the next lane label back in column 1.
	   Partial spans would leave gaps that auto-flow tries to fill from the next row. */
	.lane-add {
		appearance: none;
		grid-column: 1 / -1;
		justify-self: start;
		padding: 0.22em 0.65em;
		border: 1px dashed rgb(44 71 255 / 35%);
		border-radius: 999px;
		background: rgb(255 255 255 / 80%);
		color: rgb(33 56 199);
		font: inherit;
		font-size: 0.78em;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		cursor: pointer;
	}

	.lane-add:hover {
		background: rgb(44 71 255 / 10%);
	}

	.gloss-empty {
		margin: 0;
		color: rgb(92 98 124);
		font-size: 0.92em;
	}

	.buttons {
		display: contents;
	}

	.buttons > button,
	button[type='submit'] {
		width: 100%;
		grid-area: b;
	}

	.guidance {
		background: rgb(0, 123, 255, 0.1);
		padding: 1em 0.8em;
		border-radius: 0.2em;
		border: 1px solid rgb(0, 123, 255);

		color: rgb(0, 39, 80);

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
		background: white;
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
