<script lang="ts">
	import { oklchToHex, pickNColors } from '$lib/color';
	import { onMount, tick } from 'svelte';

	import 'iconify-icon';
	import { elementToSVG } from 'dom-to-svg';
	import domToImage from 'dom-to-image';

	import { LL } from '../i18n/i18n-svelte';

	import type { Alignment, FontFamily, FontStyle, Mode } from '$lib/types';

	// Components
	import Equivalency from '$lib/Equivalency.svelte';
	import LocaleSelect from '$lib/LocaleSelect.svelte';
	import Output, { type Line } from '../lib/Output.svelte';
	import Parameters from '$lib/Parameters.svelte';
	import SentenceInput from '$lib/SentenceInput.svelte';
	import { remapSentenceConnections } from '$lib/sentence-edit';
	import { save, open } from '$lib/file';

	// const SENTENCES = [
	// 	['en', 'I can eat glass and it doesn’t hurt me.'],
	// 	['zh', '我能吞下玻璃而不傷身體。'],
	// 	['ja', '私はガラスを食べられます。それは私を傷つけません。']
	// ];

	let sentences: [string, string[]][] = [
		['en', ['I', ' ', 'can', ' ', 'eat', ' ', 'glass', ' ', 'and', ' ', 'it', ' ', 'doesn’t', ' ', 'hurt', ' ', 'me', '.']],
		['zh-HanS', ['我', '能', '吞下', '玻璃', '而', '不', '伤', '身体', '。']],
		['zh-HanT', ['我', '能', '吞下', '玻璃', '而', '不', '傷', '身體', '。']],
		['ja', ['<ruby>私<rt>わたし</rt></ruby>', 'は', 'ガラス', 'を', '食べ', 'れます', '。', 'それ', 'は', '私', 'を', '傷つけ', 'ません', '。']]
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
	let goldenHue = 0;

	// Prevent empty entry from existing
	$: equivalency = equivalency.filter((entry) => !entry.every((sentence) => sentence.length === 0));

	let color_map: number[][] = [];
	let colors: string[] = [];
	let word_spans: HTMLSpanElement[][];

	// Parameters
	let verticalGap: number;
	let lineGap: number;
	let straightLength: number;
	let endpointCorrection: number;
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

	function gcd(a: number, b: number): number {
		let x = Math.abs(a);
		let y = Math.abs(b);
		while (y !== 0) {
			const remainder = x % y;
			x = y;
			y = remainder;
		}
		return x;
	}

	function getScrambleStep(n: number): number {
		const defaultStep = (n >>> 1) - +((n & 1) === 0) - +((n & 3) === 2);
		if (defaultStep > 1) return defaultStep;

		for (let step = 2; step < n; step++) {
			if (gcd(step, n) === 1) return step;
		}

		return defaultStep;
	}

	$: colors = pickNColors(equivalency.length, false).map(oklchToHex);

	// LINE_COORDINATES

	let lines: Line[] = [];
	let editingText = '';
	let editingSelectionStart = -1;
	let editingSelectionEnd = -1;
	let outputContainer: HTMLDivElement;
	let inputContainer: HTMLDivElement;

	$: previewSentences =
		modifying === -1
			? sentences
			: sentences.map(
					([lang, words], index) => [lang, index === modifying ? editingText.split(/[|]/u).filter(Boolean) : words] as [string, string[]]
			  );

	function cancelUnchangedEdit() {
		modifying = -1;
		editingText = '';
		editingSelectionStart = -1;
		editingSelectionEnd = -1;
		wordsBeforeModify = [];
	}

	function shouldKeepSentenceEdit(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		if (outputContainer?.contains(target)) return true;
		if (inputContainer?.contains(target)) return true;
		return false;
	}

	async function onsubmit({ detail: { lang, words } }: CustomEvent<{ lang: string; words: string[] }>): Promise<void> {
		if (modifying !== -1) {
			// Modifying existing sentence
			sentences[modifying] = [lang, words];

			if (!words.every((word, i) => word === wordsBeforeModify[i])) {
				equivalency = remapSentenceConnections(equivalency, modifying, wordsBeforeModify, words);
			}

			modifying = -1;
			editingText = '';
			editingSelectionStart = -1;
			editingSelectionEnd = -1;
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

					// Insert a new entry while keeping neighboring colors visually smooth
					goldenHue = (goldenHue + 0.618033988749895) % 1;
					const targetIndex = Math.floor(goldenHue * (equivalency.length + 1));
					equivalency.splice(targetIndex, 0, grouped);
				}
			}
		}

		equivalency = equivalency;
	}

	let modifying = -1;
	let wordsBeforeModify: string[] = [];

	let loading = false;

	function getBodyBackgroundColor(): string {
		if (typeof document === 'undefined') return 'white';

		const typedStyle = document.body.computedStyleMap?.().get('background-color');
		if (typedStyle) return typedStyle.toString();

		return window.getComputedStyle(document.body).backgroundColor || document.body.style.backgroundColor || 'white';
	}

	async function load(data: { equivalency: number[][][]; sentences: [string, string[]][] }) {
		loading = true;
		sentences = data.sentences;
		equivalency = data.equivalency;
		await tick();
		word_spans = sentences.map(() => []);
		loading = false;
	}

	let output: HTMLOutputElement;
</script>

<svelte:window
	on:pointerdown={(e) => {
		if (modifying === -1) return;
		if (shouldKeepSentenceEdit(e.target)) return;
		if (editingText !== wordsBeforeModify.join('|')) return;
		cancelUnchangedEdit();
	}}
/>

<header class="menu" class:editing-context={modifying !== -1}>
	<button
		disabled={mode === 'edit'}
		on:click={() => {
			if (!confirm($LL.confirm.new())) return;

			sentences = [];
			equivalency = [];
		}}
	>
		<iconify-icon icon="eos-icons:content-new" />
		{$LL.menu.new()}
	</button>
	<button
		disabled={mode === 'edit'}
		on:click={() => {
			const data = {
				sentences: sentences,
				equivalency: equivalency
			};
			save(JSON.stringify(data), 'application/json', 'data.json');
		}}
	>
		<iconify-icon icon="uil:export" />
		{$LL.menu.export()}</button
	>
	<button
		disabled={mode === 'edit'}
		on:click={() => {
			open(load);
		}}
	>
		<iconify-icon icon="uil:import" />
		{$LL.menu.import()}</button
	>
	<button
		disabled={mode === 'edit'}
		on:click={() => {
			if (output) {
				const serializer = new XMLSerializer();
				const svgDocument = elementToSVG(output);
				const svgString = serializer.serializeToString(svgDocument);
				save(svgString, 'image/svg+xml', 'output.svg');
			}
		}}
	>
		<iconify-icon icon="teenyicons:svg-outline" />
		{$LL.menu.svg()}
	</button>
	<button
		disabled={mode === 'edit'}
		on:click={async () => {
			if (output) {
				const scale = 2;
				const png = await domToImage.toBlob(output, {
					width: output.clientWidth * scale,
					height: output.clientHeight * scale,
					style: {
						transform: `scale(${scale})`, // `translate(${em}px, ${em}px)
						transformOrigin: 'top left',
						'background-color': getBodyBackgroundColor()
					}
				});
				save(png, 'image/png', 'output.png');
			}
		}}
	>
		<iconify-icon icon="teenyicons:png-outline" />
		{$LL.menu.png()}
	</button>
	<div class="menu-locale">
		<LocaleSelect />
	</div>
</header>

<main>
	<div class="output" class:editing-active={modifying !== -1} bind:this={outputContainer}>
		{#if mounted}
			<Output
				sentences={previewSentences}
				{color_map}
				{equivalency}
				{alignment}
				bind:lines
				{colors}
				{verticalGap}
				{lineGap}
				{straightLength}
				{endpointCorrection}
				{fontFamily}
				{fontStyle}
				{fontSize}
				{loading}
				{modifying}
				{editingSelectionStart}
				{editingSelectionEnd}
				bind:word_spans
				bind:mode
				bind:output
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
					editingText = sentences[sentence][1].join('|');
					editingSelectionStart = -1;
					editingSelectionEnd = -1;
				}}
				on:merge={({ detail: { sentence, start, end } }) => {
					const words = previewSentences[sentence][1];
					const merged = words.slice(start, end + 1).join('');
					editingText = [...words.slice(0, start), merged, ...words.slice(end + 1)].join('|');
					editingSelectionStart = start;
					editingSelectionEnd = start;
				}}
				on:split={({ detail: { sentence, word, offset } }) => {
					const words = previewSentences[sentence][1];
					const token = words[word];
					editingText = [...words.slice(0, word), token.slice(0, offset), token.slice(offset), ...words.slice(word + 1)].filter(Boolean).join('|');
					editingSelectionStart = word;
					editingSelectionEnd = word + 1;
				}}
			/>
		{/if}
	</div>

	<div class="input" class:editing-active={modifying !== -1} bind:this={inputContainer}>
		<SentenceInput on:submit={onsubmit} {modifying} {sentences} bind:text={editingText} />
	</div>

	<div class="params" class:editing-muted={modifying !== -1}>
		<Parameters
			bind:verticalGap
			bind:lineGap
			bind:straightLength
			bind:endpointCorrection
			bind:alignment
			bind:fontFamily
			bind:fontStyle
			bind:fontSize
		/>
	</div>

	<div class="equivalency" class:editing-muted={modifying !== -1}>
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
			on:scramble={() => {
				const n = equivalency.length;
				if (n <= 2) {
					equivalency.reverse();
					equivalency = equivalency;
					return;
				}
				const coprimeN = getScrambleStep(n);
				const result = [];
				let idx = 0;
				for (let i = 0; i < n; i++) {
					result.push(equivalency[idx]);
					idx = (idx + coprimeN) % n;
				}
				equivalency = result;
			}}
		/>
	</div>
</main>

<svelte:head>
	<title>{$LL.meta.title()}</title>
</svelte:head>

<footer class:editing-muted={modifying !== -1}>
	<p>
		{$LL.meta.title()} (
		<a href="https://github.com/mkpoli/word-order/" title={$LL.footer.githubRepository()} class="github-link"><iconify-icon icon="mdi:github" inline="true" /></a
		>,
		<a href="https://twitter.com/mkpoli/status/1562786122782380036" title={$LL.footer.announcement()} class="twitter-link"
			><iconify-icon icon="mdi:twitter" inline="true" /></a
		>) {$LL.footer.by({ author: '@mkpoli' })} (
		<a href="https://twitter.com/mkpoli/" class="twitter-link"><iconify-icon icon="mdi:twitter" inline="true" /></a>,
		<a href="https://mkpo.li/" class="home-link"><iconify-icon icon="mdi:home" inline="true" /></a>
		)
	</p>
	<p>
		{$LL.footer.info()}
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
		position: relative;
		isolation: isolate;
	}

	main::before {
		content: '';
		position: absolute;
		inset: -0.5rem;
		border-radius: 2.2rem;
		background: rgb(255 255 255 / 0.96);
		z-index: -2;
		opacity: 0;
		transition: opacity 180ms ease;
	}

	main:has(.output.editing-active)::before {
		opacity: 1;
	}

	footer {
		text-align: center;
		padding: 1em;

		color: #444;
		max-width: 1024px;
		margin: 0 auto;
	}

	footer iconify-icon {
		display: inline-block;
		width: 1.15em;
		height: 1.15em;
		vertical-align: middle;
	}

	footer a.github-link {
		color: #181717;
	}

	footer a.github-link:visited {
		color: #181717;
	}

	footer a.twitter-link {
		color: #1d9bf0;
	}

	footer a.twitter-link:visited {
		color: #1d9bf0;
	}

	footer a.home-link {
		color: #444;
	}

	footer a.home-link:visited {
		color: #444;
	}

	.params {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1em;
		transition: opacity 180ms ease, filter 180ms ease, transform 180ms ease;
	}

	.equivalency {
		display: flex;
		gap: 0.7em;
		height: fit-content;
		padding: 1em;
		justify-content: center;
		transition: opacity 180ms ease, filter 180ms ease, transform 180ms ease;
	}

	.output {
		padding: 0;
		display: flex;
		justify-content: center;
		position: relative;
		z-index: 1;
		transition: box-shadow 180ms ease, border-color 180ms ease, transform 180ms ease, opacity 180ms ease, filter 180ms ease;
	}

	.output::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -1.7rem;
		width: 2px;
		height: 1.7rem;
		background: linear-gradient(180deg, rgb(46 91 255 / 0.45), rgb(46 91 255 / 0));
		opacity: 0;
		transform: translateX(-50%);
		transition: opacity 180ms ease;
	}

	.input {
		position: relative;
		padding: 0;
		z-index: 1;
		transition: box-shadow 180ms ease, border-color 180ms ease, transform 180ms ease, opacity 180ms ease, filter 180ms ease,
			background-color 180ms ease;
	}

	.output.editing-active,
	.input.editing-active {
		background: transparent;
	}

	.output.editing-active {
		padding: 1rem;
		border-radius: 1.4rem;
		border: 1px solid rgb(46 91 255 / 0.2);
		box-shadow: 0 18px 42px rgb(31 44 84 / 0.12), 0 0 0 0.35rem rgb(46 91 255 / 0.08);
	}

	.input.editing-active {
		transform: none;
	}

	.output.editing-active {
		transform: translateY(-0.15rem);
	}

	.output.editing-active::after {
		opacity: 1;
	}

	.editing-muted {
		opacity: 0.4;
		filter: saturate(0.8) blur(0.2px);
		transform: scale(0.985);
		pointer-events: none;
	}

	.editing-context {
		transition: opacity 180ms ease, filter 180ms ease;
	}

	.editing-context {
		opacity: 0.5;
		filter: saturate(0.85);
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

		main:has(.output.editing-active) {
			grid-template-areas:
				'o o o'
				'p i e';
		}
	}

	@media (max-width: 1023px) {
		.output::after {
			top: auto;
			bottom: -1.4rem;
			height: 1.4rem;
		}
	}

	.menu {
		display: flex;
		flex-wrap: wrap;
		gap: 1em;
		padding: 1em;
		justify-content: flex-start;
		align-items: stretch;
	}

	.menu-locale {
		margin-left: auto;
		flex: 0 1 16rem;
		max-width: 16rem;
	}

	.menu button {
		appearance: none;
		padding: 0.5em 1em;
		border: none;
		border-radius: 0.2em;

		font-weight: bold;
		font-size: 1.02em;

		background-color: white;

		box-shadow: 1px 1px 5px 0 #ccc;

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
	}

	.menu button:not(:disabled):hover {
		background-color: #eee;
	}

	@media (max-width: 720px) {
		.menu {
			padding-top: 0.75rem;
		}

		.menu-locale {
			margin-left: auto;
			flex: 0 1 16rem;
			max-width: min(16rem, 100%);
		}
	}
</style>
