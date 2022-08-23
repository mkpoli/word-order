<script lang="ts">
	import { pickNColors } from '../lib/color';
	import * as d3 from 'd3-color';
	import { onMount, setContext, tick } from 'svelte';
	import SentenceInput from '../lib/SentenceInput.svelte';

	import Output, { type Line } from '../lib/Output.svelte';

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
		['en', ['I ', 'can ', 'eat ', 'glass ', 'and ', 'it ', "doesn't ", 'hurt ', 'me']],
		['zh', ['我', '能', '吞下', '玻璃', '而', '不', '伤', '身体']],
		['zh-HanT', ['我', '能', '吞下', '玻璃', '而', '不', '傷', '身體']],
		['ja', ['私', 'は', 'ガラス', 'を', '食べ', 'れます', '。', 'それ', 'は', '私', 'を', '傷つけ', 'ません', '。']]
	];

	let equivalency: ([start: number, end: number] | null)[][] = [
		[
			[0, 0], // 'I '
			[0, 0], // '我'
			[0, 0], // '我'
			[0, 1] // '私'， 'は'
		],
		[
			[1, 1], // 'can '
			[1, 1], // '能'
			[1, 1], // '能'
			[5, 5] // 'れます'
		],
		[
			[2, 2], // 'eat '
			[2, 2], // '吞下'
			[2, 2], // '吞下'
			[4, 4] // '食べ'
		],
		[
			[3, 3], // 'glass '
			[3, 3], // '玻璃'
			[3, 3], // '玻璃'
			[2, 3] // 'ガラスを'
		],
		[
			[4, 4], // 'and '
			[4, 4], // '而'
			[4, 4], // '而'
			null //
		],
		[
			[5, 5], // 'it '
			null,
			null,
			[7, 8] // 'それは'
		],
		[
			[6, 6], // 'doesn't '
			[5, 5], // '不'
			[5, 5], // '不'
			[12, 12] // 'ません'
		],
		[
			[7, 7], // 'hurt '
			[6, 6], // '伤'
			[6, 6], // '傷'
			[11, 11] // '傷つけ'
		],
		[
			[8, 8], // 'me'
			null,
			null,
			[9, 10] // '私', 'を'
		],
		[
			null,
			[7, 7], // '身體'
			[7, 7], // '身體'
			null
		]
	];

	let color_map: number[][] = sentences.map(([, words]) => new Array(words.length).fill(-1));
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

	function calculate_color_map(equivalency: ([start: number, end: number] | null)[][]) {
		equivalency.forEach((row, i) => {
			row.forEach((entry, j) => {
				if (!entry) return;
				const [a, b] = entry;
				for (let k = a; k <= b; k++) {
					color_map[j][k] = i;
				}
			});
		});
	}
	$: colors = pickNColors(equivalency.length).map(([l, c, h]) => d3.lch(l, c, h).formatRgb());

	// LINE_COORDINATES

	let lines: Line[] = [];

	async function onadd({ detail: { lang, words } }: CustomEvent<{ lang: string; words: string[] }>): Promise<void> {
		sentences.push([lang, words] as [string, string[]]);
		sentences = sentences;

		color_map = [...color_map, new Array(words.length).fill(-1)];
		word_spans = [...word_spans, new Array(words.length).fill(null)];

		equivalency.forEach((row, i) => {
			equivalency[i] = [...row, null];
		});
		equivalency = equivalency;

		await tick();
		console.log(equivalency);
	}
</script>

<main>
	<div class="panel">
		<div class="params">
			<label for="vertical-gap">Vertical Gap: ({verticalGap}px)</label>
			<input type="range" bind:value={verticalGap} id="vertical-gap" name="vertical-gap" min="0" max="100" />
			<label for="line-gap">Line Gap: ({lineGap}px)</label>
			<input type="range" bind:value={lineGap} id="line-gap" name="line-gap" min="-5" max={verticalGap / 2} />
			<label for="center">Centering</label>
			<input type="checkbox" bind:checked={center} id="center" name="center" />
		</div>
		<div class="input">
			<SentenceInput on:add={onadd} />
		</div>
	</div>

	{#if mounted}
		<Output {sentences} {color_map} {equivalency} {center} bind:lines {colors} {verticalGap} {lineGap} bind:word_spans />
	{/if}
</main>

<style>
	main {
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 2em;
	}

	.panel {
		display: flex;
		gap: 1em;
	}

	.params {
		padding: 1.5em 1em;
		border-radius: 5px;
		box-shadow: 1px 1px 5px 0 #ccc;

		display: flex;
		flex-direction: column;
	}
</style>
