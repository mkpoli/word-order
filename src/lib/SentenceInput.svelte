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
				{#if words.length === 0}
					<p class="gloss-empty">{$LL.input.glossEmpty()}</p>
				{:else}
					<div class="lane-stack">
						{#each annotationsAbove as lane, laneIndex (`above-${laneIndex}`)}
							<div class="lane">
								<span class="lane-label">{$LL.input.laneAbove({ n: laneIndex + 1 })}</span>
								<div class="lane-cells">
									{#each words as word, tokenIndex}
										{#if isGlossableToken(word)}
											<label class="lane-field">
												<span class="lane-word" {lang}><Word {word} /></span>
												<input
													type="text"
													bind:value={annotationsAbove[laneIndex][tokenIndex]}
													placeholder={$LL.input.glossPlaceholder()}
												/>
											</label>
										{/if}
									{/each}
								</div>
								<button
									type="button"
									class="lane-remove"
									title={$LL.input.removeLane()}
									aria-label={$LL.input.removeLane()}
									on:click={() => removeLane('above', laneIndex)}
								>
									<iconify-icon icon="mdi:close" inline="true" />
								</button>
							</div>
						{/each}
						<button type="button" class="lane-add" on:click={() => addLane('above')}>
							<iconify-icon icon="mdi:plus" inline="true" />
							{$LL.input.addLaneAbove()}
						</button>

						<div class="word-row">
							<span class="lane-label lane-label-word">{$LL.input.wordRow()}</span>
							<div class="lane-cells lane-cells-words">
								{#each words as word}
									{#if isGlossableToken(word)}
										<span class="lane-word lane-word-large" {lang}><Word {word} /></span>
									{/if}
								{/each}
							</div>
						</div>

						<button type="button" class="lane-add" on:click={() => addLane('below')}>
							<iconify-icon icon="mdi:plus" inline="true" />
							{$LL.input.addLaneBelow()}
						</button>
						{#each annotationsBelow as lane, laneIndex (`below-${laneIndex}`)}
							<div class="lane">
								<span class="lane-label">{$LL.input.laneBelow({ n: laneIndex + 1 })}</span>
								<div class="lane-cells">
									{#each words as word, tokenIndex}
										{#if isGlossableToken(word)}
											<label class="lane-field">
												<span class="lane-word" {lang}><Word {word} /></span>
												<input
													type="text"
													bind:value={annotationsBelow[laneIndex][tokenIndex]}
													placeholder={$LL.input.glossPlaceholder()}
												/>
											</label>
										{/if}
									{/each}
								</div>
								<button
									type="button"
									class="lane-remove"
									title={$LL.input.removeLane()}
									aria-label={$LL.input.removeLane()}
									on:click={() => removeLane('below', laneIndex)}
								>
									<iconify-icon icon="mdi:close" inline="true" />
								</button>
							</div>
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

	.lane-stack {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5em;
	}

	.lane,
	.word-row {
		display: grid;
		grid-template-columns: 7em 1fr 1.6em;
		align-items: start;
		gap: 0.6em;
		padding: 0.5em 0.6em;
		border-radius: 0.4em;
		background: rgb(255 255 255 / 70%);
		border: 1px solid rgb(44 71 255 / 10%);
	}

	.word-row {
		background: rgb(46 91 255 / 0.06);
		border-color: rgb(46 91 255 / 0.18);
	}

	.lane-label {
		font-size: 0.78em;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: rgb(74 89 142);
		padding-top: 0.4em;
	}

	.lane-label-word {
		color: rgb(33 56 199);
	}

	.lane-cells {
		display: grid;
		gap: 0.4em;
		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
	}

	.lane-cells-words {
		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
		align-items: center;
	}

	.lane-field {
		display: grid;
		gap: 0.25em;
	}

	.lane-word {
		display: block;
		font-size: 0.85em;
		font-weight: 600;
		color: rgb(60 67 96);
		word-break: break-word;
	}

	.lane-word-large {
		font-size: 1em;
		text-align: center;
		padding: 0.2em 0;
	}

	.lane-field input {
		padding: 0.3em 0.45em;
		border: 1px solid rgb(44 71 255 / 20%);
		border-radius: 0.3em;
		background: white;
		font: inherit;
		font-size: 0.9em;
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
	}

	.lane-remove {
		appearance: none;
		width: 1.6em;
		height: 1.6em;
		border: 1px solid rgb(220 60 60 / 25%);
		background: white;
		border-radius: 999px;
		color: rgb(170 30 30);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
	}

	.lane-remove:hover {
		background: rgb(220 60 60 / 12%);
	}

	.lane-add {
		appearance: none;
		justify-self: start;
		padding: 0.32em 0.7em;
		border: 1px dashed rgb(44 71 255 / 35%);
		border-radius: 999px;
		background: rgb(255 255 255 / 80%);
		color: rgb(33 56 199);
		font: inherit;
		font-size: 0.85em;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
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

		button {
			width: 100%;
		}

		.lane,
		.word-row {
			grid-template-columns: 1fr 1.6em;
		}

		.lane-label,
		.lane-label-word {
			grid-column: 1 / -1;
		}

		.lane-cells {
			grid-column: 1 / 2;
		}

		.lane-remove {
			grid-column: 2 / 3;
			align-self: start;
		}
	}

	.empty {
		border-color: var(--color-error);
	}
</style>
