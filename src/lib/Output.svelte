<script lang="ts" context="module">
	export type Line = [x1: number, y1: number, x2: number, y2: number, color: string];
</script>

<script lang="ts">
	import { getContext, onMount } from 'svelte';

	type Sentence = [lang: string, words: string[]];
	const LANGUAGE_NAMES = getContext<Intl.DisplayNames>('LANGUAGE_NAMES');
	export let sentences: Sentence[];
	export let color_map: number[][];
	export let equivalency: ([start: number, end: number] | null)[][];
	export let word_spans: HTMLSpanElement[][] = sentences.map(([, words]) => new Array(words.length).fill(null));
	export let center: boolean;
	export let lines: Line[];
	export let colors: string[];

	onMount(() => {});
</script>

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
