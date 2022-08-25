<script lang="ts">
	import { pickNColors } from '../lib/color';
	import * as d3 from 'd3-color';
	import { onMount, setContext, tick } from 'svelte';
	import SentenceInput from '../lib/SentenceInput.svelte';
	import 'iconify-icon';

	import Output, { type Line } from '../lib/Output.svelte';
	import type { Mode } from '$lib/types';

	const LANGUAGE_NAMES = new Intl.DisplayNames(['en'], {
		type: 'language'
	});

	setContext('LANGUAGE_NAMES', LANGUAGE_NAMES);

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
	let verticalGap = 30;
	let lineGap = 5;
	let center = true;

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
	<div class="params">
		<label for="vertical-gap">
			<iconify-icon icon="mdi:arrow-expand-vertical" inline="true" />
			Vertical Gap ({verticalGap}px)
		</label>
		<input type="range" bind:value={verticalGap} id="vertical-gap" name="vertical-gap" min="0" max="100" />
		<label for="line-gap">
			<iconify-icon icon="mdi:arrow-split-horizontal" inline="true" />
			Line Gap ({lineGap}px)
		</label>
		<input type="range" bind:value={lineGap} id="line-gap" name="line-gap" min="-5" max={verticalGap / 2} />
		<label for="center">
			<iconify-icon icon="majesticons:text-align-center-line" inline="true" />
			Centering
		</label>
		<input type="checkbox" bind:checked={center} id="center" name="center" />
	</div>

	<div class="input">
		<SentenceInput on:add={onadd} />
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

	<div class="output">
		{#if mounted}
			<Output
				{sentences}
				{color_map}
				{equivalency}
				{center}
				bind:lines
				{colors}
				{verticalGap}
				{lineGap}
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
</main>

<style>
	main {
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 2em 1em;
		display: grid;
		grid-template: auto auto / auto auto auto;
	}

	.params {
		max-width: 12em;

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

		padding: 1em;
	}

	.equivalency {
		grid-column: 3;
		grid-row: 1 / -1;
	}

	@media (max-width: 720px) {
		main {
			grid-template: auto auto auto / auto 1fr;
		}

		.output {
			grid-column: 1 / 3;
			grid-row: 1;
		}

		.input {
			grid-column: 1 / 3;
			grid-row: 2;
		}

		.params {
			grid-column: 1;
			grid-row: 3;
		}

		.equivalency {
			grid-column: 2;
			grid-row: 3;
		}
	}

	.params {
		padding: 1.5em 1em;
		border-radius: 5px;
		box-shadow: 1px 1px 5px 0 #ccc;

		display: flex;
		flex-direction: column;
	}

	.words:not(:last-of-type)::after {
		content: '＝';
	}

	.word:not(:last-of-type)::after {
		content: '|';
	}
</style>
