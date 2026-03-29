<script lang="ts" context="module">
	export type Line = [x1: number, y1: number, x2: number, y2: number, color: string];
	import { draggable } from '@neodrag/svelte';
</script>

<script lang="ts">
	import { onMount, tick, createEventDispatcher } from 'svelte';
	import type { Alignment, FontFamily, FontStyle, Mode } from '$lib/types';
	import { getLanguageName } from './lang';
	import { LL, locale } from '$i18n/i18n-svelte';
	import Word from './Word.svelte';

	const dispatch = createEventDispatcher<{
		connect: {
			connected: [number, number][];
			connectedIndex: number;
		};
		reorder: {
			from: number;
			to: number;
		};
		delete: {
			sentence: number;
		};
		modify: {
			sentence: number;
		};
		merge: {
			sentence: number;
			start: number;
			end: number;
		};
		split: {
			sentence: number;
			word: number;
			offset: number;
		};
	}>();

	type Sentence = [lang: string, words: string[]];

	// Data
	export let sentences: Sentence[];
	export let color_map: number[][];
	export let equivalency: number[][][];
	export let word_spans: HTMLSpanElement[][] = sentences.map(() => []);
	export let lines: Line[];
	export let colors: string[];

	// States
	export let modifying: number;
	export let loading: boolean;
	export let editingSelectionStart = -1;
	export let editingSelectionEnd = -1;

	// Parameters
	export let verticalGap: number;
	export let lineGap: number;
	export let straightLength: number;
	export let endpointCorrection: number;
	export let alignment: Alignment = 'center';
	export let fontFamily: FontFamily;
	export let fontStyle: FontStyle;
	export let fontSize: number;
	export let mode: Mode = 'view';

	export let output: HTMLOutputElement;
	let tokenEditDialog: HTMLDivElement;

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	$: if (mounted && equivalency && !loading) lines = drawLines(word_spans, equivalency, verticalGap, lineGap, straightLength, endpointCorrection);

	$: if (!loading && alignment && fontFamily && fontStyle && fontSize !== undefined && $locale)
		tick().then(() => {
			lines = drawLines(word_spans, equivalency, verticalGap, lineGap, straightLength, endpointCorrection);
		});

	function drawLines(
		word_spans: HTMLSpanElement[][],
		equivalency: number[][][],
		verticalGap: number,
		lineGap: number,
		straightLength: number,
		endpointCorrection: number
	): Line[] {
		const rectOutput = output.getBoundingClientRect();

		const lines: Line[] = [];

		if (sentences.length < 2) return [];

		for (let [i, entry] of equivalency.entries()) {
			for (let j = 0; j < entry.length - 1; j++) {
				const k = j + 1; // k = index of next sentence

				const [A, B] = [entry[j], entry[k]];
				if (!A || !B) continue;

				// A = [10]
				// B = [1, 2, 5]

				// segA = [[10, 10]]
				// segB = [[1, 2], [5, 5]]

				// carteA = [[[10, 10], [1, 2]], [[10, 10], [5, 5]]

				for (const [a1, a2] of segmentate(A)) {
					for (const [b1, b2] of segmentate(B)) {
						const [spanA1, spanA2, spanB1, spanB2] = [word_spans[j][a1], word_spans[j][a2], word_spans[k][b1], word_spans[k][b2]];
						if (!spanA1 || !spanA2 || !spanB1 || !spanB2) continue;
						const rectA1 = spanA1.getBoundingClientRect();
						const rectA2 = spanA2.getBoundingClientRect();
						const rectB1 = spanB1.getBoundingClientRect();
						const rectB2 = spanB2.getBoundingClientRect();

						let x1 = (rectA1.left + rectA2.right) / 2 - rectOutput.left;
						let y1 = Math.max(rectA1.bottom, rectA2.bottom) - rectOutput.top;
						let x2 = (rectB1.left + rectB2.right) / 2 - rectOutput.left;
						let y2 = Math.min(rectB1.top, rectB2.top) - rectOutput.top;

						const correction = endpointCorrection / ((y2 - y1) / (x2 - x1));
						x1 += correction;
						y1 += lineGap;
						x2 -= correction;
						y2 -= lineGap;

						const color = colors[i];
						lines.push([x1, y1 + straightLength, x2, y2 - straightLength, color]);

						if (straightLength !== 0) {
							lines.push([x1, y1, x1, y1 + straightLength, color]);
							lines.push([x2, y2, x2, y2 - straightLength, color]);
						}
					}
				}
			}
		}
		return lines;
	}

	function segmentate(arr: number[]): number[][] {
		const array = [...new Set(arr)].sort((a, b) => a - b);
		if (array.length === 0) return [];

		const result: number[][] = [];
		let segment: [start: number, end: number] = [array[0], array[0]];

		for (let i = 0; i <= array.length - 1; i++) {
			const [curr, next] = [array[i], array[i + 1]];

			if (curr + 1 === next) {
				segment = [segment[0], next];
			} else {
				result.push(segment);
				segment = [next, next];
			}
		}

		return result;
	}

	let connecting: [l: number, w: number][] = [];

	function isContent(word: string) {
		return !word.match(/^(\s|\p{P}+)$/u);
	}

	let connected: [l: number, w: number][] = [];
	let connectedIndex = -1;
	let tokenAnchor = -1;
	let selectedWordStart = -1;
	let selectedWordEnd = -1;

	// Dragging to reorder
	let draggingIndex = -1;
	let draggingPosition = { x: 0, y: 0 };
	let draggingOffset = { x: 0, y: 0 };
	let draggers: HTMLDivElement[] = [];

	function dragstart(l: number, e: PointerEvent) {
		draggingIndex = l;
		draggers[draggingIndex]?.setPointerCapture(e.pointerId);
		draggingPosition = { x: e.clientX, y: e.clientY };
	}

	function dragend(e: PointerEvent) {
		if (draggingIndex < 0) return;

		draggers[draggingIndex]?.releasePointerCapture(e.pointerId);

		let lastBottom = -1;
		for (const [i, dragger] of draggers.entries()) {
			const rect = dragger.getBoundingClientRect();
			const centerBetween = (rect.top - lastBottom) / 2;

			if (i !== draggingIndex && (i === 0 ? rect.top : centerBetween) <= e.clientY && rect.bottom >= e.clientY) {
				dispatch('reorder', {
					from: draggingIndex,
					to: i
				});
				break;
			}

			lastBottom = rect.bottom;
		}

		draggingIndex = -1;
		draggingOffset = { x: 0, y: 0 };
	}

	function onpointermove(e: PointerEvent) {
		if (draggingIndex >= 0) {
			draggingOffset.x = e.clientX - draggingPosition.x;
			draggingOffset.y = e.clientY - draggingPosition.y;
		}
	}

	function getTransform(l: number, draggingOffset: { x: number; y: number }) {
		if (draggingIndex !== l) return 'none';
		return `translate(${draggingOffset.x}px, ${draggingOffset.y}px)`;
	}

	function shouldKeepEditingSelection(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		if (tokenEditDialog?.contains(target)) return true;
		if (target.closest('.sentence.modifying .word')) return true;
		return false;
	}

	type GraphemeSegmenter = { segment(input: string): Iterable<{ segment: string }> };

	function segmentGraphemes(word: string): string[] {
		const Segmenter = (
			Intl as typeof Intl & {
				Segmenter?: new (locale: string, options: { granularity: 'grapheme' }) => GraphemeSegmenter;
			}
		).Segmenter;

		if (typeof Intl !== 'undefined' && typeof Segmenter !== 'undefined') {
			return Array.from(new Segmenter('und', { granularity: 'grapheme' }).segment(word), ({ segment }) => segment).filter(Boolean);
		}

		return Array.from(word);
	}

	function resetEditingWordSelection() {
		tokenAnchor = -1;
		selectedWordStart = -1;
		selectedWordEnd = -1;
	}

	$: if (modifying === -1) {
		resetEditingWordSelection();
	}

	$: if (
		modifying !== -1 &&
		editingSelectionStart !== -1 &&
		(selectedWordStart !== editingSelectionStart || selectedWordEnd !== editingSelectionEnd)
	) {
		tokenAnchor = editingSelectionStart;
		selectedWordStart = editingSelectionStart;
		selectedWordEnd = editingSelectionEnd;
	}

	$: editingWords = modifying === -1 ? [] : sentences[modifying]?.[1] ?? [];
	$: if (selectedWordStart !== -1 && selectedWordEnd >= editingWords.length) {
		resetEditingWordSelection();
	}

	function selectEditingWord(sentence: number, word: number) {
		if (sentence !== modifying) return;

		if (selectedWordStart === -1) {
			tokenAnchor = word;
			selectedWordStart = word;
			selectedWordEnd = word;
			return;
		}

		if (selectedWordStart === selectedWordEnd) {
			if (word === selectedWordStart) return;

			selectedWordStart = Math.min(tokenAnchor, word);
			selectedWordEnd = Math.max(tokenAnchor, word);
			return;
		}

		tokenAnchor = word;
		selectedWordStart = word;
		selectedWordEnd = word;
	}

	$: canMergeEditingWords = selectedWordStart !== -1 && selectedWordEnd > selectedWordStart;
	$: hasSingleSelectedWord = selectedWordStart !== -1 && selectedWordStart === selectedWordEnd;
	$: selectedWord = selectedWordStart !== -1 && selectedWordStart === selectedWordEnd ? editingWords[selectedWordStart] : '';
	$: selectedWordSegments = selectedWord && !selectedWord.match(/<[^>]+>/u) ? segmentGraphemes(selectedWord) : [];
	$: canSplitEditingWord = selectedWordSegments.length > 1;
	$: selectedWordCount = selectedWordStart === -1 ? 0 : selectedWordEnd - selectedWordStart + 1;
	$: canMergeSelectedWithPrev = hasSingleSelectedWord && selectedWordStart > 0;
	$: canMergeSelectedWithNext = hasSingleSelectedWord && selectedWordStart < editingWords.length - 1;
</script>

<svelte:window
	on:resize={async () => {
		await tick();
		lines = drawLines(word_spans, equivalency, verticalGap, lineGap, straightLength, endpointCorrection);
	}}
	on:pointerdown={(e) => {
		if (modifying === -1 || selectedWordStart === -1) return;
		if (shouldKeepEditingSelection(e.target)) return;
		resetEditingWordSelection();
	}}
	on:pointermove={onpointermove}
	on:pointerup={dragend}
/>

<output
	bind:this={output}
	class:dragging={draggingIndex !== -1}
	class:editing={mode === 'edit'}
	class:modifying-sentence={modifying !== -1}
	class:serif={fontFamily === 'serif'}
	class:sans-serif={fontFamily === 'sans-serif'}
	class:monospace={fontFamily === 'monospace'}
	class:italic={fontStyle === 'italic' || fontStyle === 'bold-italic'}
	class:bold={fontStyle === 'bold' || fontStyle === 'bold-italic'}
	style:gap={`${verticalGap}px 1em`}
	style:font-size={`${fontSize}px`}
>
	{#if !loading}
		{#each sentences as [lang, words], i}
			<div class="sentence" class:dragged={draggingIndex === i} class:modifying={modifying === i}>
				<div class="dragger action" on:pointerdown={(e) => dragstart(i, e)} bind:this={draggers[i]}>
					<iconify-icon icon="material-symbols:drag-indicator" width="1.2em" height="1.2em" />
				</div>
				<span class="tag" style:transform={getTransform(i, draggingOffset)}>{getLanguageName(lang, $locale)}</span>
				<span class="words" {lang} style:text-align={alignment} style:transform={getTransform(i, draggingOffset)}>
					{#each words as word, j}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<span
							class="word"
							class:content={isContent(word)}
							class:editing={mode === 'edit'}
							class:token-selected={i === modifying && selectedWordStart !== -1 && j >= selectedWordStart && j <= selectedWordEnd}
							class:connected={connecting.some(([l, w]) => l == i && w == j)}
							style:color={colors[color_map[i][j]]}
							on:click={() => {
								if (i === modifying) {
									selectEditingWord(i, j);
									return;
								}

								if (!isContent(word)) return;

								const entryIndex = color_map[i][j];

								if (mode === 'view') {
									mode = 'edit';

									if (entryIndex !== -1) {
										connected = [];
										for (let [i, words] of equivalency[entryIndex].entries()) {
											for (let word of words) {
												connected.push([i, word]);
											}
										}

										connecting = connected.map(([l, w]) => [l, w]);
										connectedIndex = entryIndex;
										return;
									}
								}

								if (connecting.some(([l, w]) => l == i && w == j)) {
									connecting = connecting.filter(([l, w]) => l != i || w != j);
								} else {
									connecting = [...connecting, [i, j]];
								}
							}}
							bind:this={word_spans[i][j]}
						>
							<Word {word} /></span
						>
					{/each}
				</span>
				<div class="modify action">
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<iconify-icon
						icon="material-symbols:edit-rounded"
						on:click={() => {
							dispatch('modify', {
								sentence: i
							});
						}}
					/>
				</div>
				<div class="delete action">
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<iconify-icon
						icon="ic:baseline-delete-forever"
						width="1.2em"
						height="1.2em"
						on:click={() => {
							if (!confirm($LL.confirm.deleteSentence())) return;
							dispatch('delete', {
								sentence: i
							});
						}}
					/>
				</div>
			</div>
		{/each}
		{#if modifying !== -1}
			<div class="token-edit-dialog visible" use:draggable bind:this={tokenEditDialog}>
				<div class="token-edit-topbar">
					<span class="token-edit-badge">{$LL.tokenEditor.tokens()}</span>
					{#if selectedWordCount > 0}
						<span class="token-edit-count">{selectedWordCount}</span>
					{/if}
				</div>
				{#if canMergeEditingWords || canSplitEditingWord}
					<div class="token-edit-actions">
						{#if canMergeEditingWords}
							<button
								type="button"
								class="token-action"
								on:click={() => {
									dispatch('merge', { sentence: modifying, start: selectedWordStart, end: selectedWordEnd });
									resetEditingWordSelection();
								}}
							>
								<iconify-icon icon="mdi:arrow-collapse-horizontal" inline="true" />
								{$LL.tokenEditor.mergeSelected()}
							</button>
						{/if}
					</div>
				{/if}
				{#if hasSingleSelectedWord}
					<div class="split-picker" aria-label={$LL.tokenEditor.splitAtBoundary()}>
						{#if canMergeSelectedWithPrev}
							<button
								type="button"
								class="split-point merge-point"
								on:click={() => {
									dispatch('merge', { sentence: modifying, start: selectedWordStart - 1, end: selectedWordStart });
									resetEditingWordSelection();
								}}
							>
								<iconify-icon icon="mdi:call-merge" inline="true" />
							</button>
						{/if}
						{#if canSplitEditingWord}
							{#each selectedWordSegments as segment, index}
								<span class="split-piece">{segment}</span>
								{#if index < selectedWordSegments.length - 1}
									<button
										type="button"
										class="split-point"
										on:click={() => {
											dispatch('split', {
												sentence: modifying,
												word: selectedWordStart,
												offset: selectedWordSegments.slice(0, index + 1).join('').length
											});
											resetEditingWordSelection();
										}}
									>
										<span class="split-glyph">|</span>
									</button>
								{/if}
							{/each}
						{:else}
							<span class="split-piece single-piece">{selectedWord}</span>
						{/if}
						{#if canMergeSelectedWithNext}
							<button
								type="button"
								class="split-point merge-point"
								on:click={() => {
									dispatch('merge', { sentence: modifying, start: selectedWordStart, end: selectedWordStart + 1 });
									resetEditingWordSelection();
								}}
							>
								<iconify-icon icon="mdi:call-merge" inline="true" />
							</button>
						{/if}
					</div>
				{:else if selectedWordCount === 0}
					<p class="token-edit-help">{$LL.tokenEditor.selectTokens()}</p>
				{/if}
			</div>
		{/if}
		<svg style="position: absolute;" width="100%" height="100%">
			{#each lines as [x1, y1, x2, y2, color]}
				<line {x1} {y1} {x2} {y2} stroke={color} stroke-width="1" />
			{/each}
		</svg>

		<div class="edit-dialog" use:draggable class:visible={mode === 'edit'}>
			<h2>{$LL.dialog.editing()}</h2>
			<button
				class="confirm fill"
				on:click={() => {
					dispatch('connect', { connected: [...connecting], connectedIndex });
					connecting = [];
					connectedIndex = -1;
					mode = 'view';
				}}
			>
				<iconify-icon icon="material-symbols:check" inline="true" />
				{$LL.dialog.confirm()}
			</button>
			<button
				class="cancel text"
				on:click={() => {
					connecting = [];
					mode = 'view';
				}}
			>
				<span>
					<iconify-icon icon="material-symbols:cancel" inline="true" />
					{$LL.dialog.cancel()}
				</span>
			</button>
		</div>
	{/if}
</output>

<style>
	.tag {
		font-weight: bold;
		text-align: center;
		margin-right: 2em;
	}

	.word.content:hover {
		background-color: #eee;
	}

	.word.editing:not(.connected) {
		background-color: #ccc;
	}
	.word.editing.connected {
		outline: 1px solid #e00000;
	}

	.word.token-selected {
		outline: 2px solid rgb(44 71 255 / 70%);
		background: rgb(44 71 255 / 12%);
		border-radius: 0.3em;
		box-shadow: 0 0 0 2px rgb(255 255 255 / 90%);
	}

	output {
		position: relative;

		display: grid;
		grid-template-columns: auto auto 1fr auto auto;
		gap: 1em;
		width: fit-content;
	}

	svg {
		pointer-events: none;
	}

	.edit-dialog {
		display: grid;
		grid-template-areas:
			't t'
			'y n';

		width: auto;
		text-align: center;

		gap: 1em;

		padding: 1em 2em;

		box-shadow: 1px 1px 5px 0 #ccc;

		background-color: rgb(44 71 255 / 3%);
		backdrop-filter: blur(5px);
		margin: 1em;

		cursor: move;

		position: absolute;

		visibility: hidden;

		z-index: 999;
	}

	.token-edit-dialog {
		display: grid;
		gap: 0.65em;
		padding: 0.7em 0.8em;
		min-height: 4.4em;
		border: 1px solid rgb(44 71 255 / 12%);
		border-radius: 0.9em;
		box-shadow: 0 14px 34px rgb(23 36 78 / 14%);
		background: linear-gradient(180deg, rgb(255 255 255 / 96%), rgb(246 249 255 / 92%));
		backdrop-filter: blur(10px);
		position: absolute;
		right: 1em;
		top: 1em;
		max-width: min(26em, calc(100% - 2em));
		z-index: 998;
		cursor: move;
	}

	.token-edit-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75em;
	}

	.token-edit-badge,
	.token-edit-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2em;
		padding: 0 0.7em;
		border-radius: 999px;
		font-size: 0.82em;
		font-weight: 700;
	}

	.token-edit-badge {
		background: rgb(44 71 255 / 10%);
		color: rgb(33 56 199);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.token-edit-count {
		min-width: 2em;
		background: rgb(24 33 61 / 7%);
		color: rgb(41 48 78);
	}

	.token-edit-actions {
		display: flex;
		gap: 0.5em;
		flex-wrap: wrap;
	}

	.token-action {
		appearance: none;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.28em 0.62em;
		border: 1px solid rgb(44 71 255 / 18%);
		border-radius: 999px;
		background: white;
		color: rgb(33 56 199);
		font: inherit;
		font-size: 0.86em;
		font-weight: 600;
	}

	.token-action:hover,
	.split-point:hover {
		background: rgb(44 71 255 / 8%);
	}

	.split-picker {
		display: flex;
		align-items: center;
		gap: 0.3em;
		flex-wrap: wrap;
		padding: 0.2em 0;
	}

	.split-piece {
		padding: 0.2em 0.45em;
		border-radius: 0.45em;
		background: rgb(44 71 255 / 9%);
		color: rgb(35 51 120);
	}

	.split-piece.single-piece {
		min-width: 1.8em;
		text-align: center;
	}

	.split-point {
		appearance: none;
		border: 1px solid rgb(44 71 255 / 35%);
		border-radius: 999px;
		background: white;
		color: rgb(44 71 255);
		padding: 0.15em 0.38em;
		line-height: 1;
	}

	.split-point.merge-point {
		background: rgb(44 71 255 / 5%);
		padding: 0.15em 0.38em;
	}

	.split-glyph {
		display: inline-block;
		font-weight: 700;
		transform: scaleY(1.15);
	}

	.token-edit-help {
		margin: 0;
		color: rgb(74 82 112);
		font-size: 0.88em;
	}

	@media (max-width: 700px) {
		.token-edit-dialog {
			left: 0.75em;
			right: 0.75em;
			top: auto;
			bottom: 0.75em;
			max-width: none;
		}

		.token-edit-topbar {
			gap: 0.5em;
		}
	}

	.edit-dialog.visible {
		visibility: visible;
	}

	.edit-dialog > h2 {
		grid-area: t;

		margin: 0;
		padding: 0.5em 0;
		text-align: center;
		width: 100%;

		font-size: 1.3em;
	}

	.edit-dialog > .confirm {
		grid-area: y;
	}

	.edit-dialog > .cancel {
		grid-area: n;
	}

	.sentence {
		display: contents;
	}

	.action {
		opacity: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.1em;
		width: 1.5em;
		height: 1.5em;
	}

	.action:hover {
		background-color: #eee;
	}

	.sentence:hover > .action {
		opacity: 1;
	}

	.editing .action {
		visibility: hidden;
	}

	.modifying-sentence .modify,
	.modifying-sentence .delete {
		visibility: hidden;
	}

	.dragger {
		cursor: move;
	}

	.delete {
		cursor: pointer;
		color: #e00020;
	}

	output.modifying-sentence {
		background-color: #eee;
	}

	output.modifying-sentence .sentence:not(.modifying) > .tag,
	output.modifying-sentence .sentence:not(.modifying) > .words,
	output.modifying-sentence svg {
		opacity: 0.3;
	}

	output.dragging {
		user-select: none;
	}

	output.dragging > svg {
		opacity: 0.5;
	}

	output.dragging > .sentence:not(.dragged) > * {
		opacity: 0.5;
	}

	.serif {
		font-family: serif;
	}

	.sans-serif {
		font-family: sans-serif;
	}

	.monospace {
		font-family: monospace;
	}

	.italic {
		font-style: italic;
	}

	.bold {
		font-weight: bold;
	}
</style>
