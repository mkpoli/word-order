<script lang="ts" context="module">
	export type Line = [x1: number, y1: number, x2: number, y2: number, color: string];
	import { draggable } from '@neodrag/svelte';
</script>

<script lang="ts">
	import { onMount, tick, createEventDispatcher } from 'svelte';
	import type { Alignment, FontFamily, FontStyle, Mode } from '$lib/types';
	import { cartesian, segmentate } from './array';
	import { getLanguageName } from './lang';
	import { LL, locale } from '$i18n/i18n-svelte';
	import { parseRuby, rubyRule } from './ruby';

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

				for (let [[a1, a2], [b1, b2]] of cartesian(segmentate(A), segmentate(B))) {
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
					lines.push([x1, y1 + straightLength, x2, y2 - straightLength, color] as Line);

					if (straightLength !== 0) {
						lines.push([x1, y1, x1, y1 + straightLength, color] as Line);
						lines.push([x2, y2, x2, y2 - straightLength, color] as Line);
					}
				}
			}
		}
		return lines;
	}

	let connecting: [l: number, w: number][] = [];

	function isContent(word: string) {
		return !word.match(/^(\s|\p{P}+)$/u);
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
		lines = drawLines(word_spans, equivalency, verticalGap, lineGap, straightLength, endpointCorrection);
	}}
	on:pointermove={onpointermove}
	on:pointerup={dragend}
/>

<output
	inert={modifying === -1 ? undefined : true}
	bind:this={output}
	class:dragging={draggingIndex !== -1}
	class:editing={mode === 'edit'}
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
							bind:this={word_spans[i][j]}
						>
							{#each word.split(rubyRule) as part}
								{#if part.match(rubyRule)}{@const { rb, rt } = parseRuby(part)}<ruby>{rb}<rt>{rt}</rt></ruby>{:else}{part}{/if}{/each}</span
						>
					{/each}
				</span>
				<div class="modify action">
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

	.dragger {
		cursor: move;
	}

	.delete {
		cursor: pointer;
		color: #e00020;
	}

	output[inert] {
		background-color: #eee;
	}

	output[inert] .sentence:not(.modifying) > .tag,
	output[inert] .sentence:not(.modifying) > .words,
	output[inert] svg {
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
