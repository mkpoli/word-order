<script lang="ts" context="module">
	export type Line = [x1: number, y1: number, x2: number, y2: number, color: string];
</script>

<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';

	type Sentence = [lang: string, words: string[]];
	const LANGUAGE_NAMES = getContext<Intl.DisplayNames>('LANGUAGE_NAMES');
	export let sentences: Sentence[];
	export let color_map: number[][];
	export let equivalency: ([start: number, end: number] | null)[][];
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

	$: if (mounted) lines = drawLines(word_spans, verticalGap, lineGap, center);

	function drawLines(word_spans: HTMLSpanElement[][], verticalGap: number, lineGap: number, center: boolean): Line[] {
		const rectOutput = output.getBoundingClientRect();

		const lines = [];

		if (sentences.length < 2) return [];

		for (let [i, entry] of equivalency.entries()) {
			if (!entry) continue;
			if (entry.length < 1) break;

			for (let [j, A] of entry.entries()) {
				if (j == entry.length - 1) break;
				const B = entry[j + 1];
				if (!A || !B) continue;

				// console.log(`(${WORDS[j][0]}) ${WORDS[j][1][A[0]]} → (${WORDS[j + 1][0]}) ${WORDS[j + 1][1][B[0]]}`);

				const spanA = word_spans[j][A[0]];
				const spanB = word_spans[j + 1][B[0]];

				if (!spanA || !spanB) continue;

				const rectA = spanA.getBoundingClientRect();
				const rectB = spanB.getBoundingClientRect();

				const centerA = {
					x: rectA.left - rectOutput.left + rectA.width / 2,
					y: rectA.top - rectOutput.top + rectA.height / 2
				};

				const centerB = {
					x: rectB.left - rectOutput.left + rectB.width / 2,
					y: rectB.top - rectOutput.top + rectB.height / 2
				};

				lines.push([
					rectA.left - rectOutput.left + rectA.width / 2,
					rectA.bottom - rectOutput.top + lineGap,
					rectB.left - rectOutput.left + rectB.width / 2,
					rectB.top - rectOutput.top - lineGap,
					colors[i]
				] as Line);
			}
			// break;
			// for (let [l, r] of entry) {
			// }

			// [ [0, 0], // 'I ' [0, 0], // '我' [0, 0], // '我' [0, 1] // '私'， 'は' ],
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
