<script lang="ts">
	import { lch2rgb, pickNColors } from '$lib/color';
	import { onMount, tick } from 'svelte';

	import 'iconify-icon';

	import { LL } from '../i18n/i18n-svelte';

	import type { Alignment, FontFamily, FontStyle, Mode } from '$lib/types';

	// Components
	import Equivalency from '$lib/Equivalency.svelte';
	import Output, { type Line } from '../lib/Output.svelte';
	import Parameters from '$lib/Parameters.svelte';
	import SentenceInput from '$lib/SentenceInput.svelte';
	import { save, open } from '$lib/file';

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

	// Prevent empty entry from existing
	$: equivalency = equivalency.filter((entry) => !entry.every((sentence) => sentence.length === 0));

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

	$: colors = pickNColors(equivalency.length).map(lch2rgb);

	// LINE_COORDINATES

	let lines: Line[] = [];

	async function onsubmit({ detail: { lang, words } }: CustomEvent<{ lang: string; words: string[] }>): Promise<void> {
		if (modifying !== -1) {
			// Modifying existing sentence
			sentences[modifying] = [lang, words];

			if (!words.every((word, i) => word === wordsBeforeModify[i])) {
				// If modified words, clear the equivalency
				for (const [i, entry] of equivalency.entries()) {
					entry[modifying] = [];
				}
			}

			modifying = -1;
			wordsBeforeModify = [];
		} else {
			// Adding new sentence
			sentences.push([lang, words]);
			color_map = [...color_map, new Array(words.length).fill(-1)];
			word_spans = [...word_spans, new Array(words.length).fill(null)];

			for (const [i, entry] of equivalency.entries()) {
				equivalency[i] = [...entry, []];
			}
		}
		sentences = sentences;
		equivalency = equivalency;

		await tick();
	}

	function onconnect({ detail: { connected, connectedIndex } }: CustomEvent<{ connected: [number, number][]; connectedIndex: number }>) {
		// grouped[sentence_id][word_id]
		const grouped: number[][] = sentences.map(() => []);
		connected.forEach(([a, b]) => {
			grouped[a].push(b);
		});

		if (grouped.every((entry) => entry.length === 0)) {
			// Remove entry if all words in that are removed
			equivalency.splice(connectedIndex, 1);
		} else {
			if (connectedIndex !== -1) {
				// If connectedFrom an existing entry, replace it with [...connected, ...new]
				equivalency[connectedIndex] = grouped;
			} else {
				// If starting from a new entry, find all existing entries of all connected words
				const entries = [...new Set(grouped.flatMap((words, i) => words.map((word) => color_map[i][word])).filter((word) => word !== -1))];

				if (entries.length === 1) {
					// Found only 1, add new one to old one
					equivalency[entries[0]] = equivalency[entries[0]].map((words, i) => [...words, ...grouped[i]]);
				} else {
					// Remove duplicate words in previous entries
					for (const [i, entry] of equivalency.entries()) {
						for (const [j, words] of entry.entries()) {
							for (const word of grouped[j]) {
								equivalency[i][j] = words.filter((w) => w !== word);
							}
						}
					}

					// Add new entry
					equivalency.push(grouped);
				}
			}
		}

		equivalency = equivalency;
	}

	let modifying = -1;
	let wordsBeforeModify: string[] = [];

	async function load(data: { equivalency: number[][][]; sentences: [string, string[]][] }) {
		sentences = data.sentences;
		equivalency = data.equivalency;
	}
</script>

<header class="menu">
	<button
		on:click={() => {
			if (!confirm($LL.confirm.new())) return;

			sentences = [];
			equivalency = [];
		}}>{$LL.menu.new()}</button
	>
	<button
		on:click={() => {
			const data = {
				sentences: sentences,
				equivalency: equivalency
			};
			save(data);
		}}>{$LL.menu.export()}</button
	>
	<button
		on:click={() => {
			open(load);
		}}>{$LL.menu.import()}</button
	>
</header>

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
				{modifying}
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
				on:modify={({ detail: { sentence } }) => {
					modifying = sentence;
					wordsBeforeModify = sentences[sentence][1];
				}}
			/>
		{/if}
	</div>

	<div class="input">
		<SentenceInput on:submit={onsubmit} {modifying} {sentences} />
	</div>

	<div class="params">
		<Parameters bind:verticalGap bind:lineGap bind:straightLength bind:alignment bind:fontFamily bind:fontStyle bind:fontSize />
	</div>

	<div class="equivalency">
		<Equivalency
			{sentences}
			{equivalency}
			{colors}
			on:reorder={({ detail: { from, to } }) => {
				const entry = equivalency[from];
				equivalency.splice(from, 1);
				equivalency.splice(to, 0, entry);
				equivalency = equivalency;
			}}
		/>
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
	main {
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 2em 1em;
		/* display: grid;
		grid-template-columns: auto; */
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
		grid-template-columns: 1fr 1fr;
		gap: 1em;
	}

	.equivalency {
		display: flex;
		gap: 0.7em;
		height: fit-content;
		padding: 1em;
		justify-content: center;
	}

	.output {
		padding: 0;
		display: flex;
		justify-content: center;
	}

	/* Layout */

	@media (min-width: 1024px) {
		main {
			display: grid;
			grid-template-areas:
				'o o o'
				'p i e';
		}

		.params {
			grid-area: p;
		}

		.input {
			grid-area: i;
		}

		.output {
			grid-area: o;
		}

		.equivalency {
			grid-area: e;
		}
	}

	.menu {
		display: flex;
		gap: 1em;
		padding: 1em;
		justify-content: center;
	}

	.menu button {
		appearance: none;
		padding: 0.5em 1em;
		font-size: 1.2rem;
		border: none;
		border-radius: 0.2em;

		background-color: white;

		box-shadow: 1px 1px 5px 0 #ccc;
	}

	.menu button:hover {
		background-color: #eee;
	}
</style>
