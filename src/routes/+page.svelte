<script lang="ts">
	import { pickNColors } from '../lib/color';
	import * as d3 from 'd3-color';
	import { onMount, setContext, tick } from 'svelte';
	import SentenceInput from '../lib/SentenceInput.svelte';

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
	let word_spans: HTMLSpanElement[][] = sentences.map(([, words]) => new Array(words.length).fill(null));

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

	// const max_words = Math.max(...WORDS.map((w) => w[1].length));
	$: colors = pickNColors(equivalency.length).map(([l, c, h]) => d3.lch(l, c, h).formatRgb());

	// LINE_COORDINATES

	let output: HTMLOutputElement;
	type Line = [x1: number, y1: number, x2: number, y2: number, color: string];
	let LINES: Line[] = [];

	function updateLines() {
		LINES = drawLines(word_spans, verticalGap, lineGap, center);
	}

	$: if (mounted)
		tick().then(() => {
			updateLines();
		});

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

		updateLines();

		console.log(equivalency);
	}
</script>

<svelte:window
	on:resize={async () => {
		await tick();
		updateLines();
	}}
/>

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

	<output bind:this={output} style={`gap: ${verticalGap}px 1em;`}>
		{#if mounted}
			{#each sentences as [lang, words], i}
				<span class="tag">{LANGUAGE_NAMES.of(lang)}</span>
				<span class="sentence" {lang} style={`text-align: ${center ? 'center' : 'start'}`}>
					{#each words as word, j}
						<span style={`color: ${color_map[i][j] >= 0 ? colors[color_map[i][j]] : 'none'}`} bind:this={word_spans[i][j]}>{word}</span>
					{/each}
				</span>
			{/each}
			<svg style="position: absolute;" width="100%" height="100%">
				{#each LINES as [x1, y1, x2, y2, color]}
					<line {x1} {y1} {x2} {y2} stroke={color} stroke-width="1" />
				{/each}
			</svg>
		{/if}
	</output>
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

	output {
		position: relative;

		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1em;
	}

	.tag {
		font-weight: bold;
	}
</style>
