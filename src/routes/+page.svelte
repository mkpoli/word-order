<script lang="ts">
	import { pickNColors } from '../lib/color';
	import * as d3 from 'd3-color';
	import { onMount, tick } from 'svelte';
	import SentenceInput from '../lib/SentenceInput.svelte';
	import 'iconify-icon';

	import { LL } from '../i18n/i18n-svelte';

	import Output, { type Line } from '../lib/Output.svelte';
	import type { Alignment, FontFamily, FontStyle, Mode } from '$lib/types';

	import Parameters from '$lib/Parameters.svelte';

	// const SENTENCES = [
	// 	['en', "I can eat glass and it doesn't hurt me."],
	// 	['zh', '我能吞下玻璃而不傷身體。'],
	// 	['ja', '私はガラスを食べられます。それは私を傷つけません。']
	// ];

	let sentences: [string, string[]][] = [
		['en', ['I', ' ', 'can', ' ', 'eat', ' ', 'glass', ' ', 'and', ' ', 'it', ' ', "doesn't", ' ', 'hurt', ' ', 'me', '.']],
		['zh', ['我', '能', '吞下', '玻璃', '而', '不', '伤', '身体', '。']],
		['zh-HanT', ['我', '能', '吞下', '玻璃', '而', '不', '傷', '身體', '。']],
		['ja', ['私', 'は', 'ガラス', 'を', '食べ', 'れます', '。', 'それ', 'は', '私', 'を', '傷つけ', 'ません', '。']]
	];

	let equivalency: number[][][] = [
		[[0], [0], [0], [0, 1]],
		[[2], [1], [1], [5]],
		[[4], [2], [2], [4]],
		[[6], [3], [3], [2, 3]],
		[[8], [4], [4], []],
		[[10], [], [], [7, 8]],
		[[12], [5], [5], [12]],
		[[14], [6], [6], [11]],
		[[16], [], [], [9, 10]],
		[[], [7], [7], []]
	];

	let mode: Mode = 'view';

	let color_map: number[][] = [];
	let word_spans: HTMLSpanElement[][];

	// Parameters
	let verticalGap: number;
	let lineGap: number;
	let straightLength: number;
	let alignment: Alignment;
	let fontFamily: FontFamily;
	let fontStyle: FontStyle;
	let fontSize: number;

	let mounted = false;
	onMount(() => {
		const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
		verticalGap = Math.round(2 * rem);
		lineGap = Math.round(0.3 * rem);

		mounted = true;
	});

	$: if (mounted) calculate_color_map(equivalency);
	function calculate_color_map(equivalency: number[][][]) {
		color_map = sentences.map(([, words]) => new Array(words.length).fill(-1));
		for (let [i, entry] of equivalency.entries()) {
			for (let [j, words] of entry.entries()) {
				for (let word of words) {
					// i -> index of equivalency entries (color_id)
					// j -> index of language sentences (lang_id)
					color_map[j][word] = i;
				}
			}
		}
		color_map = color_map;
	}

	$: colors = pickNColors(equivalency.length).map(([l, c, h]) => d3.lch(l, c, h).formatRgb());

	// LINE_COORDINATES

	let lines: Line[] = [];

	async function onadd({ detail: { lang, words } }: CustomEvent<{ lang: string; words: string[] }>): Promise<void> {
		sentences.push([lang, words] as [string, string[]]);
		sentences = sentences;

		color_map = [...color_map, new Array(words.length).fill(-1)];
		word_spans = [...word_spans, new Array(words.length).fill(null)];

		for (const [i, entry] of equivalency.entries()) {
			equivalency[i] = [...entry, []];
		}
		equivalency = equivalency;

		await tick();
	}

	function onconnect({ detail: { connected, connectedIndex } }: CustomEvent<{ connected: [number, number][]; connectedIndex: number }>) {
		const grouped: number[][] = sentences.map(() => []);
		connected.forEach(([a, b]) => {
			grouped[a].push(b);
		});

		if (grouped.every((entry) => entry.length === 0)) {
			equivalency.splice(connectedIndex, 1);
		} else {
			if (connectedIndex === -1) {
				if (grouped.length !== 0) {
					equivalency.push(grouped);
				}
			} else {
				equivalency[connectedIndex] = grouped;
			}
		}

		equivalency = equivalency;
	}
</script>

<main>
	<div class="output">
		{#if mounted}
			<Output
				{sentences}
				{color_map}
				{equivalency}
				{alignment}
				bind:lines
				{colors}
				{verticalGap}
				{lineGap}
				{straightLength}
				{fontFamily}
				{fontStyle}
				{fontSize}
				bind:word_spans
				bind:mode
				on:connect={onconnect}
				on:reorder={({ detail: { from, to } }) => {
					const [lang, words] = sentences[from];
					sentences.splice(from, 1);
					sentences.splice(to, 0, [lang, words]);
					sentences = sentences;

					for (const [i, entry] of equivalency.entries()) {
						const value = entry[from];
						entry.splice(from, 1);
						entry.splice(to, 0, value);
						equivalency[i] = entry;
					}
					equivalency = equivalency;
				}}
				on:delete={({ detail: { sentence } }) => {
					sentences.splice(sentence, 1);
					sentences = sentences;

					for (const [i, entry] of equivalency.entries()) {
						entry.splice(sentence, 1);
						equivalency[i] = entry;
					}
					equivalency = equivalency;
				}}
			/>
		{/if}
	</div>

	<div class="input">
		<SentenceInput on:add={onadd} />
	</div>

	<div class="params">
		<Parameters bind:verticalGap bind:lineGap bind:straightLength bind:alignment bind:fontFamily bind:fontStyle bind:fontSize />
	</div>

	<div class="equivalency">
		{#each equivalency as entry, i}
			<div class="equivalency" style={`color: ${colors[i]}`}>
				{#each entry as words, j}
					<span class="words">
						{#if words.length === 0}
							<span class="word">❌</span>
						{:else}
							{#each words as k}
								<span class="word">{sentences[j][1][k]}</span>
							{/each}
						{/if}
					</span>
				{/each}
			</div>
		{/each}
	</div>
</main>

<svelte:head>
	<title>Word Order Illustrator</title>
</svelte:head>

<footer>
	<p>
		Word Order Illustrator (
		<a href="https://github.com/mkpoli/word-order/" title="Github Repository"><iconify-icon icon="logos:github-icon" inline="true" /></a>,
		<a href="https://twitter.com/mkpoli/status/1562786122782380036" title="Anounce Tweet"><iconify-icon icon="logos:twitter" inline="true" /></a>) by
		@mkpoli (
		<a href="https://twitter.com/mkpoli/"><iconify-icon icon="logos:twitter" inline="true" /></a>,
		<a href="https://mkpo.li/"><iconify-icon icon="mdi:home" inline="true" /></a>
		)
	</p>
	<p>
		{@html $LL.footer.info({ license: '<iconify-icon icon="ri:creative-commons-zero-line" inline="true"></iconify-icon> (CC0) ' })}
	</p>
</footer>

<style>
	:root {
		--color-accent: rgb(44 71 255);
		accent-color: var(--color-accent);
	}

	main {
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 2em 1em;
		display: grid;
		grid-template-columns: auto;
	}

	footer {
		text-align: center;
		padding: 1em;

		color: #444;
		max-width: 1024px;
		margin: 0 auto;
	}

	.params {
		display: grid;
		grid-template-columns: auto auto;
		gap: 1em;
	}

	/* Layout */

	@media (min-width: 1024px) {
		main {
			grid-template: auto auto / auto auto auto;
		}

		.params {
			grid-column: 1;
			grid-row: 3;
		}

		.input {
			grid-column: 2;
			grid-row: 3;
		}

		.output {
			grid-column: 1 / 3;
			grid-row: 1;
		}

		.equivalency {
			grid-column: 3;
			grid-row: 1 / -1;
		}
	}

	.words:not(:last-of-type)::after {
		content: '＝';
	}

	.word:not(:last-of-type)::after {
		content: '|';
	}
</style>
