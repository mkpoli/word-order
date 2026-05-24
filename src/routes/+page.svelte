<script lang="ts">
	import { oklchToHex, pickNColors } from '$lib/color';
	import { onMount, tick } from 'svelte';

	import 'iconify-icon';
	import { elementToSVG } from 'dom-to-svg';
	import domToImage from 'dom-to-image';
	import { jsPDF } from 'jspdf';

	import { LL, locale } from '../i18n/i18n-svelte';
	import { page } from '$app/stores';
	import { getCanonicalUrl, getJsonLd, getOgImageUrl, themeColor } from '$lib/seo';

	import type { Alignment, FontFamily, FontStyle, Mode, Sentence, SentenceData, SentenceToken } from '$lib/types';
	import { createSentence, getSentenceWords, normalizeLanes } from '$lib/types';
	import { docFromExample, docFromLegacy, isDocEmpty, loadDoc, saveDoc } from '$lib/projects';
	import { EXAMPLES, type Example } from '$lib/examples';

	// Components
	import AboutDialog from '$lib/AboutDialog.svelte';
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

	let sentences: Sentence[] = [
		createSentence('en', ['I', ' ', 'can', ' ', 'eat', ' ', 'glass', ' ', 'and', ' ', 'it', ' ', 'doesn’t', ' ', 'hurt', ' ', 'me', '.']),
		createSentence('zh-HanS', ['我', '能', '吞下', '玻璃', '而', '不', '伤', '身体', '。']),
		createSentence('zh-HanT', ['我', '能', '吞下', '玻璃', '而', '不', '傷', '身體', '。']),
		createSentence('ja', [
			'<ruby>私<rt>わたし</rt></ruby>',
			'は',
			'ガラス',
			'を',
			'食べ',
			'れます',
			'。',
			'それ',
			'は',
			'私',
			'を',
			'傷つけ',
			'ません',
			'。'
		])
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
	let lineWidth = 1;
	let straightLength: number;
	let endpointCorrection: number;
	let curvature = 1;
	let alignment: Alignment;
	let fontFamily: FontFamily;
	let fontStyle: FontStyle;
	let fontSize: number;
	let glossFontSize = 11;
	let spaceWidth = 4;

	let aboutOpen = false;
	let examplesOpen = false;

	let mounted = false;
	onMount(async () => {
		const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
		verticalGap = Math.round(2 * rem);
		lineGap = Math.round(0.3 * rem);

		// Restore the user's last illustration from localStorage. If nothing is stored,
		// keep the seeded sample sentences/equivalency above as the first-visit default.
		const doc = loadDoc();
		if (doc) {
			sentences = doc.sentences;
			equivalency = doc.equivalency;
		}

		// Initialise word_spans to the right shape BEFORE Output mounts so its
		// bind:this writes have a valid array to write into. Resetting it after
		// mount + tick would clobber the just-populated bindings and leave the
		// connector SVG empty until the next user interaction.
		word_spans = sentences.map(() => []);
		mounted = true;
		await tick();
	});

	// Autosave on any change to sentences or equivalency.
	$: if (mounted) saveDoc({ schemaVersion: 1, sentences, equivalency });

	$: if (mounted) calculate_color_map(equivalency);
	function calculate_color_map(equivalency: number[][][]) {
		color_map = sentences.map((sentence) => new Array(sentence.tokens.length).fill(-1));
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
	let editingAnnotationsAbove: string[][] = [];
	let editingAnnotationsBelow: string[][] = [];
	let editingShowGloss = false;
	let annotationsAboveBeforeModify: string[][] = [];
	let annotationsBelowBeforeModify: string[][] = [];
	let editingSelectionStart = -1;
	let editingSelectionEnd = -1;
	let outputContainer: HTMLDivElement;
	let inputContainer: HTMLDivElement;

	function sameLanes(a: string[][], b: string[][]): boolean {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (a[i].length !== b[i].length) return false;
			for (let j = 0; j < a[i].length; j++) {
				if (a[i][j] !== b[i][j]) return false;
			}
		}
		return true;
	}

	function mergeLaneValues(lane: string[], start: number, end: number): string[] {
		const merged = lane
			.slice(start, end + 1)
			.filter(Boolean)
			.join('-');
		return [...lane.slice(0, start), merged, ...lane.slice(end + 1)];
	}

	function splitLaneValues(lane: string[], word: number): string[] {
		const v = lane[word] ?? '';
		return [...lane.slice(0, word), v, v, ...lane.slice(word + 1)];
	}

	function buildEditedSentence(lang: string, words: string[]): Sentence {
		const tokens: SentenceToken[] = words.map((text, tokenIndex) => ({
			text,
			annotationsAbove: editingAnnotationsAbove.map((lane) => lane[tokenIndex] ?? ''),
			annotationsBelow: editingAnnotationsBelow.map((lane) => lane[tokenIndex] ?? '')
		}));
		return normalizeLanes({
			lang,
			tokens,
			lanesAbove: editingAnnotationsAbove.length,
			lanesBelow: editingAnnotationsBelow.length,
			showGloss: editingShowGloss || editingAnnotationsAbove.length > 0 || editingAnnotationsBelow.length > 0
		});
	}

	$: previewSentences =
		modifying === -1
			? sentences
			: sentences.map((sentence, index) =>
					index === modifying ? buildEditedSentence(sentence.lang, editingText.split(/[|]/u).filter(Boolean)) : sentence
				);

	function cancelUnchangedEdit() {
		modifying = -1;
		editingText = '';
		editingAnnotationsAbove = [];
		editingAnnotationsBelow = [];
		editingShowGloss = false;
		annotationsAboveBeforeModify = [];
		annotationsBelowBeforeModify = [];
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

	async function onsubmit({
		detail: { lang, words, annotationsAbove, annotationsBelow, showGloss }
	}: CustomEvent<{
		lang: string;
		words: string[];
		annotationsAbove: string[][];
		annotationsBelow: string[][];
		showGloss: boolean;
	}>): Promise<void> {
		const tokens: SentenceToken[] = words.map((text, tokenIndex) => ({
			text,
			annotationsAbove: annotationsAbove.map((lane) => lane[tokenIndex] ?? ''),
			annotationsBelow: annotationsBelow.map((lane) => lane[tokenIndex] ?? '')
		}));
		const sentence: Sentence = normalizeLanes({
			lang,
			tokens,
			lanesAbove: annotationsAbove.length,
			lanesBelow: annotationsBelow.length,
			showGloss: showGloss || annotationsAbove.length > 0 || annotationsBelow.length > 0
		});

		if (modifying !== -1) {
			// Modifying existing sentence
			sentences[modifying] = sentence;

			if (!words.every((word, i) => word === wordsBeforeModify[i])) {
				equivalency = remapSentenceConnections(equivalency, modifying, wordsBeforeModify, words);
			}

			modifying = -1;
			editingText = '';
			editingAnnotationsAbove = [];
			editingAnnotationsBelow = [];
			editingShowGloss = false;
			annotationsAboveBeforeModify = [];
			annotationsBelowBeforeModify = [];
			editingSelectionStart = -1;
			editingSelectionEnd = -1;
			wordsBeforeModify = [];
		} else {
			// Adding new sentence
			sentences.push(sentence);
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

	async function replaceDoc(next: { sentences: Sentence[]; equivalency: number[][][] }) {
		if (modifying !== -1) cancelUnchangedEdit();
		mode = 'view';
		loading = true;
		sentences = next.sentences;
		equivalency = next.equivalency;
		await tick();
		word_spans = sentences.map(() => []);
		loading = false;
	}

	async function load(data: { equivalency: number[][][]; sentences: SentenceData[] }) {
		if (!isDocEmpty({ sentences, equivalency }) && !confirm($LL.confirm.import())) return;
		await replaceDoc(docFromLegacy(data));
	}

	async function loadExample(example: Example) {
		if (!isDocEmpty({ sentences, equivalency }) && !confirm($LL.confirm.loadExample({ name: example.name }))) {
			closeExamplesMenu();
			return;
		}
		closeExamplesMenu();
		await replaceDoc(docFromExample(example));
	}

	let exportOpen = false;
	let exportWrapper: HTMLDivElement;
	let exportTrigger: HTMLButtonElement;
	let exportCloseTimer: ReturnType<typeof setTimeout> | null = null;

	function openExportMenu() {
		if (mode === 'edit') return;
		if (exportCloseTimer) {
			clearTimeout(exportCloseTimer);
			exportCloseTimer = null;
		}
		exportOpen = true;
	}

	function scheduleExportClose() {
		if (mode === 'edit') return;
		if (exportCloseTimer) clearTimeout(exportCloseTimer);
		exportCloseTimer = setTimeout(() => {
			exportOpen = false;
			exportCloseTimer = null;
		}, 220);
	}

	function closeExportMenu(restoreFocus = false) {
		if (exportCloseTimer) {
			clearTimeout(exportCloseTimer);
			exportCloseTimer = null;
		}
		exportOpen = false;
		if (restoreFocus && exportTrigger) exportTrigger.focus();
	}

	let examplesWrapper: HTMLDivElement;
	let examplesTrigger: HTMLButtonElement;
	let examplesCloseTimer: ReturnType<typeof setTimeout> | null = null;

	function openExamplesMenu() {
		if (mode === 'edit') return;
		if (examplesCloseTimer) {
			clearTimeout(examplesCloseTimer);
			examplesCloseTimer = null;
		}
		examplesOpen = true;
	}

	function scheduleExamplesClose() {
		if (mode === 'edit') return;
		if (examplesCloseTimer) clearTimeout(examplesCloseTimer);
		examplesCloseTimer = setTimeout(() => {
			examplesOpen = false;
			examplesCloseTimer = null;
		}, 220);
	}

	function closeExamplesMenu(restoreFocus = false) {
		if (examplesCloseTimer) {
			clearTimeout(examplesCloseTimer);
			examplesCloseTimer = null;
		}
		examplesOpen = false;
		if (restoreFocus && examplesTrigger) examplesTrigger.focus();
	}

	function slugify(text: string): string {
		return text
			.normalize('NFKD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/<[^>]+>/g, '')
			.replace(/[\p{P}\p{S}]+/gu, ' ')
			.trim()
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 40)
			.replace(/-+$/, '');
	}

	function exportFilename(ext: string): string {
		if (sentences.length === 0) return `word-order.${ext}`;
		const langs = sentences.map((s) => s.lang).join('-');
		const firstWords = sentences[0].tokens
			.map((t) => t.text)
			.filter((text) => !/^[\s\p{P}]+$/u.test(text))
			.slice(0, 5)
			.join(' ');
		const slug = slugify(firstWords);
		const stem = slug ? `${slug}.${langs}` : langs || 'word-order';
		return `${stem}.${ext}`;
	}

	async function exportPngBlob(scale = 2): Promise<Blob | null> {
		if (!output) return null;
		return await domToImage.toBlob(output, {
			width: output.clientWidth * scale,
			height: output.clientHeight * scale,
			style: {
				transform: `scale(${scale})`,
				transformOrigin: 'top left',
				'background-color': getBodyBackgroundColor()
			}
		});
	}

	function exportJson() {
		const data = { sentences, equivalency };
		save(JSON.stringify(data), 'application/json', exportFilename('json'));
		closeExportMenu();
	}

	function exportSvg() {
		if (!output) {
			closeExportMenu();
			return;
		}
		const serializer = new XMLSerializer();
		const svgDocument = elementToSVG(output);
		const svgString = serializer.serializeToString(svgDocument);
		save(svgString, 'image/svg+xml', exportFilename('svg'));
		closeExportMenu();
	}

	async function exportPng() {
		try {
			const png = await exportPngBlob();
			if (png) save(png, 'image/png', exportFilename('png'));
		} catch (err) {
			console.error('Export PNG failed:', err);
		} finally {
			closeExportMenu();
		}
	}

	async function exportPdf() {
		if (!output) {
			closeExportMenu();
			return;
		}
		try {
			const scale = 2;
			const dataUrl = await domToImage.toPng(output, {
				width: output.clientWidth * scale,
				height: output.clientHeight * scale,
				style: {
					transform: `scale(${scale})`,
					transformOrigin: 'top left',
					'background-color': getBodyBackgroundColor()
				}
			});
			const widthPx = output.clientWidth;
			const heightPx = output.clientHeight;
			const orientation = widthPx >= heightPx ? 'landscape' : 'portrait';
			const pdf = new jsPDF({
				orientation,
				unit: 'px',
				format: [widthPx, heightPx],
				hotfixes: ['px_scaling']
			});
			pdf.addImage(dataUrl, 'PNG', 0, 0, widthPx, heightPx, undefined, 'FAST');
			pdf.save(exportFilename('pdf'));
		} catch (err) {
			console.error('Export PDF failed:', err);
		} finally {
			closeExportMenu();
		}
	}

	let output: HTMLOutputElement;
	$: canonicalUrl = getCanonicalUrl($page.url.origin);
	$: ogImageUrl = getOgImageUrl($page.url.origin);
	$: metaTitle = $LL.meta.title();
	$: metaDescription = $LL.meta.description();
	$: metaKeywords = $LL.meta.keywords();
	$: metaImageAlt = $LL.meta.imageAlt();
	$: jsonLd = getJsonLd($page.url.origin, {
		name: metaTitle,
		description: metaDescription,
		locale: $locale
	});
</script>

<svelte:window
	on:pointerdown={(e) => {
		if (exportOpen && e.target instanceof Node && exportWrapper && !exportWrapper.contains(e.target)) {
			closeExportMenu();
		}
		if (examplesOpen && e.target instanceof Node && examplesWrapper && !examplesWrapper.contains(e.target)) {
			closeExamplesMenu();
		}
		if (modifying === -1) return;
		if (shouldKeepSentenceEdit(e.target)) return;
		if (editingText !== wordsBeforeModify.join('|')) return;
		if (editingShowGloss !== sentences[modifying].showGloss) return;
		if (!sameLanes(editingAnnotationsAbove, annotationsAboveBeforeModify)) return;
		if (!sameLanes(editingAnnotationsBelow, annotationsBelowBeforeModify)) return;
		cancelUnchangedEdit();
	}}
	on:keydown={(e) => {
		if (e.key === 'Escape' && exportOpen) closeExportMenu(true);
		if (e.key === 'Escape' && examplesOpen) closeExamplesMenu(true);
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
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="examples-dropdown"
		class:open={examplesOpen}
		bind:this={examplesWrapper}
		on:mouseenter={openExamplesMenu}
		on:mouseleave={scheduleExamplesClose}
	>
		<button
			class="examples-trigger"
			disabled={mode === 'edit'}
			aria-haspopup="true"
			aria-expanded={examplesOpen}
			bind:this={examplesTrigger}
			on:click={() => (examplesOpen ? closeExamplesMenu() : openExamplesMenu())}
			on:focus={openExamplesMenu}
		>
			<iconify-icon icon="mdi:bookshelf" />
			{$LL.menu.examples()}
			<iconify-icon icon="mdi:chevron-down" inline="true" class="chevron" />
		</button>
		<div class="examples-menu" role="group" aria-label={$LL.menu.examples()}>
			{#each EXAMPLES as example (example.id)}
				<button type="button" disabled={mode === 'edit'} on:click={() => loadExample(example)}>
					<span class="example-name">{example.name}</span>
					<span class="example-langs">{example.sentences.map((s) => s.lang).join(' · ')}</span>
				</button>
			{/each}
		</div>
	</div>
	<button
		disabled={mode === 'edit'}
		on:click={() => {
			open(load);
		}}
	>
		<iconify-icon icon="uil:import" />
		{$LL.menu.import()}</button
	>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="export-dropdown" class:open={exportOpen} bind:this={exportWrapper} on:mouseenter={openExportMenu} on:mouseleave={scheduleExportClose}>
		<button
			class="export-trigger"
			disabled={mode === 'edit'}
			aria-haspopup="true"
			aria-expanded={exportOpen}
			bind:this={exportTrigger}
			on:click={() => (exportOpen ? closeExportMenu() : openExportMenu())}
			on:focus={openExportMenu}
		>
			<iconify-icon icon="uil:export" />
			{$LL.menu.export()}
			<iconify-icon icon="mdi:chevron-down" inline="true" class="chevron" />
		</button>
		<div class="export-menu" role="group" aria-label={$LL.menu.export()}>
			<button type="button" disabled={mode === 'edit'} on:click={exportJson}>
				<iconify-icon icon="mdi:code-braces" inline="true" />
				JSON
			</button>
			<button type="button" disabled={mode === 'edit'} on:click={exportSvg}>
				<iconify-icon icon="mdi:vector-square" inline="true" />
				SVG
			</button>
			<button type="button" disabled={mode === 'edit'} on:click={exportPng}>
				<iconify-icon icon="mdi:image-outline" inline="true" />
				PNG
			</button>
			<button type="button" disabled={mode === 'edit'} on:click={exportPdf}>
				<iconify-icon icon="mdi:file-pdf-box" inline="true" />
				PDF
			</button>
		</div>
	</div>
	<button class="about-button" title={$LL.menu.about()} aria-label={$LL.menu.about()} on:click={() => (aboutOpen = true)}>
		<iconify-icon icon="mdi:information-outline" />
		{$LL.menu.about()}
	</button>
	<div class="menu-locale">
		<LocaleSelect />
	</div>
</header>

<AboutDialog bind:open={aboutOpen} />

<main>
	<div class="output" class:editing-active={modifying !== -1} bind:this={outputContainer}>
		<div class="output-scroll">
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
					{lineWidth}
					{straightLength}
					{endpointCorrection}
					{curvature}
					{fontFamily}
					{fontStyle}
					{fontSize}
					{glossFontSize}
					{spaceWidth}
					{loading}
					{modifying}
					{editingSelectionStart}
					{editingSelectionEnd}
					bind:word_spans
					bind:mode
					bind:output
					on:connect={onconnect}
					on:reorder={({ detail: { from, to } }) => {
						const sentence = sentences[from];
						sentences.splice(from, 1);
						sentences.splice(to, 0, sentence);
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
						const src = sentences[sentence];
						wordsBeforeModify = getSentenceWords(src);
						editingText = wordsBeforeModify.join('|');
						annotationsAboveBeforeModify = Array.from({ length: src.lanesAbove }, (_, lane) =>
							src.tokens.map((t) => t.annotationsAbove[lane] ?? '')
						);
						annotationsBelowBeforeModify = Array.from({ length: src.lanesBelow }, (_, lane) =>
							src.tokens.map((t) => t.annotationsBelow[lane] ?? '')
						);
						editingAnnotationsAbove = annotationsAboveBeforeModify.map((lane) => [...lane]);
						editingAnnotationsBelow = annotationsBelowBeforeModify.map((lane) => [...lane]);
						editingShowGloss = src.showGloss;
						editingSelectionStart = -1;
						editingSelectionEnd = -1;
					}}
					on:merge={({ detail: { sentence, start, end } }) => {
						const words = getSentenceWords(previewSentences[sentence]);
						const merged = words.slice(start, end + 1).join('');
						editingText = [...words.slice(0, start), merged, ...words.slice(end + 1)].join('|');
						editingAnnotationsAbove = editingAnnotationsAbove.map((lane) => mergeLaneValues(lane, start, end));
						editingAnnotationsBelow = editingAnnotationsBelow.map((lane) => mergeLaneValues(lane, start, end));
						editingSelectionStart = start;
						editingSelectionEnd = start;
					}}
					on:split={({ detail: { sentence, word, offset } }) => {
						const words = getSentenceWords(previewSentences[sentence]);
						const token = words[word];
						editingText = [...words.slice(0, word), token.slice(0, offset), token.slice(offset), ...words.slice(word + 1)].filter(Boolean).join('|');
						editingAnnotationsAbove = editingAnnotationsAbove.map((lane) => splitLaneValues(lane, word));
						editingAnnotationsBelow = editingAnnotationsBelow.map((lane) => splitLaneValues(lane, word));
						editingSelectionStart = word;
						editingSelectionEnd = word + 1;
					}}
				/>
			{/if}
		</div>
	</div>

	<div class="input" class:editing-active={modifying !== -1} bind:this={inputContainer}>
		<SentenceInput
			on:submit={onsubmit}
			{modifying}
			{sentences}
			bind:text={editingText}
			bind:annotationsAbove={editingAnnotationsAbove}
			bind:annotationsBelow={editingAnnotationsBelow}
			bind:glossEnabled={editingShowGloss}
		/>
	</div>

	<div class="params" class:editing-muted={modifying !== -1}>
		<Parameters
			bind:verticalGap
			bind:lineGap
			bind:lineWidth
			bind:straightLength
			bind:endpointCorrection
			bind:curvature
			bind:alignment
			bind:fontFamily
			bind:fontStyle
			bind:fontSize
			bind:glossFontSize
			bind:spaceWidth
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
	<title>{metaTitle}</title>
	<meta name="description" content={metaDescription} />
	<meta name="keywords" content={metaKeywords} />
	<meta name="author" content="mkpoli" />
	<meta name="creator" content="mkpoli" />
	<meta name="publisher" content="mkpoli" />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta name="theme-color" content={themeColor} />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={metaTitle} />
	<meta property="og:title" content={metaTitle} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={metaImageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:creator" content="@mkpoli" />
	<meta name="twitter:title" content={metaTitle} />
	<meta name="twitter:description" content={metaDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta name="twitter:image:alt" content={metaImageAlt} />

	{@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<footer class:editing-muted={modifying !== -1}>
	<p>
		{$LL.meta.title()} (
		<a href="https://github.com/mkpoli/word-order/" title={$LL.footer.githubRepository()} class="github-link"
			><iconify-icon icon="mdi:github" inline="true" /></a
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
		transition:
			opacity 180ms ease,
			filter 180ms ease,
			transform 180ms ease;
	}

	.equivalency {
		display: flex;
		gap: 0.7em;
		height: fit-content;
		padding: 1em;
		justify-content: center;
		transition:
			opacity 180ms ease,
			filter 180ms ease,
			transform 180ms ease;
	}

	.output {
		padding: 0;
		position: relative;
		z-index: 1;
		transition:
			box-shadow 180ms ease,
			border-color 180ms ease,
			transform 180ms ease,
			opacity 180ms ease,
			filter 180ms ease;
	}

	/* Horizontal scroll lives on this inner wrapper, not on .output itself,
	   so .output's overflow stays visible and the ::after editing indicator
	   below the box can render. */
	.output-scroll {
		overflow-x: auto;
		overflow-y: hidden;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior-x: contain;
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
		transition:
			box-shadow 180ms ease,
			border-color 180ms ease,
			transform 180ms ease,
			opacity 180ms ease,
			filter 180ms ease,
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
		box-shadow:
			0 18px 42px rgb(31 44 84 / 0.12),
			0 0 0 0.35rem rgb(46 91 255 / 0.08);
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
		transition:
			opacity 180ms ease,
			filter 180ms ease;
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
		margin-inline-start: auto;
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

	.export-dropdown {
		position: relative;
		display: inline-flex;
	}

	.export-trigger :global(.chevron) {
		font-size: 0.95em;
		opacity: 0.6;
		margin-inline-start: 0.15em;
		transition: transform 160ms ease;
	}

	.export-dropdown.open .export-trigger :global(.chevron) {
		transform: rotate(180deg);
	}

	.export-menu {
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 10em;
		margin-top: 0;
		padding: 0.55em 0.35em 0.35em;
		display: none;
		flex-direction: column;
		gap: 0.1em;
		background: white;
		border-radius: 0.3em;
		box-shadow:
			1px 1px 5px 0 #ccc,
			0 6px 22px rgb(15 23 42 / 0.12);
		z-index: 100;
	}

	.export-dropdown.open .export-menu {
		display: flex;
	}

	.export-menu button {
		appearance: none;
		background: none;
		border: none;
		box-shadow: none;
		padding: 0.5em 0.85em;
		border-radius: 0.2em;
		font: inherit;
		font-weight: bold;
		font-size: 1em;
		color: #333;
		display: grid;
		grid-template-columns: 1.3em 1fr;
		align-items: center;
		gap: 0.6em;
		text-align: left;
		cursor: pointer;
		width: 100%;
		justify-content: flex-start;
	}

	.export-menu button :global(iconify-icon) {
		font-size: 1.15em;
		justify-self: center;
		color: #555;
	}

	.export-menu button:not(:disabled):hover,
	.export-menu button:focus-visible {
		background-color: #eee;
		outline: none;
	}

	.export-menu button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.examples-dropdown {
		position: relative;
		display: inline-flex;
	}

	.examples-trigger :global(.chevron) {
		font-size: 0.95em;
		opacity: 0.6;
		margin-inline-start: 0.15em;
		transition: transform 160ms ease;
	}

	.examples-dropdown.open .examples-trigger :global(.chevron) {
		transform: rotate(180deg);
	}

	.examples-menu {
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 18em;
		max-height: min(70vh, 28em);
		overflow-y: auto;
		margin-top: 0;
		padding: 0.35em 0.3em;
		display: none;
		flex-direction: column;
		gap: 0.05em;
		background: white;
		border-radius: 0.3em;
		box-shadow:
			1px 1px 5px 0 #ccc,
			0 6px 22px rgb(15 23 42 / 0.12);
		z-index: 100;
	}

	.examples-dropdown.open .examples-menu {
		display: flex;
	}

	.examples-menu button {
		appearance: none;
		background: none;
		border: none;
		box-shadow: none;
		padding: 0.35em 0.7em;
		border-radius: 0.25em;
		font: inherit;
		color: #333;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.8em;
		text-align: left;
		cursor: pointer;
		width: 100%;
	}

	.examples-menu .example-name {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 600;
		font-size: 0.85em;
		color: #333;
	}

	.examples-menu .example-langs {
		flex: 0 1 auto;
		min-width: 0;
		max-width: 50%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.7em;
		color: #888;
		letter-spacing: 0.02em;
	}

	.examples-menu button:not(:disabled):hover,
	.examples-menu button:focus-visible {
		background-color: #eee;
		outline: none;
	}

	.examples-menu button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	@media (max-width: 720px) {
		.menu {
			padding-top: 0.75rem;
		}

		.menu-locale {
			margin-inline-start: auto;
			flex: 0 1 16rem;
			max-width: min(16rem, 100%);
		}
	}
</style>
