<script lang="ts" context="module">
	export type Line = [x1: number, y1: number, x2: number, y2: number, color: string];
</script>

<script lang="ts">
	import { onMount, tick, createEventDispatcher } from 'svelte';
	import type { Alignment, Mode } from '../lib/types';
	import { cartesian, segmentate } from './array';
	import Draggable from './Draggable.svelte';
	import { getLanguageName } from './lang';

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
	}>();

	type Sentence = [lang: string, words: string[]];
	export let sentences: Sentence[];
	export let color_map: number[][];
	export let equivalency: number[][][];
	export let word_spans: HTMLSpanElement[][] = sentences.map(([, words]) => new Array(words.length).fill(null));
	export let alignment: Alignment = 'center';
	export let lines: Line[];
	export let colors: string[];
	export let verticalGap: number;
	export let lineGap: number;
	export let mode: Mode = 'view';

	let output: HTMLOutputElement;

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	$: if (mounted && equivalency) lines = drawLines(word_spans, equivalency, verticalGap, lineGap);

	$: if (alignment)
		tick().then(() => {
			lines = drawLines(word_spans, equivalency, verticalGap, lineGap);
		});

	function drawLines(word_spans: HTMLSpanElement[][], equivalency: number[][][], verticalGap: number, lineGap: number): Line[] {
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

				for (let [[a1, a2], [b1, b2]] of cartesian(segmentate(A), segmentate(B))) {
					const [spanA1, spanA2, spanB1, spanB2] = [word_spans[j][a1], word_spans[j][a2], word_spans[k][b1], word_spans[k][b2]];
					if (!spanA1 || !spanA2 || !spanB1 || !spanB2) continue;
					const rectA1 = spanA1.getBoundingClientRect();
					const rectA2 = spanA2.getBoundingClientRect();
					const rectB1 = spanB1.getBoundingClientRect();
					const rectB2 = spanB2.getBoundingClientRect();

					const x1 = (rectA1.left + rectA2.left - rectOutput.left) / 2;
					const y1 = rectA1.bottom - rectOutput.top + lineGap;
					const x2 = (rectB1.left + rectB2.left - rectOutput.left) / 2;
					const y2 = rectB1.top - rectOutput.top - lineGap;
					const color = colors[i];
					lines.push([x1, y1, x2, y2, color] as Line);
				}
			}
		}
		return lines;
	}

	let connecting: [l: number, w: number][] = [];

	function isContent(word: string) {
		return !word.match(/^\s|\p{P}+$/u);
	}

	let connected: [l: number, w: number][] = [];
	let connectedIndex = -1;

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
</script>

<svelte:window
	on:resize={async () => {
		await tick();
		lines = drawLines(word_spans, equivalency, verticalGap, lineGap);
	}}
	on:pointermove={onpointermove}
	on:pointerup={dragend}
/>

<output bind:this={output} style={`gap: ${verticalGap}px 1em;`} class:dragging={draggingIndex !== -1}>
	{#each sentences as [lang, words], i}
		<div class="sentence" class:dragged={draggingIndex === i}>
			<div class="dragger" on:pointerdown={(e) => dragstart(i, e)} bind:this={draggers[i]}>
				<iconify-icon icon="material-symbols:drag-indicator" width="1.2em" height="1.2em" />
			</div>
			<span class="tag" style:transform={getTransform(i, draggingOffset)}>{getLanguageName(lang)}</span>
			<span class="words" {lang} style:text-align={alignment} style:transform={getTransform(i, draggingOffset)}>
				{#each words as word, j}
					<span
						class="word"
						class:content={isContent(word)}
						class:editing={mode === 'edit'}
						class:connected={connecting.some(([l, w]) => l == i && w == j)}
						style={`color: ${color_map[i][j] >= 0 ? colors[color_map[i][j]] : 'none'}`}
						on:click={() => {
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
						bind:this={word_spans[i][j]}>{word}</span
					>
				{/each}
			</span>
			<div class="delete">
				<iconify-icon
					icon="ic:baseline-delete-forever"
					width="1.2em"
					height="1.2em"
					on:click={() => {
						if (!confirm('Are you sure you want to delete this sentence?')) return;
						dispatch('delete', {
							sentence: i
						});
					}}
				/>
			</div>
		</div>
	{/each}
	<svg style="position: absolute;" width="100%" height="100%">
		{#each lines as [x1, y1, x2, y2, color]}
			<line {x1} {y1} {x2} {y2} stroke={color} stroke-width="1" />
		{/each}
	</svg>

	<Draggable top={50} left={150}>
		{#if mode === 'edit'}
			<div class="edit-dialog">
				<div>Editing</div>
				<button
					class="confirm"
					on:click={() => {
						dispatch('connect', { connected: [...connecting], connectedIndex });
						connecting = [];
						connectedIndex = -1;
						mode = 'view';
					}}
				>
					Confirm
				</button>
				<button
					class="cancel"
					on:click={() => {
						connecting = [];
						mode = 'view';
					}}
				>
					Cancel
				</button>
			</div>
		{/if}
	</Draggable>
</output>

<style>
	.tag {
		font-weight: bold;
		text-align: center;
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

	output {
		position: relative;

		display: grid;
		grid-template-columns: auto auto 1fr auto;
		gap: 1em;
	}

	svg {
		pointer-events: none;
	}

	.edit-dialog {
		display: grid;
		grid-template-areas:
			't t'
			'y n';

		width: 8em;
		margin: 0 auto;
		text-align: center;

		gap: 1em;

		padding: 1em 2em;

		box-shadow: 1px 1px 5px 0 #ccc;

		background-color: rgba(242, 239, 255, 0.5);
		backdrop-filter: blur(4px);
		margin: 1em;

		position: absolute;
	}

	.edit-dialog > div {
		grid-area: t;
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

	.dragger,
	.delete {
		opacity: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.1em;
	}

	.sentence:hover > .dragger,
	.sentence:hover > .delete {
		opacity: 1;
	}

	.dragger {
		cursor: move;
	}

	.delete {
		cursor: pointer;
		color: #e00020;
	}

	.dragger:hover {
		background-color: #eee;
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
</style>
