<script lang="ts" context="module">
	export type Line = [x1: number, y1: number, x2: number, y2: number, color: string];
</script>

<script lang="ts">
	import { cartesian, segmentate } from './array';

	type Sentence = [lang: string, words: string[]];
	const LANGUAGE_NAMES = getContext<Intl.DisplayNames>('LANGUAGE_NAMES');
	export let sentences: Sentence[];
	export let color_map: number[][];
	export let equivalency: number[][][];
	export let word_spans: HTMLSpanElement[][] = sentences.map(([, words]) => new Array(words.length).fill(null));
	export let center: boolean;
	export let lines: Line[];
	export let colors: string[];
	export let verticalGap: number;
	export let lineGap: number;

	let output: HTMLOutputElement;

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	$: if (mounted && equivalency) lines = drawLines(word_spans, equivalency, verticalGap, lineGap, center);

	function drawLines(word_spans: HTMLSpanElement[][], equivalency: number[][][], verticalGap: number, lineGap: number, center: boolean): Line[] {
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
</script>

<svelte:window
	on:resize={async () => {
		await tick();
		lines = drawLines(word_spans, verticalGap, lineGap, center);
	}}
/>

<output bind:this={output} style={`gap: ${verticalGap}px 1em;`}>
	{#each sentences as [lang, words], i}
		<span class="tag">{LANGUAGE_NAMES.of(lang)}</span>
		<span class="sentence" {lang} style={`text-align: ${center ? 'center' : 'start'}`}>
			{#each words as word, j}
				<span style={`color: ${color_map[i][j] >= 0 ? colors[color_map[i][j]] : 'none'}`} bind:this={word_spans[i][j]}>{word}</span>
			{/each}
		</span>
	{/each}
	<svg style="position: absolute;" width="100%" height="100%">
		{#each lines as [x1, y1, x2, y2, color]}
			<line {x1} {y1} {x2} {y2} stroke={color} stroke-width="1" />
		{/each}
	</svg>
</output>

<style>
	.tag {
		font-weight: bold;
		text-align: center;
	}

	output {
		position: relative;

		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1em;
	}
</style>