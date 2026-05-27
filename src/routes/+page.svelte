<script lang="ts">
	import { run } from 'svelte/legacy';

	import { oklchToHex, pickNColors, DEFAULT_PALETTE, PALETTES, type PaletteId } from '$lib/color';
	import { applyPreviewColors, type DragPreview } from '$lib/equivalency-preview';
	import { loadParams, saveParams } from '$lib/persisted-params';
	import { onMount, tick } from 'svelte';

	import 'iconify-icon';
	import { elementToSVG } from 'dom-to-svg';
	import domToImage from 'dom-to-image';
	import { jsPDF } from 'jspdf';

	import { LL, locale } from '../i18n/i18n-svelte';
	import { page } from '$app/stores';
	import { getCanonicalUrl, getJsonLd, getOgImageUrl, themeColor } from '$lib/seo';

	import type { Alignment, FontFamily, FontStyle, LineStyle, Mode, Sentence, SentenceData, SentenceToken } from '$lib/types';
	import { createSentence, getSentenceGlosses, getSentenceWords, normalizeLanes } from '$lib/types';
	import { docFromExample, docFromLegacy, isDocEmpty, loadDoc, saveDoc } from '$lib/projects';
	import { buildShareUrl, decodeDocFromUrl, isShareUrlLong, readPayloadFromUrl } from '$lib/share';
	import { EXAMPLES, type Example } from '$lib/examples';

	// Components
	import AboutDialog from '$lib/AboutDialog.svelte';
	import QrDialog from '$lib/QrDialog.svelte';
	import Equivalency from '$lib/Equivalency.svelte';
	import LocaleSelect from '$lib/LocaleSelect.svelte';
	import ThemeToggle from '$lib/ThemeToggle.svelte';
	import Output, { type Line } from '../lib/Output.svelte';
	import Parameters from '$lib/Parameters.svelte';
	import SentenceInput from '$lib/SentenceInput.svelte';
	import SettingsDialog from '$lib/SettingsDialog.svelte';
	import TranslatePopover from '$lib/TranslatePopover.svelte';
	import type { Margin } from '$lib/types';
	import { remapSentenceConnections } from '$lib/sentence-edit';
	import { save, open } from '$lib/file';
	import { translateAndAlign } from '$lib/llm/translate';
	import type { TranslateRequest } from '$lib/llm/types';
	import { addGlossAlignments } from '$lib/gloss-align';
	import { getLocaleOptions } from '$lib/lang';

	// const SENTENCES = [
	// 	['en', 'I can eat glass and it doesn’t hurt me.'],
	// 	['zh', '我能吞下玻璃而不傷身體。'],
	// 	['ja', '私はガラスを食べられます。それは私を傷つけません。']
	// ];

	let sentences: Sentence[] = $state([
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
	]);

	let equivalency: number[][][] = $state([
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
	]);

	let mode: Mode = $state('view');
	let goldenHue = 0;

	let color_map: number[][] = $derived.by(() => {
		const cm: number[][] = sentences.map((sentence) => new Array(sentence.tokens.length).fill(-1));
		for (const [i, entry] of equivalency.entries()) {
			for (const [j, words] of entry.entries()) {
				for (const word of words) {
					cm[j][word] = i;
				}
			}
		}
		return cm;
	});
	const PALETTE_IDS: PaletteId[] = PALETTES.map((p) => p.id);
	const LINE_STYLES: LineStyle[] = ['solid', 'dashed', 'dotted'];
	const ALIGNMENTS: Alignment[] = ['left', 'center', 'right'];
	const FONT_FAMILIES: FontFamily[] = ['default', 'sans-serif', 'serif', 'monospace'];
	const FONT_STYLES: FontStyle[] = ['normal', 'italic', 'bold', 'bold-italic'];
	let palette: PaletteId = $state(DEFAULT_PALETTE);
	let colors: string[] = $derived(pickNColors(equivalency.length, false, palette).map(oklchToHex));
	// Bound by <Equivalency> while a drag is in progress; null when idle. Mirrors
	// the {from, to} that onreorder would emit on drop, so we can pre-apply the
	// same permutation to line colours without committing to the reorder.
	let dragPreview: DragPreview = $state(null);
	let displayColors: string[] = $derived(applyPreviewColors(colors, dragPreview));
	let word_spans: HTMLSpanElement[][] = $state([]);

	// Parameters
	let verticalGap = $state(0);
	let lineGap = $state(0);
	let lineWidth = $state(1);
	let lineStyle: LineStyle = $state('solid');
	let lineHalo = $state(false);
	let lineHaloWidth = $state(1.5);
	let straightLength = $state(0);
	let endpointCorrection = $state(0);
	let curvature = $state(1);
	let alignment: Alignment = $state('center');
	let fontFamily: FontFamily = $state('default');
	let fontStyle: FontStyle = $state('normal');
	let fontSize = $state(15);
	let glossFontSize = $state(11);
	let spaceWidth = $state(4);
	let letterSpacing = $state(0);
	let tokenGap = $state(0);
	let outputMargin: Margin = $state({ top: 40, right: 32, bottom: 40, left: 32 });

	let aboutOpen = $state(false);
	let settingsOpen = $state(false);
	let examplesOpen = $state(false);
	let translatePopoverOpen = $state(false);

	type RasterScale = 2 | 3 | 4 | 6;
	const RASTER_SCALES: RasterScale[] = [2, 3, 4, 6];
	let rasterScale: RasterScale = $state(2);

	type PendingTranslation = {
		abort: AbortController;
		rowIndices: number[];
		targets: string[];
	};

	let pendingTranslation = $state<PendingTranslation | null>(null);
	let translateError: { message: string; targets: string[] } | null = $state(null);

	type UsageReceipt = {
		inputTokens: number;
		outputTokens: number;
		provider: string;
		model: string;
	};
	let lastUsage: UsageReceipt | null = $state(null);
	let lastUsageTimer: ReturnType<typeof setTimeout> | null = null;

	type ShareFeedback = 'copied' | 'long' | null;
	let shareFeedback: ShareFeedback = $state(null);
	let shareFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
	let shareUrlLength = $state(0);
	let shareLoadError = $state(false);

	let qrOpen = $state(false);
	let qrUrl = $state('');

	async function openQrDialog() {
		try {
			qrUrl = await buildShareUrl(window.location.origin, { schemaVersion: 1, sentences, equivalency });
			qrOpen = true;
		} catch {
			// Falls back to silently doing nothing — same behaviour as copyShareLink's failure mode.
		}
	}

	async function copyShareLink() {
		try {
			const url = await buildShareUrl(window.location.origin, { schemaVersion: 1, sentences, equivalency });
			await navigator.clipboard.writeText(url);
			// Also reflect the share state in the address bar so a refresh resolves
			// to exactly what the user just copied.
			window.history.replaceState(null, '', url);
			shareUrlLength = url.length;
			shareFeedback = isShareUrlLong(url) ? 'long' : 'copied';
			if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer);
			// Long-URL warning sticks around longer than the standard "Copied!"
			// flash since it carries an actionable message.
			shareFeedbackTimer = setTimeout(
				() => {
					shareFeedback = null;
					shareFeedbackTimer = null;
				},
				shareFeedback === 'long' ? 5000 : 1800
			);
		} catch (err) {
			console.error('Copy share link failed:', err);
		}
	}

	const TRANSLATE_TIMEOUT_MS = 120_000;

	let mounted = $state(false);
	onMount(async () => {
		const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
		verticalGap = Math.round(2 * rem);
		lineGap = Math.round(0.3 * rem);

		// 1. URL hash (#d=…) wins over localStorage so a shared link is
		//    instantly viewable on someone else's browser, regardless of what
		//    they had saved locally. 2. Otherwise restore the user's last
		//    illustration from localStorage. 3. Otherwise keep the seeded
		//    sample sentences/equivalency as the first-visit default.
		const sharePayload = readPayloadFromUrl();
		if (sharePayload) {
			const shared = await decodeDocFromUrl(sharePayload);
			if (shared) {
				sentences = shared.sentences;
				equivalency = shared.equivalency;
			} else {
				// The URL had `#d=…` / `?d=…` but the payload was unreadable —
				// truncated copy-paste, tampered link, or a future format we
				// don't understand. Surface a one-shot toast so the user knows
				// why they're seeing the sample doc instead of the shared one,
				// and clear the bad hash so the address bar reflects reality.
				shareLoadError = true;
				history.replaceState(null, '', window.location.pathname + window.location.search);
			}
		} else {
			const doc = loadDoc();
			if (doc) {
				sentences = doc.sentences;
				equivalency = doc.equivalency;
			}
		}

		// Initialise word_spans to the right shape BEFORE Output mounts so its
		// bind:this writes have a valid array to write into. Resetting it after
		// mount + tick would clobber the just-populated bindings and leave the
		// connector SVG empty until the next user interaction.
		word_spans = sentences.map(() => []);

		// Unified persisted parameter snapshot: replaces the per-key reads
		// (raster scale, palette, line style) and adds restore for every
		// other appearance / text / margin knob the user touches. Values are
		// guarded with explicit shape/enum checks so a hand-edited or
		// corrupt blob can't crash the page.
		const stored = loadParams();
		if (typeof stored.verticalGap === 'number') verticalGap = stored.verticalGap;
		if (typeof stored.lineGap === 'number') lineGap = stored.lineGap;
		if (typeof stored.lineWidth === 'number') lineWidth = stored.lineWidth;
		if (stored.lineStyle && LINE_STYLES.includes(stored.lineStyle)) lineStyle = stored.lineStyle;
		if (typeof stored.lineHalo === 'boolean') lineHalo = stored.lineHalo;
		if (typeof stored.lineHaloWidth === 'number') lineHaloWidth = stored.lineHaloWidth;
		if (typeof stored.tokenGap === 'number') tokenGap = stored.tokenGap;
		if (typeof stored.straightLength === 'number') straightLength = stored.straightLength;
		if (typeof stored.endpointCorrection === 'number') endpointCorrection = stored.endpointCorrection;
		if (typeof stored.curvature === 'number') curvature = stored.curvature;
		if (stored.alignment && ALIGNMENTS.includes(stored.alignment)) alignment = stored.alignment;
		if (stored.fontFamily && FONT_FAMILIES.includes(stored.fontFamily)) fontFamily = stored.fontFamily;
		if (stored.fontStyle && FONT_STYLES.includes(stored.fontStyle)) fontStyle = stored.fontStyle;
		if (typeof stored.fontSize === 'number') fontSize = stored.fontSize;
		if (typeof stored.glossFontSize === 'number') glossFontSize = stored.glossFontSize;
		if (typeof stored.spaceWidth === 'number') spaceWidth = stored.spaceWidth;
		if (typeof stored.letterSpacing === 'number') letterSpacing = stored.letterSpacing;
		if (stored.palette && PALETTE_IDS.includes(stored.palette)) palette = stored.palette;
		if (typeof stored.rasterScale === 'number' && RASTER_SCALES.includes(stored.rasterScale as RasterScale)) {
			rasterScale = stored.rasterScale as RasterScale;
		}
		if (stored.outputMargin && typeof stored.outputMargin === 'object') {
			const m = stored.outputMargin;
			if (typeof m.top === 'number' && typeof m.right === 'number' && typeof m.bottom === 'number' && typeof m.left === 'number') {
				outputMargin = m;
			}
		}

		mounted = true;
		await tick();
	});

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

	// LINE_COORDINATES

	let lines: Line[] = $state([]);
	let editingText = $state('');
	let editingAnnotationsAbove: string[][] = $state([]);
	let editingAnnotationsBelow: string[][] = $state([]);
	let editingShowGloss = $state(false);
	let annotationsAboveBeforeModify: string[][] = $state([]);
	let annotationsBelowBeforeModify: string[][] = $state([]);
	let editingSelectionStart = $state(-1);
	let editingSelectionEnd = $state(-1);
	let outputContainer: HTMLDivElement | undefined = $state();
	let inputContainer: HTMLDivElement | undefined = $state();

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

	function buildEditedSentence(lang: string, words: string[], above: string[][], below: string[][], showGloss: boolean): Sentence {
		const tokens: SentenceToken[] = words.map((text, tokenIndex) => ({
			text,
			annotationsAbove: above.map((lane) => lane[tokenIndex] ?? ''),
			annotationsBelow: below.map((lane) => lane[tokenIndex] ?? '')
		}));
		return normalizeLanes({
			lang,
			tokens,
			lanesAbove: above.length,
			lanesBelow: below.length,
			showGloss: showGloss || above.length > 0 || below.length > 0
		});
	}

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
			word_spans = [...word_spans, new Array(words.length).fill(null)];

			for (const [i, entry] of equivalency.entries()) {
				equivalency[i] = [...entry, []];
			}
		}

		await tick();
	}

	function buildSources(): TranslateRequest['sources'] {
		return sentences
			.filter((_, i) => !pendingSentenceSet.has(i))
			.map((s) => {
				const tokens = getSentenceWords(s);
				const glosses = getSentenceGlosses(s);
				return { lang: s.lang, text: tokens.join(''), tokens, glosses };
			});
	}

	function startTranslate(targets: string[]) {
		if (modifying !== -1) return;
		if (pendingTranslation) return;
		if (sentences.length === 0) return;

		translatePopoverOpen = false;
		translateError = null;
		const sourcesSnapshot = buildSources();

		// Append placeholder rows (empty tokens) for each target. Output renders them with a loading bar.
		const startIdx = sentences.length;
		const rowIndices: number[] = [];
		for (const tag of targets) {
			sentences.push(createSentence(tag, [], [], false));
			word_spans = [...word_spans, []];
			rowIndices.push(sentences.length - 1);
		}
		for (let i = 0; i < equivalency.length; i++) {
			equivalency[i] = [...equivalency[i], ...targets.map(() => [] as number[])];
		}

		const controller = new AbortController();
		pendingTranslation = { abort: controller, rowIndices, targets: [...targets] };

		const timeoutId = setTimeout(() => controller.abort(new Error(`Timed out after ${TRANSLATE_TIMEOUT_MS / 1000}s`)), TRANSLATE_TIMEOUT_MS);

		void runTranslate(controller, rowIndices, targets, sourcesSnapshot, startIdx, timeoutId);
	}

	async function runTranslate(
		controller: AbortController,
		rowIndices: number[],
		targets: string[],
		sourcesSnapshot: TranslateRequest['sources'],
		startIdx: number,
		timeoutId: ReturnType<typeof setTimeout>
	): Promise<void> {
		try {
			const result = await translateAndAlign(
				{
					sources: sourcesSnapshot,
					targets: targets.map((tag) => ({ lang: tag, endonym: endonymFor(tag) }))
				},
				undefined,
				controller.signal
			);

			// Replace each placeholder with its real translation.
			for (let k = 0; k < rowIndices.length; k++) {
				const idx = rowIndices[k];
				const translation = result.sentences[k];
				if (!translation) continue;
				sentences[idx] = translation;
				color_map[idx] = new Array(translation.tokens.length).fill(-1);
				word_spans[idx] = new Array(translation.tokens.length).fill(null);
			}

			// Build alignments from shared glosses across all sentences.
			equivalency = addGlossAlignments(sentences, equivalency, rowIndices);

			pendingTranslation = null;
			if (mode === 'view') mode = 'edit';

			if (result.usage) {
				lastUsage = {
					inputTokens: result.usage.inputTokens,
					outputTokens: result.usage.outputTokens,
					provider: result.provider,
					model: result.model
				};
				if (lastUsageTimer) clearTimeout(lastUsageTimer);
				lastUsageTimer = setTimeout(() => {
					lastUsage = null;
					lastUsageTimer = null;
				}, 12000);
			}

			await tick();
		} catch (err) {
			// Roll back the placeholder rows we appended.
			const removeCount = rowIndices.length;
			sentences.splice(startIdx, removeCount);
			color_map.splice(startIdx, removeCount);
			word_spans.splice(startIdx, removeCount);
			for (let i = 0; i < equivalency.length; i++) {
				equivalency[i].splice(startIdx, removeCount);
			}

			if (!controller.signal.aborted) {
				translateError = {
					message: err instanceof Error ? err.message : String(err),
					targets: [...targets]
				};
			}
			pendingTranslation = null;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	function cancelPendingTranslation() {
		pendingTranslation?.abort.abort();
	}

	function retryTranslate() {
		if (!translateError) return;
		const targets = translateError.targets;
		translateError = null;
		startTranslate(targets);
	}

	function dismissTranslateError() {
		translateError = null;
	}

	function endonymFor(tag: string): string {
		const opt = getLocaleOptions($locale).find((o) => o.value === tag);
		return opt?.endonym ?? tag;
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
	}

	let modifying = $state(-1);
	let wordsBeforeModify: string[] = $state([]);

	let loading = $state(false);

	function getExportBackgroundColor(): string {
		// Exports are forced to white regardless of the active UI theme so PNG/PDF/SVG
		// output looks consistent whether the author is in light or dark mode. If a
		// future feature lets users choose an export background, branch here.
		return 'white';
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

	let exportOpen = $state(false);
	let exportWrapper: HTMLDivElement | undefined = $state();
	let exportTrigger: HTMLButtonElement | undefined = $state();
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

	let examplesWrapper: HTMLDivElement | undefined = $state();
	let examplesTrigger: HTMLButtonElement | undefined = $state();
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
				'background-color': getExportBackgroundColor()
			}
		});
	}

	function exportJson() {
		const data = { sentences, equivalency };
		save(JSON.stringify(data), 'application/json', exportFilename('json'));
		closeExportMenu();
	}

	function exportTsv() {
		// One column per sentence (header = displayName ?? lang), one row per
		// equivalency entry (the alignment groups). A cell holds the joined
		// token text for that sentence's slice of the entry; missing slices
		// (the ❌ row in the UI) render as empty cells.
		// Tabs and newlines inside cells get replaced with single spaces — TSV
		// has no robust quoting and most spreadsheets choke on embedded
		// delimiters more than they care about losing whitespace.
		const cleanCell = (text: string) => text.replace(/[\t\r\n]+/g, ' ');

		const headers = sentences.map((s) => cleanCell(s.displayName ?? s.lang));
		const rows = equivalency.map((entry) =>
			entry.map((wordIndices, sentenceIndex) => {
				if (!wordIndices || wordIndices.length === 0) return '';
				const tokens = sentences[sentenceIndex]?.tokens ?? [];
				return cleanCell(wordIndices.map((i) => tokens[i]?.text ?? '').join(' '));
			})
		);

		const tsv = [headers, ...rows].map((cols) => cols.join('\t')).join('\n') + '\n';
		// Prefix BOM so Excel detects UTF-8 (TSV opens straight into Excel).
		save('﻿' + tsv, 'text/tab-separated-values;charset=utf-8', exportFilename('tsv'));
		closeExportMenu();
	}

	function exportText() {
		// Plain-text representation of the alignment for contexts that can't
		// render the SVG (chat, email, code review). Each content token gets
		// a Unicode-subscript suffix matching its equivalency-entry index, so
		// the reader can mentally re-link tokens across sentences.
		// Unaligned tokens (-1 in color_map) and whitespace/punctuation tokens
		// stay un-marked.
		const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
		const toSubscript = (n: number) =>
			String(n)
				.split('')
				.map((d) => SUBSCRIPTS[Number(d)] ?? d)
				.join('');

		const lines = sentences.map((sentence, sentenceIndex) => {
			const label = sentence.displayName ?? sentence.lang;
			const parts = sentence.tokens.map((token, tokenIndex) => {
				const text = token.text;
				const group = color_map[sentenceIndex]?.[tokenIndex] ?? -1;
				// Whitespace renders as itself; punctuation as itself; only "content"
				// tokens (the same ones the UI lets you align) get the marker.
				if (/^\s+$/u.test(text)) return text;
				if (/^\p{P}+$/u.test(text)) return text;
				if (group < 0) return text;
				return `${text}${toSubscript(group + 1)}`;
			});
			return `${label}:\t${parts.join('')}`;
		});

		save(lines.join('\n') + '\n', 'text/plain;charset=utf-8', exportFilename('txt'));
		closeExportMenu();
	}

	function buildSvgString(): string | null {
		if (!output) return null;
		const serializer = new XMLSerializer();
		const svgDocument = elementToSVG(output);
		return serializer.serializeToString(svgDocument);
	}

	function exportSvg() {
		const svgString = buildSvgString();
		if (svgString === null) {
			closeExportMenu();
			return;
		}
		save(svgString, 'image/svg+xml', exportFilename('svg'));
		closeExportMenu();
	}

	function exportHtml() {
		const svgString = buildSvgString();
		if (svgString === null) {
			closeExportMenu();
			return;
		}
		const langs = sentences
			.map((s) => s.lang)
			.filter(Boolean)
			.join(' · ');
		const firstWords = sentences[0]?.tokens
			.map((t) => t.text)
			.filter((text) => !/^[\s\p{P}]+$/u.test(text))
			.slice(0, 8)
			.join(' ');
		const title = [firstWords, langs].filter(Boolean).join(' — ') || 'Word Order Illustrator export';
		const escapedTitle = title.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
		const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>${escapedTitle}</title>
<style>
:root { color-scheme: light; }
html, body { margin: 0; padding: 0; background: #ffffff; color: #222222; }
body {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	box-sizing: border-box;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}
svg { max-width: 100%; height: auto; }
</style>
</head>
<body>
${svgString}
</body>
</html>
`;
		save(html, 'text/html', exportFilename('html'));
		closeExportMenu();
	}

	async function exportPng() {
		try {
			const png = await exportPngBlob(rasterScale);
			if (png) save(png, 'image/png', exportFilename('png'));
		} catch (err) {
			console.error('Export PNG failed:', err);
		} finally {
			closeExportMenu();
		}
	}

	type SocialPreset = { id: string; label: string; width: number; height: number };
	// Sized for the platforms' link-card / in-feed image slots as of early 2026.
	const SOCIAL_PRESETS: SocialPreset[] = [
		{ id: 'twitter-card', label: 'X / Twitter (1600 × 900)', width: 1600, height: 900 },
		{ id: 'instagram-square', label: 'Instagram square (1080 × 1080)', width: 1080, height: 1080 },
		{ id: 'instagram-portrait', label: 'Instagram portrait (1080 × 1350)', width: 1080, height: 1350 },
		{ id: 'facebook-link', label: 'Facebook link (1200 × 630)', width: 1200, height: 630 },
		{ id: 'linkedin-link', label: 'LinkedIn link (1200 × 627)', width: 1200, height: 627 }
	];

	async function exportSocial(preset: SocialPreset) {
		if (!output) return;
		try {
			// Render the natural-size PNG first, then composite onto a canvas of
			// the preset dimensions so we don't have to fight the dom-to-image
			// scale math for non-aspect-preserving targets.
			const source = await exportPngBlob(2);
			if (!source) return;

			const sourceUrl = URL.createObjectURL(source);
			try {
				const img = new Image();
				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error('Image load failed'));
					img.src = sourceUrl;
				});

				const canvas = document.createElement('canvas');
				canvas.width = preset.width;
				canvas.height = preset.height;
				const ctx = canvas.getContext('2d');
				if (!ctx) return;
				ctx.fillStyle = getExportBackgroundColor();
				ctx.fillRect(0, 0, preset.width, preset.height);

				// Fit-contain with 5% padding so the diagram never kisses the edges.
				const pad = 0.05;
				const maxW = preset.width * (1 - pad * 2);
				const maxH = preset.height * (1 - pad * 2);
				const scale = Math.min(maxW / img.width, maxH / img.height);
				const drawW = img.width * scale;
				const drawH = img.height * scale;
				const drawX = (preset.width - drawW) / 2;
				const drawY = (preset.height - drawH) / 2;
				ctx.imageSmoothingQuality = 'high';
				ctx.drawImage(img, drawX, drawY, drawW, drawH);

				const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
				if (out) save(out, 'image/png', exportFilename(`${preset.id}.png`));
			} finally {
				URL.revokeObjectURL(sourceUrl);
			}
		} catch (err) {
			console.error(`Export social (${preset.id}) failed:`, err);
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
			const widthPx = output.clientWidth;
			const heightPx = output.clientHeight;
			const orientation = widthPx >= heightPx ? 'landscape' : 'portrait';
			const pdf = new jsPDF({
				orientation,
				unit: 'px',
				format: [widthPx, heightPx],
				hotfixes: ['px_scaling']
			});

			// Vector PDF: render via the same dom-to-svg pipeline as Export SVG,
			// then hand the SVG element to svg2pdf so text stays selectable and
			// lines stay crisp at any zoom (vs. the prior raster-embed PNG).
			const svgString = buildSvgString();
			if (!svgString) throw new Error('SVG serialisation failed');
			const svgDoc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
			const svgRoot = svgDoc.documentElement as unknown as SVGSVGElement;
			// svg2pdf walks the live DOM, so attach the SVG off-screen for layout.
			// Visibility hidden but still in flow so getComputedStyle resolves.
			const host = document.createElement('div');
			host.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;';
			host.appendChild(svgRoot);
			document.body.appendChild(host);
			try {
				const { svg2pdf } = await import('svg2pdf.js');
				await svg2pdf(svgRoot, pdf, { x: 0, y: 0, width: widthPx, height: heightPx });
			} finally {
				host.remove();
			}

			pdf.save(exportFilename('pdf'));
		} catch (err) {
			console.error('Export PDF failed:', err);
		} finally {
			closeExportMenu();
		}
	}

	let output: HTMLOutputElement | undefined = $state();
	// Prevent empty entry from existing
	run(() => {
		equivalency = equivalency.filter((entry) => !entry.every((sentence) => sentence.length === 0));
	});
	let pendingSentenceSet = $derived(new Set<number>(pendingTranslation?.rowIndices ?? []));
	// Persist every appearance / parameter knob in a single localStorage
	// blob so the next visit restores the user's full setup, not just the
	// three fields that used to have dedicated keys.
	run(() => {
		if (!mounted) return;
		saveParams({
			verticalGap,
			lineGap,
			lineWidth,
			lineStyle,
			lineHalo,
			lineHaloWidth,
			tokenGap,
			straightLength,
			endpointCorrection,
			curvature,
			alignment,
			fontFamily,
			fontStyle,
			fontSize,
			glossFontSize,
			spaceWidth,
			letterSpacing,
			palette,
			rasterScale,
			outputMargin
		});
	});
	// Autosave on any change to sentences or equivalency. Skip while a translation is pending
	// so we don't persist the empty placeholder rows.
	run(() => {
		if (mounted && !pendingTranslation) saveDoc({ schemaVersion: 1, sentences, equivalency });
	});
	// Pass editingAnnotations* explicitly so Svelte tracks them as reactive deps —
	// if they were only read inside buildEditedSentence, nested mutations from the
	// lane editor (annotationsAbove[i][j] = x) wouldn't re-trigger this block.
	let previewSentences = $derived(
		modifying === -1
			? sentences
			: sentences.map((sentence, index) =>
					index === modifying
						? buildEditedSentence(
								sentence.lang,
								editingText.split(/[|]/u).filter(Boolean),
								editingAnnotationsAbove,
								editingAnnotationsBelow,
								editingShowGloss
							)
						: sentence
				)
	);
	let canonicalUrl = $derived(getCanonicalUrl($page.url.origin));
	let ogImageUrl = $derived(getOgImageUrl($page.url.origin));
	let metaTitle = $derived($LL.meta.title());
	let metaDescription = $derived($LL.meta.description());
	let metaKeywords = $derived($LL.meta.keywords());
	let metaImageAlt = $derived($LL.meta.imageAlt());
	let jsonLd = $derived(
		getJsonLd($page.url.origin, {
			name: metaTitle,
			description: metaDescription,
			locale: $locale
		})
	);
</script>

<svelte:window
	onpointerdown={(e) => {
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
	onkeydown={(e) => {
		if (e.key === 'Escape' && exportOpen) closeExportMenu(true);
		if (e.key === 'Escape' && examplesOpen) closeExamplesMenu(true);
	}}
/>

{#if shareLoadError}
	<div class="share-load-error" role="alert">
		<iconify-icon icon="mdi:link-off" inline="true"></iconify-icon>
		<span>{$LL.menu.shareLoadError()}</span>
		<button type="button" class="dismiss" aria-label={$LL.menu.shareLoadErrorDismiss()} onclick={() => (shareLoadError = false)}>
			<iconify-icon icon="mdi:close" inline="true"></iconify-icon>
		</button>
	</div>
{/if}

<header class="menu" class:editing-context={modifying !== -1}>
	<button
		disabled={mode === 'edit'}
		onclick={() => {
			if (!confirm($LL.confirm.new())) return;

			sentences = [];
			equivalency = [];
		}}
	>
		<iconify-icon icon="eos-icons:content-new"></iconify-icon>
		{$LL.menu.new()}
	</button>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="examples-dropdown"
		class:open={examplesOpen}
		bind:this={examplesWrapper}
		onmouseenter={openExamplesMenu}
		onmouseleave={scheduleExamplesClose}
	>
		<button
			class="examples-trigger"
			disabled={mode === 'edit'}
			aria-haspopup="true"
			aria-expanded={examplesOpen}
			bind:this={examplesTrigger}
			onclick={() => (examplesOpen ? closeExamplesMenu() : openExamplesMenu())}
			onfocus={openExamplesMenu}
		>
			<iconify-icon icon="mdi:bookshelf"></iconify-icon>
			{$LL.menu.examples()}
			<iconify-icon icon="mdi:chevron-down" inline="true" class="chevron"></iconify-icon>
		</button>
		<div class="examples-menu" role="group" aria-label={$LL.menu.examples()}>
			{#each EXAMPLES as example (example.id)}
				<button type="button" disabled={mode === 'edit'} onclick={() => loadExample(example)}>
					<span class="example-name">{example.name}</span>
					<span class="example-langs">{example.sentences.map((s) => s.lang).join(' · ')}</span>
				</button>
			{/each}
		</div>
	</div>
	<button
		disabled={mode === 'edit'}
		onclick={() => {
			open(load);
		}}
	>
		<iconify-icon icon="uil:import"></iconify-icon>
		{$LL.menu.import()}</button
	>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="export-dropdown" class:open={exportOpen} bind:this={exportWrapper} onmouseenter={openExportMenu} onmouseleave={scheduleExportClose}>
		<button
			class="export-trigger"
			disabled={mode === 'edit'}
			aria-haspopup="true"
			aria-expanded={exportOpen}
			bind:this={exportTrigger}
			onclick={() => (exportOpen ? closeExportMenu() : openExportMenu())}
			onfocus={openExportMenu}
		>
			<iconify-icon icon="uil:export"></iconify-icon>
			{$LL.menu.export()}
			<iconify-icon icon="mdi:chevron-down" inline="true" class="chevron"></iconify-icon>
		</button>
		<div class="export-menu" role="group" aria-label={$LL.menu.export()}>
			<div class="export-section-label">{$LL.menu.shareSection()}</div>
			<button
				type="button"
				class:share-long={shareFeedback === 'long'}
				disabled={mode === 'edit'}
				title={shareFeedback === 'long'
					? $LL.menu.shareLong({ length: shareUrlLength })
					: shareFeedback === 'copied'
						? $LL.menu.shareCopied()
						: $LL.menu.share()}
				onclick={copyShareLink}
			>
				<iconify-icon
					icon={shareFeedback === 'long' ? 'mdi:alert-outline' : shareFeedback === 'copied' ? 'mdi:check' : 'mdi:link-variant'}
					inline="true"
				></iconify-icon>
				{shareFeedback === 'long' ? $LL.menu.shareLongShort() : shareFeedback === 'copied' ? $LL.menu.shareCopied() : $LL.menu.share()}
			</button>
			<button type="button" disabled={mode === 'edit'} onclick={openQrDialog}>
				<iconify-icon icon="mdi:qrcode" inline="true"></iconify-icon>
				{$LL.menu.qr()}
			</button>
			<div class="export-section-label">{$LL.menu.fileSection()}</div>
			<button type="button" disabled={mode === 'edit'} onclick={exportJson}>
				<iconify-icon icon="mdi:code-braces" inline="true"></iconify-icon>
				JSON
			</button>
			<button type="button" disabled={mode === 'edit'} onclick={exportTsv}>
				<iconify-icon icon="mdi:table" inline="true"></iconify-icon>
				TSV
			</button>
			<button type="button" disabled={mode === 'edit'} onclick={exportText}>
				<iconify-icon icon="mdi:text" inline="true"></iconify-icon>
				Text
			</button>
			<button type="button" disabled={mode === 'edit'} onclick={exportSvg}>
				<iconify-icon icon="mdi:vector-square" inline="true"></iconify-icon>
				SVG
			</button>
			<button type="button" disabled={mode === 'edit'} onclick={exportPng}>
				<iconify-icon icon="mdi:image-outline" inline="true"></iconify-icon>
				PNG
			</button>
			<button type="button" disabled={mode === 'edit'} onclick={exportPdf}>
				<iconify-icon icon="mdi:file-pdf-box" inline="true"></iconify-icon>
				PDF
			</button>
			<button type="button" disabled={mode === 'edit'} onclick={exportHtml}>
				<iconify-icon icon="mdi:language-html5" inline="true" />
				HTML
			</button>
			<div class="export-scale-row">
				<label for="raster-scale-select">{$LL.menu.rasterScale()}</label>
				<select id="raster-scale-select" bind:value={rasterScale} disabled={mode === 'edit'}>
					{#each RASTER_SCALES as s (s)}
						<option value={s}>{s}×</option>
					{/each}
				</select>
			</div>
			<div class="export-section-label">{$LL.menu.socialSection()}</div>
			{#each SOCIAL_PRESETS as preset (preset.id)}
				<button type="button" class="export-social" disabled={mode === 'edit'} onclick={() => exportSocial(preset)}>
					<iconify-icon icon="mdi:share-variant-outline" inline="true"></iconify-icon>
					{preset.label}
				</button>
			{/each}
		</div>
	</div>
	<button class="about-button" title={$LL.menu.settings()} aria-label={$LL.menu.settings()} onclick={() => (settingsOpen = true)}>
		<iconify-icon icon="mdi:cog-outline"></iconify-icon>
		{$LL.menu.settings()}
	</button>
	<button class="about-button" title={$LL.menu.about()} aria-label={$LL.menu.about()} onclick={() => (aboutOpen = true)}>
		<iconify-icon icon="mdi:information-outline"></iconify-icon>
		{$LL.menu.about()}
	</button>
	<div class="menu-locale">
		<ThemeToggle />
		<LocaleSelect />
	</div>
</header>

<AboutDialog bind:open={aboutOpen} />
<SettingsDialog bind:open={settingsOpen} />
<QrDialog bind:open={qrOpen} url={qrUrl} />
<TranslatePopover
	bind:open={translatePopoverOpen}
	sourceLangs={sentences.map((s) => s.lang)}
	sourceTokenCounts={sentences.map((s) => s.tokens.length)}
	on:submit={({ detail }) => startTranslate(detail.targets)}
	on:openSettings={() => {
		translatePopoverOpen = false;
		settingsOpen = true;
	}}
	on:close={() => (translatePopoverOpen = false)}
/>

{#if translateError}
	<div class="translate-progress" role="alert">
		<div class="translate-slot errored">
			<span class="translate-slot-lang">
				<iconify-icon icon="mdi:alert-circle-outline" inline="true"></iconify-icon>
			</span>
			<span class="translate-slot-error" title={translateError.message}>{translateError.message}</span>
			<button type="button" class="translate-slot-action" title={$LL.translate.retry()} onclick={retryTranslate} aria-label={$LL.translate.retry()}>
				<iconify-icon icon="mdi:refresh" inline="true"></iconify-icon>
			</button>
			<button
				type="button"
				class="translate-slot-action"
				title={$LL.translate.dismissError()}
				onclick={dismissTranslateError}
				aria-label={$LL.translate.dismissError()}
			>
				<iconify-icon icon="material-symbols:close-rounded" inline="true"></iconify-icon>
			</button>
		</div>
	</div>
{/if}

{#if lastUsage}
	<div class="usage-chip" role="status">
		<iconify-icon icon="mdi:counter" inline="true"></iconify-icon>
		<span class="usage-chip-text">
			{$LL.translate.usage({
				input: lastUsage.inputTokens.toLocaleString(),
				output: lastUsage.outputTokens.toLocaleString(),
				model: lastUsage.model
			})}
		</span>
		<button
			type="button"
			class="usage-chip-dismiss"
			aria-label={$LL.translate.usageDismiss()}
			onclick={() => {
				lastUsage = null;
				if (lastUsageTimer) {
					clearTimeout(lastUsageTimer);
					lastUsageTimer = null;
				}
			}}
		>
			<iconify-icon icon="mdi:close" inline="true"></iconify-icon>
		</button>
	</div>
{/if}

<main>
	<div class="output" class:editing-active={modifying !== -1} bind:this={outputContainer}>
		<div class="output-scroll">
			{#if mounted}
				<Output
					sentences={previewSentences}
					{color_map}
					{equivalency}
					pendingIndices={pendingSentenceSet}
					{alignment}
					bind:lines
					colors={displayColors}
					{verticalGap}
					{lineGap}
					{lineWidth}
					{lineStyle}
					{lineHalo}
					{lineHaloWidth}
					{straightLength}
					{endpointCorrection}
					{curvature}
					{fontFamily}
					{fontStyle}
					{fontSize}
					{glossFontSize}
					{spaceWidth}
					{letterSpacing}
					{tokenGap}
					bind:outputMargin
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

						for (const [i, entry] of equivalency.entries()) {
							const value = entry[from];
							entry.splice(from, 1);
							entry.splice(to, 0, value);
							equivalency[i] = entry;
						}
					}}
					on:delete={({ detail: { sentence } }) => {
						sentences.splice(sentence, 1);

						for (const [i, entry] of equivalency.entries()) {
							entry.splice(sentence, 1);
							equivalency[i] = entry;
						}
					}}
					on:modify={({ detail: { sentence } }) => {
						modifying = sentence;
						const src = sentences[sentence];
						wordsBeforeModify = getSentenceWords(src);
						editingText = wordsBeforeModify.join('|');
						annotationsAboveBeforeModify = Array.from({ length: src.lanesAbove }, (_, lane) => src.tokens.map((t) => t.annotationsAbove[lane] ?? ''));
						annotationsBelowBeforeModify = Array.from({ length: src.lanesBelow }, (_, lane) => src.tokens.map((t) => t.annotationsBelow[lane] ?? ''));
						editingAnnotationsAbove = annotationsAboveBeforeModify.map((lane) => [...lane]);
						editingAnnotationsBelow = annotationsBelowBeforeModify.map((lane) => [...lane]);
						editingShowGloss = src.showGloss;
						editingSelectionStart = -1;
						editingSelectionEnd = -1;
					}}
					on:cancelTranslate={cancelPendingTranslation}
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
					on:renameLanguage={({ detail: { sentence, displayName } }) => {
						const target = sentences[sentence];
						if (!target) return;
						if (displayName === undefined) delete target.displayName;
						else target.displayName = displayName;
					}}
				/>
			{/if}
		</div>
	</div>

	<div class="input" class:editing-active={modifying !== -1} bind:this={inputContainer}>
		<SentenceInput
			on:submit={onsubmit}
			on:openTranslate={() => (translatePopoverOpen = true)}
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
			bind:lineStyle
			bind:lineHalo
			bind:lineHaloWidth
			bind:straightLength
			bind:endpointCorrection
			bind:curvature
			bind:alignment
			bind:fontFamily
			bind:fontStyle
			bind:fontSize
			bind:glossFontSize
			bind:spaceWidth
			bind:letterSpacing
			bind:tokenGap
			bind:palette
		/>
	</div>

	<div class="equivalency" class:editing-muted={modifying !== -1}>
		<Equivalency
			{sentences}
			{equivalency}
			{colors}
			bind:dragPreview
			onreorder={({ from, to }) => {
				const entry = equivalency[from];
				equivalency.splice(from, 1);
				equivalency.splice(to, 0, entry);
			}}
			onscramble={() => {
				const n = equivalency.length;
				if (n <= 2) {
					equivalency.reverse();
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
			><iconify-icon icon="mdi:github" inline="true"></iconify-icon></a
		>,
		<a href="https://twitter.com/mkpoli/status/1562786122782380036" title={$LL.footer.announcement()} class="twitter-link"
			><iconify-icon icon="mdi:twitter" inline="true"></iconify-icon></a
		>) {$LL.footer.by({ author: '@mkpoli' })} (
		<a href="https://twitter.com/mkpoli/" class="twitter-link"><iconify-icon icon="mdi:twitter" inline="true"></iconify-icon></a>,
		<a href="https://mkpo.li/" class="home-link"><iconify-icon icon="mdi:home" inline="true"></iconify-icon></a>
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
		background: color-mix(in srgb, var(--color-bg) 96%, transparent);
		z-index: -2;
		opacity: 0;
		transition: opacity 180ms ease;
	}

	main:has(:global(.output.editing-active))::before {
		opacity: 1;
	}

	footer {
		text-align: center;
		padding: 1em;

		color: var(--color-text-muted);
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
		color: light-dark(#181717, #e6eaef);
	}

	footer a.github-link:visited {
		color: light-dark(#181717, #e6eaef);
	}

	footer a.twitter-link {
		color: light-dark(#1d9bf0, #4dbcff);
	}

	footer a.twitter-link:visited {
		color: light-dark(#1d9bf0, #4dbcff);
	}

	footer a.home-link {
		color: var(--color-text-muted);
	}

	footer a.home-link:visited {
		color: var(--color-text-muted);
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

	/* TODO(#56-followup): the rendered diagram itself is intentionally pinned
	   to the light palette so PNG/SVG/PDF exports look consistent regardless
	   of the author's UI theme. Once we ship background-customization
	   (related: #48 palettes, possibly a new "canvas bg" picker), revisit and
	   let the canvas honour the active theme — or, better, an explicit
	   per-document background choice.
	   Scoped to the inner <output> element so the .output wrapper still picks
	   up the page palette (used by the rim shadow). */
	.output :global(output) {
		color-scheme: light;
		--color-bg: #ffffff;
		--color-surface: #ffffff;
		--color-surface-elevated: #ffffff;
		--color-text: #222222;
		--color-text-muted: #555555;
		--color-text-faint: #777777;
		--color-border: #cccccc;
		--color-border-soft: #eeeeee;
		--color-hover: #eeeeee;
		--color-shadow: rgb(0 0 0 / 0.18);
		--color-accent-text: rgb(33 56 199);
		background: #ffffff;
		color: #222222;
		/* Rim hugs the actual diagram width, not the full column. Lives on
		   <output> rather than .output-scroll so it doesn't extend to the
		   viewport edges when the diagram is narrower than the column. */
		border-radius: 0.4em;
		box-shadow:
			0 1px 3px 0 var(--page-shadow, rgb(0 0 0 / 0.18)),
			0 0 0 1px var(--page-border-soft, #eeeeee);
	}

	/* Horizontal scroll lives on this inner wrapper, not on .output itself,
	   so .output's overflow stays visible and the ::after editing indicator
	   below the box can render. Padding gives the inner <output>'s rim shadow
	   room to render before .output-scroll's overflow clips it. */
	.output-scroll {
		overflow-x: auto;
		overflow-y: hidden;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior-x: contain;
		/* Centre the <output> when it fits; the flex container still scrolls
		   horizontally when the diagram exceeds the viewport because the inner
		   <output> uses flex-shrink: 0. Avoids relying on margin-inline:auto on
		   <output> itself, which would bake a non-zero computed margin into
		   exported clones and push them off to one side. */
		display: flex;
		justify-content: center;
		padding: 6px 6px 8px;
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

		main:has(:global(.output.editing-active)) {
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

	.share-load-error {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin: 0.6em 1em 0;
		padding: 0.55em 0.85em;
		background: rgb(220 60 60 / 0.08);
		border: 1px solid rgb(220 60 60 / 0.3);
		color: var(--color-text);
		font-size: 0.92em;
		border-radius: 0.4em;
	}
	.share-load-error :global(iconify-icon) {
		color: rgb(180 40 40);
		font-size: 1.1em;
	}
	.share-load-error .dismiss {
		margin-inline-start: auto;
		appearance: none;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		padding: 0.1em 0.3em;
		border-radius: 0.2em;
	}
	.share-load-error .dismiss:hover {
		background: var(--color-hover);
	}

	.menu-locale {
		margin-inline-start: auto;
		display: flex;
		align-items: stretch;
		gap: 0.4rem;
		flex: 0 1 18rem;
		max-width: 18rem;
	}

	.menu button {
		appearance: none;
		padding: 0.5em 1em;
		border: 1px solid var(--color-border-soft);
		border-radius: 0.2em;

		font-weight: bold;
		font-size: 1.02em;

		background-color: var(--color-surface);
		color: var(--color-text);

		box-shadow: 0 1px 3px 0 var(--color-shadow);

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
	}

	.menu button:not(:disabled):hover {
		background-color: var(--color-hover);
		border-color: var(--color-border);
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
		background: var(--color-surface);
		border-radius: 0.3em;
		box-shadow:
			1px 1px 5px 0 var(--color-shadow),
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
		color: var(--color-text);
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
		color: var(--color-text-muted);
	}

	.export-menu button:not(:disabled):hover,
	.export-menu button:focus-visible {
		background-color: var(--color-hover);
		outline: none;
	}

	.export-menu button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.export-scale-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6em;
		padding: 0.4em 0.85em 0.2em;
		margin-top: 0.25em;
		border-top: 1px solid var(--color-border-soft);
		font-size: 0.85em;
		color: var(--color-text-muted);
	}

	.export-scale-row label {
		font-weight: 600;
		white-space: nowrap;
	}

	.export-section-label {
		padding: 0.6em 0.85em 0.25em;
		margin-top: 0.4em;
		border-top: 1px solid var(--color-border-soft);
		font-size: 0.72em;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-faint);
	}

	/* The first label in the menu sits flush against the top padding — no
	   horizontal rule needed before it. */
	.export-section-label:first-child {
		margin-top: 0;
		padding-top: 0.1em;
		border-top: none;
	}

	.export-menu button.export-social {
		font-weight: normal;
		font-size: 0.92em;
	}

	.export-scale-row select {
		font: inherit;
		font-weight: bold;
		padding: 0.15em 0.35em;
		border-radius: 0.25em;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.export-scale-row select:disabled {
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
		background: var(--color-surface);
		border-radius: 0.3em;
		box-shadow:
			1px 1px 5px 0 var(--color-shadow),
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
		color: var(--color-text);
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
		color: var(--color-text);
	}

	.examples-menu .example-langs {
		flex: 0 1 auto;
		min-width: 0;
		max-width: 50%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.7em;
		color: var(--color-text-faint);
		letter-spacing: 0.02em;
	}

	.examples-menu button:not(:disabled):hover,
	.examples-menu button:focus-visible {
		background-color: var(--color-hover);
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

	.translate-progress {
		position: fixed;
		bottom: 1.2em;
		right: 1.2em;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		z-index: 800;
		max-width: min(24em, calc(100vw - 2em));
	}

	.usage-chip {
		position: fixed;
		bottom: 1.2em;
		right: 1.2em;
		display: flex;
		align-items: center;
		gap: 0.5em;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 0.4em 0.5em 0.4em 0.85em;
		box-shadow: 0 6px 20px var(--color-shadow);
		font-size: 0.85em;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		z-index: 700;
		max-width: min(28em, calc(100vw - 2em));
	}
	.usage-chip :global(iconify-icon) {
		color: var(--color-accent-text);
		font-size: 1.05em;
	}
	.usage-chip-text {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.usage-chip-dismiss {
		appearance: none;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		padding: 0.15em 0.3em;
		border-radius: 999px;
		margin-inline-start: auto;
	}
	.usage-chip-dismiss:hover {
		background: var(--color-hover);
	}

	.translate-slot {
		display: grid;
		grid-template-columns: auto 1fr auto auto auto;
		align-items: center;
		gap: 0.6em;
		background: var(--color-surface);
		border: 1px solid rgb(46 91 255 / 0.3);
		border-radius: 0.5em;
		padding: 0.55em 0.8em;
		box-shadow: 0 6px 20px rgb(23 36 78 / 0.18);
		font-size: 0.9em;
		color: rgb(45 55 80);
	}

	.translate-slot.errored {
		border-color: rgb(220 38 38 / 0.5);
		background: rgb(220 38 38 / 0.06);
		color: rgb(140 24 24);
	}

	.translate-slot-lang {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		font-weight: 600;
		color: rgb(33 56 199);
	}

	.translate-slot.errored .translate-slot-lang {
		color: rgb(140 24 24);
	}

	.translate-bar {
		width: 100%;
		height: 4px;
		background: rgb(46 91 255 / 0.12);
		border-radius: 2px;
		overflow: hidden;
		position: relative;
	}

	.translate-bar-inner {
		position: absolute;
		top: 0;
		left: -40%;
		width: 40%;
		height: 100%;
		background: linear-gradient(to right, rgb(73 132 255), rgb(44 71 255));
		border-radius: 2px;
		animation: translate-bar-slide 1.2s ease-in-out infinite;
	}

	@keyframes translate-bar-slide {
		0% {
			left: -40%;
		}
		100% {
			left: 100%;
		}
	}

	.translate-slot-time {
		font-variant-numeric: tabular-nums;
		font-size: 0.85em;
		color: rgb(74 82 112);
	}

	.translate-slot-error {
		font-size: 0.88em;
		word-break: break-word;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.translate-slot-action {
		appearance: none;
		background: none;
		border: none;
		padding: 0.15em 0.3em;
		cursor: pointer;
		color: inherit;
		border-radius: 0.3em;
		display: inline-flex;
		align-items: center;
	}

	.translate-slot-action:hover {
		background: rgb(24 33 61 / 0.08);
	}
</style>
