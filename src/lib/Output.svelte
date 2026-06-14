<script lang="ts" module>
	export type Line = [x1: number, y1: number, x2: number, y2: number, color: string];
	import { draggable } from '@neodrag/svelte';
</script>

<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onMount, tick, createEventDispatcher } from 'svelte';
	import type { Alignment, FontFamily, FontStyle, LineStyle, Mode, Sentence } from '$lib/types';
	import { getSentenceWords, sentenceHasAnyAnnotation } from '$lib/types';
	import { getLanguageName, getLocaleDirection } from './lang';
	import { LL, locale } from '$i18n/i18n-svelte';
	import Word from './Word.svelte';
	import type { Margin } from '$lib/types';

	const dispatch = createEventDispatcher<{
		connect: {
			connected: [number, number][];
			connectedIndex: number;
		};
		reorder: {
			from: number;
			to: number;
		};
		delete: {
			sentence: number;
		};
		modify: {
			sentence: number;
		};
		merge: {
			sentence: number;
			start: number;
			end: number;
		};
		split: {
			sentence: number;
			word: number;
			offset: number;
		};
		cancelTranslate: void;
		renameLanguage: {
			sentence: number;
			displayName: string | undefined;
		};
	}>();

	interface Props {
		// Data
		sentences: Sentence[];
		color_map: number[][];
		equivalency: number[][][];
		word_spans?: HTMLSpanElement[][];
		lines: Line[];
		colors: string[];
		// States
		modifying: number;
		loading: boolean;
		editingSelectionStart?: number;
		editingSelectionEnd?: number;
		pendingIndices?: Set<number>;
		// Parameters
		verticalGap: number;
		lineGap: number;
		lineWidth?: number;
		lineStyle?: LineStyle;
		/** Radius, in pixels, of the filled endpoint circles drawn where each
		 * connector meets the words. The connector stroke itself stays solid in
		 * the middle; these caps just give it a rounded dot at each end. Larger
		 * values = bigger dots; 0 (default) hides them entirely. */
		dottedEndRadius?: number;
		straightLength: number;
		endpointCorrection: number;
		curvature?: number;
		alignment?: Alignment;
		tagAlignment?: Alignment;
		fontFamily: FontFamily;
		fontStyle: FontStyle;
		fontSize: number;
		glossFontSize: number;
		spaceWidth: number;
		letterSpacing?: number;
		/** Extra inline-end margin applied between adjacent content tokens that are NOT
		 * separated by a whitespace token. Useful for scripts that don't use spaces
		 * (CJK, Thai) — spaceWidth has no effect there because there's no whitespace
		 * token to widen. Default 0. */
		tokenGap?: number;
		outputMargin?: Margin;
		mode?: Mode;
		output: HTMLOutputElement | undefined;
		/** When true, suspends the fit-to-width adjustments — set during export
		 * pipelines so the captured artifact uses the user-configured margins
		 * and 1:1 scale rather than the shrunk on-screen presentation. */
		fitDisabled?: boolean;
	}

	let {
		sentences,
		color_map,
		equivalency,
		word_spans = $bindable(sentences.map(() => [])),
		lines = $bindable(),
		colors,
		modifying,
		loading,
		editingSelectionStart = -1,
		editingSelectionEnd = -1,
		pendingIndices = new Set(),
		verticalGap,
		lineGap,
		lineWidth = 1,
		lineStyle = 'solid',
		dottedEndRadius = 0,
		straightLength,
		endpointCorrection,
		curvature = 1,
		alignment = 'center',
		tagAlignment = 'center',
		fontFamily,
		fontStyle,
		fontSize,
		glossFontSize,
		spaceWidth,
		letterSpacing = 0,
		tokenGap = 0,
		outputMargin = $bindable({ top: 0, right: 0, bottom: 0, left: 0 }),
		mode = $bindable('view'),
		output = $bindable(),
		fitDisabled = false
	}: Props = $props();
	let tokenEditDialog: HTMLDivElement | undefined = $state();

	let mounted = $state(false);

	// Fit-to-width: when the natural diagram is wider than its scroll
	// container, first shrink the horizontal margins (user-configured padding
	// of <output>) down to zero, and if that's still not enough apply CSS zoom
	// so the whole diagram visually fits without horizontal scrolling. Both
	// adjustments are reactive on container size + content geometry and are
	// suspended via `fitDisabled` during exports so artifacts keep the
	// configured margins and natural 1:1 scale.
	let fitZoom = $state(1);
	let fitPadX = $state<number | null>(null);
	let fitObserver: ResizeObserver | null = null;

	function recomputeFit() {
		if (fitDisabled || !output) {
			fitZoom = 1;
			fitPadX = null;
			return;
		}
		const parent = output.parentElement;
		if (!parent) return;
		const container = parent.clientWidth;
		if (container <= 0) return;
		// Measure natural width at 1:1 with the user's configured margins.
		// We temporarily strip our overrides so scrollWidth reflects the
		// real intrinsic content size, then restore the inline styles.
		const savedPadding = output.style.padding;
		// Cast to any so TS doesn't trip on the (now standard) zoom property.
		const styleAny = output.style as CSSStyleDeclaration & { zoom: string };
		const savedZoom = styleAny.zoom;
		output.style.padding = `${outputMargin.top}px ${outputMargin.right}px ${outputMargin.bottom}px ${outputMargin.left}px`;
		styleAny.zoom = '1';
		const natural = output.scrollWidth;
		output.style.padding = savedPadding;
		styleAny.zoom = savedZoom;
		if (natural <= container) {
			fitZoom = 1;
			fitPadX = null;
			return;
		}
		const noPad = natural - outputMargin.left - outputMargin.right;
		if (noPad <= container) {
			// Shrinking horizontal padding alone makes it fit.
			fitPadX = Math.max(0, Math.floor((container - noPad) / 2));
			fitZoom = 1;
		} else {
			// Zero out horizontal padding AND zoom down to fit.
			fitPadX = 0;
			fitZoom = container / noPad;
		}
	}

	onMount(() => {
		mounted = true;
		if (output) {
			const parent = output.parentElement;
			if (parent) {
				fitObserver = new ResizeObserver(() => recomputeFit());
				fitObserver.observe(parent);
				fitObserver.observe(output);
			}
		}
		return () => {
			fitObserver?.disconnect();
			fitObserver = null;
		};
	});

	$effect(() => {
		// Re-run fit when anything that affects natural width changes.
		void sentences;
		void outputMargin;
		void fontSize;
		void verticalGap;
		void letterSpacing;
		void spaceWidth;
		void tokenGap;
		void fitDisabled;
		if (!mounted) return;
		requestAnimationFrame(recomputeFit);
	});

	function drawLines(
		word_spans: HTMLSpanElement[][],
		equivalency: number[][][],
		verticalGap: number,
		lineGap: number,
		straightLength: number,
		endpointCorrection: number
	): Line[] {
		if (!output) return [];
		const rectOutput = output.getBoundingClientRect();

		const lines: Line[] = [];

		if (sentences.length < 2) return [];

		for (let [i, entry] of equivalency.entries()) {
			for (let j = 0; j < entry.length - 1; j++) {
				const k = j + 1; // k = index of next sentence

				const [A, B] = [entry[j], entry[k]];
				if (!A || !B) continue;

				// A = [10]
				// B = [1, 2, 5]

				// segA = [[10, 10]]
				// segB = [[1, 2], [5, 5]]

				// carteA = [[[10, 10], [1, 2]], [[10, 10], [5, 5]]

				for (const [a1, a2] of segmentate(A)) {
					for (const [b1, b2] of segmentate(B)) {
						const [spanA1, spanA2, spanB1, spanB2] = [word_spans[j][a1], word_spans[j][a2], word_spans[k][b1], word_spans[k][b2]];
						if (!spanA1 || !spanA2 || !spanB1 || !spanB2) continue;
						const rectA1 = spanA1.getBoundingClientRect();
						const rectA2 = spanA2.getBoundingClientRect();
						const rectB1 = spanB1.getBoundingClientRect();
						const rectB2 = spanB2.getBoundingClientRect();

						// min/max instead of left/right ordering so RTL rows
						// (where rectA1 is visually to the right of rectA2) still
						// midpoint the *visual* span, not the gap between tokens.
						const aLeft = Math.min(rectA1.left, rectA2.left);
						const aRight = Math.max(rectA1.right, rectA2.right);
						const bLeft = Math.min(rectB1.left, rectB2.left);
						const bRight = Math.max(rectB1.right, rectB2.right);

						// CSS zoom on <output> scales all child bounding-rect deltas by
						// the zoom factor, but the SVG inside the same zoomed parent
						// interprets path coords in pre-zoom local units. Divide here to
						// get back to local units so the rendered lines stay glued to
						// the words they connect.
						let x1 = ((aLeft + aRight) / 2 - rectOutput.left) / fitZoom;
						let y1 = getBottomEndpoint(sentences[j], spanA1, spanA2, rectOutput) / fitZoom;
						let x2 = ((bLeft + bRight) / 2 - rectOutput.left) / fitZoom;
						let y2 = getTopEndpoint(sentences[k], spanB1, spanB2, rectOutput) / fitZoom;

						const correction = endpointCorrection / ((y2 - y1) / (x2 - x1));
						x1 += correction;
						y1 += lineGap;
						x2 -= correction;
						y2 -= lineGap;

						const color = colors[i];
						lines.push([x1, y1 + straightLength, x2, y2 - straightLength, color]);

						if (straightLength !== 0) {
							lines.push([x1, y1, x1, y1 + straightLength, color]);
							lines.push([x2, y2, x2, y2 - straightLength, color]);
						}
					}
				}
			}
		}
		return lines;
	}

	/**
	 * Collect each connector's two endpoints, deduped by quantised (x,y,color).
	 * drawLines emits up to three Line segments per logical connector when
	 * `straightLength > 0` (the curved middle plus two short straight stubs);
	 * without dedup we'd stack three coincident endpoint dots and the result
	 * looks bloated.
	 */
	function uniqueEndpoints(lines: Line[]): Array<{ x: number; y: number; color: string }> {
		const out: Array<{ x: number; y: number; color: string }> = [];
		const has = (x: number, y: number, color: string) =>
			out.some((p) => Math.round(p.x) === Math.round(x) && Math.round(p.y) === Math.round(y) && p.color === color);
		for (const [x1, y1, x2, y2, color] of lines) {
			if (!has(x1, y1, color)) out.push({ x: x1, y: y1, color });
			if (!has(x2, y2, color)) out.push({ x: x2, y: y2, color });
		}
		return out;
	}

	function connectionPath(x1: number, y1: number, x2: number, y2: number, curvature: number): string {
		if (curvature === 0) return `M ${x1} ${y1} L ${x2} ${y2}`;

		const middleY = (y1 + y2) / 2;
		const controlY1 = y1 + (middleY - y1) * curvature;
		const controlY2 = y2 + (middleY - y2) * curvature;

		return `M ${x1} ${y1} C ${x1} ${controlY1}, ${x2} ${controlY2}, ${x2} ${y2}`;
	}

	function segmentate(arr: number[]): number[][] {
		const array = [...new Set(arr)].sort((a, b) => a - b);
		if (array.length === 0) return [];

		const result: number[][] = [];
		let segment: [start: number, end: number] = [array[0], array[0]];

		for (let i = 0; i <= array.length - 1; i++) {
			const [curr, next] = [array[i], array[i + 1]];

			if (curr + 1 === next) {
				segment = [segment[0], next];
			} else {
				result.push(segment);
				segment = [next, next];
			}
		}

		return result;
	}

	let connecting: [l: number, w: number][] = $state([]);

	function isContent(word: string) {
		return !word.match(/^(\s|\p{P}+)$/u);
	}

	function isWhitespace(word: string) {
		return !!word.match(/^\s+$/u);
	}

	function sentenceShowsGloss(sentence: Sentence): boolean {
		return sentence.showGloss || sentence.lanesAbove > 0 || sentence.lanesBelow > 0 || sentenceHasAnyAnnotation(sentence);
	}

	function getTopEndpoint(sentence: Sentence, span1: HTMLSpanElement, span2: HTMLSpanElement, rectOutput: DOMRect): number {
		const rect1 = span1.getBoundingClientRect();
		const rect2 = span2.getBoundingClientRect();
		const wordTop = Math.min(rect1.top, rect2.top) - rectOutput.top;

		if (!sentenceShowsGloss(sentence) || sentence.lanesAbove === 0) return wordTop;

		const aboveStacks = [span1, span2]
			.map((span) => span.parentElement?.querySelector('.annotations-above'))
			.filter((element): element is HTMLElement => element instanceof HTMLElement)
			.map((element) => element.getBoundingClientRect());

		if (aboveStacks.length === 0) return wordTop;

		return Math.min(...aboveStacks.map((rect) => rect.top)) - rectOutput.top;
	}

	function getBottomEndpoint(sentence: Sentence, span1: HTMLSpanElement, span2: HTMLSpanElement, rectOutput: DOMRect): number {
		const rect1 = span1.getBoundingClientRect();
		const rect2 = span2.getBoundingClientRect();
		const wordBottom = Math.max(rect1.bottom, rect2.bottom) - rectOutput.top;

		if (!sentenceShowsGloss(sentence) || sentence.lanesBelow === 0) return wordBottom;

		const belowStacks = [span1, span2]
			.map((span) => span.parentElement?.querySelector('.annotations-below'))
			.filter((element): element is HTMLElement => element instanceof HTMLElement)
			.map((element) => element.getBoundingClientRect());

		if (belowStacks.length === 0) return wordBottom;

		return Math.max(...belowStacks.map((rect) => rect.bottom)) - rectOutput.top;
	}

	let connected: [l: number, w: number][] = $state([]);
	let connectedIndex = $state(-1);
	let tokenAnchor = $state(-1);
	let selectedWordStart = $state(-1);
	let selectedWordEnd = $state(-1);

	// Dragging to reorder
	let draggingIndex = $state(-1);
	let draggingPosition = { x: 0, y: 0 };
	let draggingOffset = $state({ x: 0, y: 0 });
	/** Visual drop index (0..sentences.length); null when not dragging. */
	let dropTargetIndex = $state<number | null>(null);
	let draggers: HTMLDivElement[] = $state([]);

	// Dragging output margins from the canvas edge.
	type MarginSide = keyof Margin;
	let marginDrag: { side: MarginSide; startPos: number; startMargin: Margin } | null = $state(null);
	const MARGIN_MAX = 200;

	const OPPOSITE: Record<MarginSide, MarginSide> = {
		top: 'bottom',
		bottom: 'top',
		left: 'right',
		right: 'left'
	};

	function clampMargin(v: number): number {
		return Math.max(0, Math.min(MARGIN_MAX, Math.round(v)));
	}

	function startMarginDrag(side: MarginSide, e: PointerEvent) {
		if (mode === 'edit' || modifying !== -1 || draggingIndex !== -1) return;
		e.preventDefault();
		e.stopPropagation();
		const vertical = side === 'top' || side === 'bottom';
		marginDrag = {
			side,
			startPos: vertical ? e.clientY : e.clientX,
			// Snapshot all four sides so modifier-key adjustments (Alt mirrors
			// to the opposite side, Shift drives all four) apply consistent
			// deltas regardless of which side was grabbed.
			startMargin: { ...outputMargin }
		};
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onMarginDragMove(e: PointerEvent) {
		if (!marginDrag) return;
		const { side, startPos, startMargin } = marginDrag;
		const vertical = side === 'top' || side === 'bottom';
		const current = vertical ? e.clientY : e.clientX;
		let delta = current - startPos;
		// Drag outward (away from the centre) to grow — top/left point outward
		// toward smaller coordinates so their delta is flipped.
		if (side === 'top' || side === 'left') delta = -delta;

		const next: Margin = { ...startMargin };
		if (e.shiftKey) {
			// Shift = grow/shrink all four sides together.
			next.top = clampMargin(startMargin.top + delta);
			next.right = clampMargin(startMargin.right + delta);
			next.bottom = clampMargin(startMargin.bottom + delta);
			next.left = clampMargin(startMargin.left + delta);
		} else if (e.altKey) {
			// Alt = mirror to the opposite side (symmetric pair).
			const opp = OPPOSITE[side];
			next[side] = clampMargin(startMargin[side] + delta);
			next[opp] = clampMargin(startMargin[opp] + delta);
		} else {
			next[side] = clampMargin(startMargin[side] + delta);
		}
		outputMargin = next;
	}

	function endMarginDrag(e: PointerEvent) {
		if (!marginDrag) return;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		marginDrag = null;
	}

	function dragstart(l: number, e: PointerEvent) {
		draggingIndex = l;
		draggers[draggingIndex]?.setPointerCapture(e.pointerId);
		draggingPosition = { x: e.clientX, y: e.clientY };
		dropTargetIndex = l;
	}

	/**
	 * The "visual" drop index — between which rows the dragged row would land,
	 * counting from 0 (above the first row) to `draggers.length` (below the
	 * last). Computed by counting how many rows have their vertical centre
	 * above the cursor. This is what the user sees, independent of the
	 * splice-mechanics adjustment we do for dispatch.
	 */
	function computeDropVisualIndex(clientY: number): number {
		let dropAt = 0;
		for (const dragger of draggers) {
			const rect = dragger.getBoundingClientRect();
			const center = (rect.top + rect.bottom) / 2;
			if (clientY > center) dropAt++;
			else break;
		}
		return dropAt;
	}

	function dragend(e: PointerEvent) {
		if (draggingIndex < 0) return;

		draggers[draggingIndex]?.releasePointerCapture(e.pointerId);

		const visual = computeDropVisualIndex(e.clientY);
		// Skip dispatch if the visual position is the same as the original
		// (drop above own row OR just below own row both leave the array
		// unchanged after splice).
		if (visual !== draggingIndex && visual !== draggingIndex + 1) {
			// Adjust for the splice(from, 1) shift: if we drop AFTER the
			// original position (visual > from), the removal moves everything
			// down by 1, so the insert index is visual - 1.
			const to = visual < draggingIndex ? visual : visual - 1;
			dispatch('reorder', { from: draggingIndex, to });
		}

		draggingIndex = -1;
		draggingOffset = { x: 0, y: 0 };
		dropTargetIndex = null;
	}

	function onpointermove(e: PointerEvent) {
		if (draggingIndex >= 0) {
			draggingOffset.x = e.clientX - draggingPosition.x;
			draggingOffset.y = e.clientY - draggingPosition.y;
			dropTargetIndex = computeDropVisualIndex(e.clientY);
		}
	}

	function getTransform(l: number, draggingOffset: { x: number; y: number }) {
		if (draggingIndex !== l) return 'none';
		return `translate(${draggingOffset.x}px, ${draggingOffset.y}px)`;
	}

	function shouldKeepEditingSelection(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		if (tokenEditDialog?.contains(target)) return true;
		if (target.closest('.sentence.modifying .word')) return true;
		return false;
	}

	type GraphemeSegmenter = { segment(input: string): Iterable<{ segment: string }> };

	function segmentGraphemes(word: string): string[] {
		const Segmenter = (
			Intl as typeof Intl & {
				Segmenter?: new (locale: string, options: { granularity: 'grapheme' }) => GraphemeSegmenter;
			}
		).Segmenter;

		if (typeof Intl !== 'undefined' && typeof Segmenter !== 'undefined') {
			return Array.from(new Segmenter('und', { granularity: 'grapheme' }).segment(word), ({ segment }) => segment).filter(Boolean);
		}

		return Array.from(word);
	}

	function resetEditingWordSelection() {
		tokenAnchor = -1;
		selectedWordStart = -1;
		selectedWordEnd = -1;
	}

	function selectEditingWord(sentence: number, word: number) {
		if (sentence !== modifying) return;

		if (selectedWordStart === -1) {
			tokenAnchor = word;
			selectedWordStart = word;
			selectedWordEnd = word;
			return;
		}

		if (selectedWordStart === selectedWordEnd) {
			if (word === selectedWordStart) return;

			selectedWordStart = Math.min(tokenAnchor, word);
			selectedWordEnd = Math.max(tokenAnchor, word);
			return;
		}

		tokenAnchor = word;
		selectedWordStart = word;
		selectedWordEnd = word;
	}

	run(() => {
		// fitZoom referenced so a fit-driven layout change (resize / margin
		// shrink / zoom apply) re-runs drawLines under the new scale.
		void fitZoom;
		if (mounted && equivalency && !loading) lines = drawLines(word_spans, equivalency, verticalGap, lineGap, straightLength, endpointCorrection);
	});
	run(() => {
		if (
			!loading &&
			alignment &&
			fontFamily &&
			fontStyle &&
			fontSize !== undefined &&
			glossFontSize !== undefined &&
			spaceWidth !== undefined &&
			letterSpacing !== undefined &&
			tokenGap !== undefined &&
			$locale
		)
			tick().then(() => {
				lines = drawLines(word_spans, equivalency, verticalGap, lineGap, straightLength, endpointCorrection);
			});
	});
	// Redraw when outputMargin changes — padding shifts every token, so connector
	// endpoints need to be recomputed.
	run(() => {
		if (mounted && !loading && outputMargin)
			tick().then(() => {
				lines = drawLines(word_spans, equivalency, verticalGap, lineGap, straightLength, endpointCorrection);
			});
	});
	run(() => {
		if (modifying === -1) {
			resetEditingWordSelection();
		}
	});
	run(() => {
		if (
			modifying !== -1 &&
			editingSelectionStart !== -1 &&
			(selectedWordStart !== editingSelectionStart || selectedWordEnd !== editingSelectionEnd)
		) {
			tokenAnchor = editingSelectionStart;
			selectedWordStart = editingSelectionStart;
			selectedWordEnd = editingSelectionEnd;
		}
	});
	let editingWords = $derived(modifying === -1 ? [] : (getSentenceWords(sentences[modifying]) ?? []));
	run(() => {
		if (selectedWordStart !== -1 && selectedWordEnd >= editingWords.length) {
			resetEditingWordSelection();
		}
	});
	let canMergeEditingWords = $derived(selectedWordStart !== -1 && selectedWordEnd > selectedWordStart);
	let hasSingleSelectedWord = $derived(selectedWordStart !== -1 && selectedWordStart === selectedWordEnd);
	let selectedWord = $derived(selectedWordStart !== -1 && selectedWordStart === selectedWordEnd ? editingWords[selectedWordStart] : '');
	let selectedWordSegments = $derived(selectedWord && !selectedWord.match(/<[^>]+>/u) ? segmentGraphemes(selectedWord) : []);
	let canSplitEditingWord = $derived(selectedWordSegments.length > 1);
	let selectedWordCount = $derived(selectedWordStart === -1 ? 0 : selectedWordEnd - selectedWordStart + 1);
	let canMergeSelectedWithPrev = $derived(hasSingleSelectedWord && selectedWordStart > 0);
	let canMergeSelectedWithNext = $derived(hasSingleSelectedWord && selectedWordStart < editingWords.length - 1);
</script>

<svelte:window
	onresize={async () => {
		await tick();
		lines = drawLines(word_spans, equivalency, verticalGap, lineGap, straightLength, endpointCorrection);
	}}
	onpointerdown={(e) => {
		if (modifying === -1 || selectedWordStart === -1) return;
		if (shouldKeepEditingSelection(e.target)) return;
		resetEditingWordSelection();
	}}
	{onpointermove}
	onpointerup={dragend}
/>

<output
	bind:this={output}
	class:dragging={draggingIndex !== -1}
	class:editing={mode === 'edit'}
	class:modifying-sentence={modifying !== -1}
	class:serif={fontFamily === 'serif'}
	class:sans-serif={fontFamily === 'sans-serif'}
	class:monospace={fontFamily === 'monospace'}
	class:italic={fontStyle === 'italic' || fontStyle === 'bold-italic'}
	class:bold={fontStyle === 'bold' || fontStyle === 'bold-italic'}
	style:gap={`${verticalGap}px 1em`}
	style:font-size={`${fontSize}px`}
	style:padding={fitPadX !== null
		? `${outputMargin.top}px ${fitPadX}px ${outputMargin.bottom}px ${fitPadX}px`
		: `${outputMargin.top}px ${outputMargin.right}px ${outputMargin.bottom}px ${outputMargin.left}px`}
	style:zoom={fitZoom < 1 ? fitZoom : null}
	class:margin-adjusting={marginDrag !== null}
>
	<!-- Visual bands (pink tint + blueprint dimension annotation). Non-
	     interactive — they only show when one of the blue edge strips is
	     hovered or a drag is active, and all four sides reveal together. -->
	<div class="margin-band margin-band-top" class:active={marginDrag?.side === 'top'} style:height={`${outputMargin.top}px`} aria-hidden="true">
		{#if outputMargin.top >= 14}
			<svg class="dim-svg" width="20" height={outputMargin.top}>
				<line x1="10" y1="0" x2="10" y2={outputMargin.top} class="dim-line" />
				<polygon points="6,6 14,6 10,0" class="dim-arrowhead" />
				<polygon points={`6,${outputMargin.top - 6} 14,${outputMargin.top - 6} 10,${outputMargin.top}`} class="dim-arrowhead" />
			</svg>
		{/if}
		{#if outputMargin.top > 0}<span class="dim-label">{outputMargin.top}px</span>{/if}
	</div>
	<div
		class="margin-band margin-band-bottom"
		class:active={marginDrag?.side === 'bottom'}
		style:height={`${outputMargin.bottom}px`}
		aria-hidden="true"
	>
		{#if outputMargin.bottom >= 14}
			<svg class="dim-svg" width="20" height={outputMargin.bottom}>
				<line x1="10" y1="0" x2="10" y2={outputMargin.bottom} class="dim-line" />
				<polygon points="6,6 14,6 10,0" class="dim-arrowhead" />
				<polygon points={`6,${outputMargin.bottom - 6} 14,${outputMargin.bottom - 6} 10,${outputMargin.bottom}`} class="dim-arrowhead" />
			</svg>
		{/if}
		{#if outputMargin.bottom > 0}<span class="dim-label">{outputMargin.bottom}px</span>{/if}
	</div>
	<div class="margin-band margin-band-left" class:active={marginDrag?.side === 'left'} style:width={`${outputMargin.left}px`} aria-hidden="true">
		{#if outputMargin.left >= 14}
			<svg class="dim-svg" width={outputMargin.left} height="20">
				<line x1="0" y1="10" x2={outputMargin.left} y2="10" class="dim-line" />
				<polygon points="6,6 6,14 0,10" class="dim-arrowhead" />
				<polygon points={`${outputMargin.left - 6},6 ${outputMargin.left - 6},14 ${outputMargin.left},10`} class="dim-arrowhead" />
			</svg>
		{/if}
		{#if outputMargin.left > 0}<span class="dim-label">{outputMargin.left}px</span>{/if}
	</div>
	<div class="margin-band margin-band-right" class:active={marginDrag?.side === 'right'} style:width={`${outputMargin.right}px`} aria-hidden="true">
		{#if outputMargin.right >= 14}
			<svg class="dim-svg" width={outputMargin.right} height="20">
				<line x1="0" y1="10" x2={outputMargin.right} y2="10" class="dim-line" />
				<polygon points="6,6 6,14 0,10" class="dim-arrowhead" />
				<polygon points={`${outputMargin.right - 6},6 ${outputMargin.right - 6},14 ${outputMargin.right},10`} class="dim-arrowhead" />
			</svg>
		{/if}
		{#if outputMargin.right > 0}<span class="dim-label">{outputMargin.right}px</span>{/if}
	</div>

	<!-- Thin blue edge strips — the ONLY hover target. Hovering or dragging
	     any one of these lights up all four bands and all four edges at
	     once via :has() / .margin-adjusting on <output>. -->
	{#if mode !== 'edit' && modifying === -1}
		<div
			class="margin-edge margin-edge-top"
			class:active={marginDrag?.side === 'top'}
			role="slider"
			tabindex="-1"
			aria-label={$LL.aria.marginTop()}
			aria-valuenow={outputMargin.top}
			aria-valuemin="0"
			aria-valuemax={MARGIN_MAX}
			title={`${$LL.aria.marginTop()}: ${outputMargin.top}px`}
			onpointerdown={(e) => startMarginDrag('top', e)}
			onpointermove={onMarginDragMove}
			onpointerup={endMarginDrag}
			onpointercancel={endMarginDrag}
		></div>
		<div
			class="margin-edge margin-edge-bottom"
			class:active={marginDrag?.side === 'bottom'}
			role="slider"
			tabindex="-1"
			aria-label={$LL.aria.marginBottom()}
			aria-valuenow={outputMargin.bottom}
			aria-valuemin="0"
			aria-valuemax={MARGIN_MAX}
			title={`${$LL.aria.marginBottom()}: ${outputMargin.bottom}px`}
			onpointerdown={(e) => startMarginDrag('bottom', e)}
			onpointermove={onMarginDragMove}
			onpointerup={endMarginDrag}
			onpointercancel={endMarginDrag}
		></div>
		<div
			class="margin-edge margin-edge-left"
			class:active={marginDrag?.side === 'left'}
			role="slider"
			tabindex="-1"
			aria-label={$LL.aria.marginLeft()}
			aria-valuenow={outputMargin.left}
			aria-valuemin="0"
			aria-valuemax={MARGIN_MAX}
			title={`${$LL.aria.marginLeft()}: ${outputMargin.left}px`}
			onpointerdown={(e) => startMarginDrag('left', e)}
			onpointermove={onMarginDragMove}
			onpointerup={endMarginDrag}
			onpointercancel={endMarginDrag}
		></div>
		<div
			class="margin-edge margin-edge-right"
			class:active={marginDrag?.side === 'right'}
			role="slider"
			tabindex="-1"
			aria-label={$LL.aria.marginRight()}
			aria-valuenow={outputMargin.right}
			aria-valuemin="0"
			aria-valuemax={MARGIN_MAX}
			title={`${$LL.aria.marginRight()}: ${outputMargin.right}px`}
			onpointerdown={(e) => startMarginDrag('right', e)}
			onpointermove={onMarginDragMove}
			onpointerup={endMarginDrag}
			onpointercancel={endMarginDrag}
		></div>
	{/if}

	{#if !loading}
		{#each sentences as sentence, i}
			{@const { lang, tokens } = sentence}
			{#if dropTargetIndex === i && draggingIndex !== i && draggingIndex !== i - 1}
				<div class="drop-indicator" aria-hidden="true"></div>
			{/if}
			{#if !pendingIndices.has(i)}
				{@const defaultLabel = getLanguageName(lang, $locale)}
				{@const currentLabel = sentence.displayName ?? defaultLabel}
				<div class="sentence" class:dragged={draggingIndex === i} class:modifying={modifying === i}>
					<div class="dragger action" onpointerdown={(e) => dragstart(i, e)} bind:this={draggers[i]}>
						<iconify-icon icon="material-symbols:drag-indicator" width="1.2em" height="1.2em"></iconify-icon>
					</div>
					<span
						class="tag"
						style:transform={getTransform(i, draggingOffset)}
						style:justify-self={tagAlignment === 'center' ? 'center' : tagAlignment === 'right' ? 'end' : 'start'}
					>
						<span
							class="tag-text"
							contenteditable="true"
							role="textbox"
							tabindex="0"
							spellcheck="false"
							title={$LL.aria.renameLanguage()}
							aria-label={$LL.aria.renameLanguage()}
							onkeydown={(e) => {
								// Don't commit mid-IME-composition: Enter/Escape there belong
								// to the candidate window, not to this field.
								if (e.isComposing) return;
								if (e.key === 'Enter' || e.key === 'Escape') {
									e.preventDefault();
									(e.currentTarget as HTMLElement).blur();
								}
							}}
							onfocus={(e) => {
								const range = document.createRange();
								range.selectNodeContents(e.currentTarget as HTMLElement);
								const sel = window.getSelection();
								sel?.removeAllRanges();
								sel?.addRange(range);
							}}
							onblur={(e) => {
								const next = (e.currentTarget.textContent ?? '').replace(/\s+/g, ' ').trim();
								// Empty input OR the default label → clear the override; else store it.
								const displayName = next === '' || next === defaultLabel ? undefined : next;
								if (displayName === sentence.displayName) {
									// No change to the stored override (incl. a redundant one that
									// already equals the default). Restore the canonical text in
									// case the browser left stray whitespace behind.
									e.currentTarget.textContent = displayName ?? defaultLabel;
									return;
								}
								dispatch('renameLanguage', { sentence: i, displayName });
							}}>{currentLabel}</span
						>
					</span>
					<div class="sentence-body" class:with-gloss={sentenceShowsGloss(sentence)} style:transform={getTransform(i, draggingOffset)}>
						<span class="words" {lang} dir={getLocaleDirection(lang)} style:text-align={alignment} style:letter-spacing={`${letterSpacing}px`}>
							{#each tokens as token, j}
								{@const word = token.text}
								{@const hasAboveLanes = sentence.lanesAbove > 0}
								{@const hasBelowLanes = sentence.lanesBelow > 0}
								{@const nextToken = tokens[j + 1]}
								{@const needsTokenGap = tokenGap > 0 && !isWhitespace(word) && nextToken !== undefined && !isWhitespace(nextToken.text)}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<span
									class="token"
									class:with-gloss={sentenceShowsGloss(sentence) && isContent(word)}
									style:margin-inline-end={needsTokenGap ? `${tokenGap}px` : undefined}
								>
									{#if hasAboveLanes}
										<span class="annotations-above" lang="zxx" style:font-size={`${glossFontSize}px`}>
											{#each Array(sentence.lanesAbove) as _, laneIndex}
												<span class="annotation-line annotation-above">
													{isContent(word) ? (token.annotationsAbove[laneIndex] ?? '') : ''}
												</span>
											{/each}
										</span>
									{/if}
									<span
										class="word"
										class:whitespace={isWhitespace(word)}
										class:content={isContent(word)}
										class:editing={mode === 'edit'}
										class:token-selected={i === modifying && selectedWordStart !== -1 && j >= selectedWordStart && j <= selectedWordEnd}
										class:connected={connecting.some(([l, w]) => l == i && w == j)}
										style:width={isWhitespace(word) ? `${Array.from(word).length * spaceWidth}px` : undefined}
										style:color={colors[color_map[i][j]]}
										onclick={() => {
											if (i === modifying) {
												selectEditingWord(i, j);
												return;
											}

											if (!isContent(word)) return;

											const entryIndex = color_map[i][j];

											if (mode === 'view') {
												mode = 'edit';

												if (entryIndex !== -1) {
													connected = [];
													for (let [i, words] of equivalency[entryIndex].entries()) {
														for (let word of words) {
															connected.push([i, word]);
														}
													}

													connecting = connected.map(([l, w]) => [l, w]);
													connectedIndex = entryIndex;
													return;
												}
											}

											if (connecting.some(([l, w]) => l == i && w == j)) {
												connecting = connecting.filter(([l, w]) => l != i || w != j);
											} else {
												connecting = [...connecting, [i, j]];
											}
										}}
										bind:this={word_spans[i][j]}
									>
										<Word {word} />
									</span>
									{#if hasBelowLanes}
										<span class="annotations-below" lang="zxx" style:font-size={`${glossFontSize}px`}>
											{#each Array(sentence.lanesBelow) as _, laneIndex}
												<span class="annotation-line annotation-below">
													{isContent(word) ? (token.annotationsBelow[laneIndex] ?? '') : ''}
												</span>
											{/each}
										</span>
									{/if}
								</span>
							{/each}
						</span>
					</div>
					<div class="modify action">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<iconify-icon
							icon="material-symbols:edit-rounded"
							onclick={() => {
								dispatch('modify', {
									sentence: i
								});
							}}
						></iconify-icon>
					</div>
					<div class="delete action">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<iconify-icon
							icon="ic:baseline-delete-forever"
							width="1.2em"
							height="1.2em"
							onclick={() => {
								if (!confirm($LL.confirm.deleteSentence())) return;
								dispatch('delete', {
									sentence: i
								});
							}}
						></iconify-icon>
					</div>
				</div>
			{/if}
		{/each}
		{#if dropTargetIndex === sentences.length && draggingIndex !== sentences.length - 1}
			<div class="drop-indicator" aria-hidden="true"></div>
		{/if}
		{#if pendingIndices.size > 0}
			<div class="pending-tray">
				{#each [...pendingIndices] as i (i)}
					{#if sentences[i]}
						<div class="pending-row">
							<span class="pending-tag" lang={sentences[i].lang}>{getLanguageName(sentences[i].lang, $locale)}</span>
							<div class="pending-bar" aria-label="loading">
								<div class="pending-bar-inner"></div>
							</div>
							<button
								type="button"
								class="pending-cancel"
								title={$LL.translate.cancel()}
								aria-label={$LL.translate.cancel()}
								onclick={() => dispatch('cancelTranslate')}
							>
								<iconify-icon icon="material-symbols:close-rounded" inline="true"></iconify-icon>
							</button>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
		{#if modifying !== -1}
			<div class="token-edit-dialog visible" use:draggable bind:this={tokenEditDialog}>
				<div class="token-edit-topbar">
					<span class="token-edit-badge">{$LL.tokenEditor.tokens()}</span>
					{#if selectedWordCount > 0}
						<span class="token-edit-count">{selectedWordCount}</span>
					{/if}
				</div>
				{#if canMergeEditingWords || canSplitEditingWord}
					<div class="token-edit-actions">
						{#if canMergeEditingWords}
							<button
								type="button"
								class="token-action"
								onclick={() => {
									dispatch('merge', { sentence: modifying, start: selectedWordStart, end: selectedWordEnd });
									resetEditingWordSelection();
								}}
							>
								<iconify-icon icon="mdi:arrow-collapse-horizontal" inline="true"></iconify-icon>
								{$LL.tokenEditor.mergeSelected()}
							</button>
						{/if}
					</div>
				{/if}
				{#if hasSingleSelectedWord}
					<div class="split-picker" aria-label={$LL.tokenEditor.splitAtBoundary()}>
						{#if canMergeSelectedWithPrev}
							<button
								type="button"
								class="split-point merge-point"
								onclick={() => {
									dispatch('merge', { sentence: modifying, start: selectedWordStart - 1, end: selectedWordStart });
									resetEditingWordSelection();
								}}
							>
								<iconify-icon icon="mdi:call-merge" inline="true"></iconify-icon>
							</button>
						{/if}
						{#if canSplitEditingWord}
							{#each selectedWordSegments as segment, index}
								<span class="split-piece">{segment}</span>
								{#if index < selectedWordSegments.length - 1}
									<button
										type="button"
										class="split-point"
										onclick={() => {
											dispatch('split', {
												sentence: modifying,
												word: selectedWordStart,
												offset: selectedWordSegments.slice(0, index + 1).join('').length
											});
											resetEditingWordSelection();
										}}
									>
										<span class="split-glyph">|</span>
									</button>
								{/if}
							{/each}
						{:else}
							<span class="split-piece single-piece">{selectedWord}</span>
						{/if}
						{#if canMergeSelectedWithNext}
							<button
								type="button"
								class="split-point merge-point"
								onclick={() => {
									dispatch('merge', { sentence: modifying, start: selectedWordStart, end: selectedWordStart + 1 });
									resetEditingWordSelection();
								}}
							>
								<iconify-icon icon="mdi:call-merge" inline="true"></iconify-icon>
							</button>
						{/if}
					</div>
				{:else if selectedWordCount === 0}
					<p class="token-edit-help">{$LL.tokenEditor.selectTokens()}</p>
				{/if}
			</div>
		{/if}
		{@const dashArray =
			lineStyle === 'dashed' ? `${lineWidth * 5} ${lineWidth * 4}` : lineStyle === 'dotted' ? `${lineWidth} ${lineWidth * 2}` : undefined}
		<svg style="position: absolute;" width="100%" height="100%">
			{#each lines as [x1, y1, x2, y2, color]}
				<path
					d={connectionPath(x1, y1, x2, y2, curvature)}
					stroke={color}
					stroke-width={lineWidth}
					stroke-dasharray={dashArray}
					stroke-linecap={lineStyle === 'dotted' ? 'round' : undefined}
					fill="none"
				/>
			{/each}
			{#if dottedEndRadius > 0}
				<!-- Filled circles at each connector endpoint, in the connector colour
				     — same accent the og-image uses to anchor each link visually to
				     the word it connects. Rendered as a second pass so the dots sit
				     on top of the lines without being interrupted by stroke joins.
				     Dedup by quantised (x,y,color) so the straight-segment fragments
				     drawLines adds when straightLength > 0 don't stack three
				     coincident dots at the same endpoint. -->
				{@const endpointDots = uniqueEndpoints(lines)}
				{#each endpointDots as { x, y, color }}
					<circle cx={x} cy={y} r={dottedEndRadius} fill={color} />
				{/each}
			{/if}
		</svg>

		<div class="edit-dialog" use:draggable class:visible={mode === 'edit'}>
			<div class="edit-dialog-topbar">
				<span class="edit-dialog-badge">{$LL.dialog.editing()}</span>
			</div>
			<div class="edit-dialog-actions">
				<button
					class="confirm"
					onclick={() => {
						dispatch('connect', { connected: [...connecting], connectedIndex });
						connecting = [];
						connectedIndex = -1;
						mode = 'view';
					}}
				>
					<iconify-icon icon="material-symbols:check" inline="true"></iconify-icon>
					{$LL.dialog.confirm()}
				</button>
				<button
					class="cancel"
					onclick={() => {
						connecting = [];
						mode = 'view';
					}}
				>
					<iconify-icon icon="material-symbols:cancel" inline="true"></iconify-icon>
					{$LL.dialog.cancel()}
				</button>
			</div>
		</div>
	{/if}
</output>

<style>
	.tag {
		font-weight: bold;
		text-align: center;
		margin-right: 2em;
		white-space: nowrap;
	}

	/* Inline-editable tag. The hover ring is a quiet affordance; the focus
	   ring + accent background says "you're editing now". Italic + accent
	   border signals "customised" when displayName differs from the default,
	   no badge or hint paragraph needed. Empty input on blur reverts. */
	.tag-text {
		display: inline-block;
		cursor: text;
		border-radius: 0.2em;
		padding: 0 0.15em;
		outline: 1px dashed transparent;
		outline-offset: 1px;
		transition:
			outline-color 120ms ease,
			background-color 120ms ease;
	}

	/* When the language has no name (e.g. an empty lang code), currentLabel is
	   "" and the contenteditable span would collapse to zero size — leaving
	   nothing to click into. Keep a clickable box: min-width gives horizontal
	   target, the zero-width no-break space gives the line height. Neither is
	   part of textContent, so the save/revert logic is unaffected. */
	.tag-text:empty {
		min-width: 1.5em;
	}

	.tag-text:empty::before {
		content: '\feff';
	}

	.tag-text:hover {
		outline-color: var(--color-border);
	}

	.tag-text:focus {
		outline: 1px solid var(--color-accent);
		background: var(--color-surface);
	}

	/* No .tag-text-customised style here on purpose. The final-render diagram
	   must look identical whether the label is the locale default or a
	   user-customised one; the "this is customised" hint belongs in the input
	   side of the UI, not in the output the user exports. */

	.sentence-body {
		display: block;
	}

	.words {
		display: block;
		/* Keep each sentence on a single line. On narrow viewports the
		   parent <.output-scroll> provides horizontal scrolling — that
		   gives the diagram a clean overflow story rather than wrapping
		   words to a new line (which dropped the SVG connectors out of
		   alignment with the tokens). */
		white-space: nowrap;
	}

	.token {
		display: inline-block;
		position: relative;
		vertical-align: baseline;
		text-align: center;
	}

	.word.whitespace {
		display: inline-block;
		white-space: pre;
	}

	/* Annotation stacks sit above/below the word in normal flow so the token's width
	   grows to max(word, lane text) — wide annotations no longer overflow onto neighbours. */
	.annotations-above,
	.annotations-below {
		display: flex;
		text-align: center;
		line-height: 1.2;
		letter-spacing: 0.02em;
		color: rgb(86 92 120);
		pointer-events: none;
	}

	/* Above stack reads from word outward: lane 0 sits just above the word
	   (closest), lane N-1 at the top (furthest). column-reverse renders
	   the first-iterated lane at the bottom of the flex container. */
	.annotations-above {
		flex-direction: column-reverse;
	}

	.annotations-below {
		flex-direction: column;
	}

	.annotation-line {
		display: block;
		white-space: nowrap;
		min-height: 1em;
	}

	.word.content:hover {
		background-color: #eee;
	}

	.word.editing:not(.connected) {
		background-color: #ccc;
	}
	.word.editing.connected {
		outline: 1px solid #e00000;
	}

	.word.token-selected {
		outline: 2px solid rgb(44 71 255 / 70%);
		background: rgb(44 71 255 / 12%);
		border-radius: 0.3em;
		box-shadow: 0 0 0 2px rgb(255 255 255 / 90%);
	}

	output {
		position: relative;

		display: grid;
		grid-template-columns: auto auto 1fr auto auto;
		column-gap: 1em;
		row-gap: 0.65em;
		width: fit-content;
		/* No margin-inline:auto here — leaving it on <output> would bake a
		   non-zero computed margin into the clone produced by dom-to-image /
		   dom-to-svg, shifting exports off-centre to the right. Centring is
		   handled by the .output-scroll wrapper instead. */
		flex-shrink: 0;
	}

	svg {
		pointer-events: none;
	}

	/* --- Direct margin manipulation -------------------------------------- */

	/* Pink visual bands — one per side, cover the corresponding padding
	   region, host the blueprint dimension annotation. Non-interactive
	   (pointer-events: none) so the sentence area underneath stays
	   accessible. Tint and dim fade in together when any .margin-edge
	   strip below is hovered, or when a drag is active. */
	.margin-band {
		position: absolute;
		background: rgb(228 67 175 / 0);
		transition: background 140ms ease;
		pointer-events: none;
		z-index: 4;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.margin-band-top {
		top: 0;
		left: 0;
		right: 0;
	}

	.margin-band-bottom {
		bottom: 0;
		left: 0;
		right: 0;
	}

	.margin-band-left {
		top: 0;
		bottom: 0;
		left: 0;
	}

	.margin-band-right {
		top: 0;
		bottom: 0;
		right: 0;
	}

	output:has(:global(.margin-edge:hover)) .margin-band,
	output.margin-adjusting .margin-band {
		background: rgb(228 67 175 / 0.18);
	}

	/* Blue edge strips — the ONLY hover target. Thin 8px at the very outer
	   edge, ns-resize / ew-resize cursor, pointer-capturing for drag. */
	.margin-edge {
		position: absolute;
		background: transparent;
		transition: background 140ms ease;
		z-index: 5;
		touch-action: none;
	}

	.margin-edge-top {
		top: 0;
		left: 0;
		right: 0;
		height: 8px;
		cursor: ns-resize;
	}

	.margin-edge-bottom {
		bottom: 0;
		left: 0;
		right: 0;
		height: 8px;
		cursor: ns-resize;
	}

	.margin-edge-left {
		left: 0;
		top: 0;
		bottom: 0;
		width: 8px;
		cursor: ew-resize;
	}

	.margin-edge-right {
		right: 0;
		top: 0;
		bottom: 0;
		width: 8px;
		cursor: ew-resize;
	}

	/* All four edges highlight together when any one is hovered, or when
	   any side is being dragged. */
	output:has(:global(.margin-edge:hover)) .margin-edge,
	output.margin-adjusting .margin-edge {
		background: rgb(46 91 255 / 0.5);
	}

	/* The actively-dragged side reads slightly darker. */
	.margin-edge.active {
		background: rgb(33 56 199 / 0.75);
	}

	/* Dim svg + label fade in alongside the band tint, all four together. */
	.dim-svg,
	.dim-label {
		opacity: 0;
		transition: opacity 140ms ease;
		pointer-events: none;
	}

	output:has(:global(.margin-edge:hover)) .dim-svg,
	output:has(:global(.margin-edge:hover)) .dim-label,
	output.margin-adjusting .dim-svg,
	output.margin-adjusting .dim-label {
		opacity: 1;
	}

	.dim-svg {
		display: block;
		overflow: visible;
	}

	.dim-line {
		stroke: rgb(33 56 199 / 0.7);
		stroke-width: 1;
		fill: none;
	}

	.dim-arrowhead {
		fill: rgb(33 56 199 / 0.85);
		stroke: none;
	}

	.dim-label {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 0.7rem;
		font-weight: 600;
		font-feature-settings:
			'tnum' 1,
			'lnum' 1;
		letter-spacing: 0.01em;
		color: rgb(20 36 130);
		background: rgb(255 255 255 / 0.92);
		padding: 0.05em 0.4em;
		border-radius: 0.25em;
		white-space: nowrap;
		box-shadow: 0 0 0 1px rgb(33 56 199 / 0.15);
	}

	.margin-band.active .dim-line {
		stroke: rgb(33 56 199);
		stroke-width: 1.25;
	}

	.margin-band.active .dim-arrowhead {
		fill: rgb(33 56 199);
	}

	.margin-band.active .dim-label {
		background: rgb(33 56 199);
		color: white;
		box-shadow: 0 4px 14px rgb(15 23 42 / 0.18);
	}

	.edit-dialog {
		display: grid;
		gap: 0.65em;
		padding: 0.7em 0.8em;
		border: 1px solid rgb(44 71 255 / 12%);
		border-radius: 0.9em;
		box-shadow: 0 14px 34px rgb(23 36 78 / 14%);
		background: linear-gradient(180deg, rgb(255 255 255 / 96%), rgb(246 249 255 / 92%));
		backdrop-filter: blur(10px);
		margin: 1em;

		cursor: move;

		position: absolute;

		visibility: hidden;

		z-index: 999;
	}

	.token-edit-dialog {
		display: grid;
		gap: 0.65em;
		padding: 0.7em 0.8em;
		min-height: 4.4em;
		border: 1px solid rgb(44 71 255 / 12%);
		border-radius: 0.9em;
		box-shadow: 0 14px 34px rgb(23 36 78 / 14%);
		background: linear-gradient(180deg, rgb(255 255 255 / 96%), rgb(246 249 255 / 92%));
		backdrop-filter: blur(10px);
		position: absolute;
		right: 1em;
		top: 1em;
		max-width: min(26em, calc(100% - 2em));
		z-index: 998;
		cursor: move;
	}

	.token-edit-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75em;
	}

	.token-edit-badge,
	.token-edit-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2em;
		padding: 0 0.7em;
		border-radius: 999px;
		font-size: 0.82em;
		font-weight: 700;
	}

	.token-edit-badge {
		background: rgb(44 71 255 / 10%);
		color: rgb(33 56 199);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.token-edit-count {
		min-width: 2em;
		background: rgb(24 33 61 / 7%);
		color: rgb(41 48 78);
	}

	.token-edit-actions {
		display: flex;
		gap: 0.5em;
		flex-wrap: wrap;
	}

	.token-action {
		appearance: none;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.28em 0.62em;
		border: 1px solid rgb(44 71 255 / 18%);
		border-radius: 999px;
		background: white;
		color: rgb(33 56 199);
		font: inherit;
		font-size: 0.86em;
		font-weight: 600;
	}

	.token-action:hover,
	.split-point:hover {
		background: rgb(44 71 255 / 8%);
	}

	.split-picker {
		display: flex;
		align-items: center;
		gap: 0.3em;
		flex-wrap: wrap;
		padding: 0.2em 0;
	}

	.split-piece {
		padding: 0.2em 0.45em;
		border-radius: 0.45em;
		background: rgb(44 71 255 / 9%);
		color: rgb(35 51 120);
	}

	.split-piece.single-piece {
		min-width: 1.8em;
		text-align: center;
	}

	.split-point {
		appearance: none;
		border: 1px solid rgb(44 71 255 / 35%);
		border-radius: 999px;
		background: white;
		color: rgb(44 71 255);
		padding: 0.15em 0.38em;
		line-height: 1;
	}

	.split-point.merge-point {
		background: rgb(44 71 255 / 5%);
		padding: 0.15em 0.38em;
	}

	.split-glyph {
		display: inline-block;
		font-weight: 700;
		transform: scaleY(1.15);
	}

	.token-edit-help {
		margin: 0;
		color: rgb(74 82 112);
		font-size: 0.88em;
	}

	@media (max-width: 700px) {
		.token-edit-dialog {
			left: 0.75em;
			right: 0.75em;
			top: auto;
			bottom: 0.75em;
			max-width: none;
		}

		.token-edit-topbar {
			gap: 0.5em;
		}
	}

	.edit-dialog.visible {
		visibility: visible;
	}

	.edit-dialog-topbar {
		display: flex;
		align-items: center;
		justify-content: flex-start;
	}

	.edit-dialog-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2em;
		padding: 0 0.7em;
		border-radius: 999px;
		font-size: 0.82em;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background: rgb(44 71 255 / 10%);
		color: rgb(33 56 199);
	}

	.edit-dialog-actions {
		display: flex;
		gap: 0.5em;
		flex-wrap: wrap;
	}

	.edit-dialog .confirm,
	.edit-dialog .cancel {
		appearance: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
		padding: 0.35em 0.75em;
		border-radius: 999px;
		font: inherit;
		font-size: 0.9em;
		font-weight: 600;
	}

	.edit-dialog .confirm {
		border: 1px solid rgb(44 71 255 / 18%);
		background: white;
		color: rgb(33 56 199);
	}

	.edit-dialog .cancel {
		border: 1px solid rgb(24 33 61 / 12%);
		background: rgb(255 255 255 / 0.78);
		color: rgb(74 82 112);
	}

	.edit-dialog .confirm:hover,
	.edit-dialog .cancel:hover {
		background: rgb(44 71 255 / 8%);
	}

	@media (max-width: 700px) {
		.edit-dialog {
			left: 0.75em;
			right: 0.75em;
			max-width: none;
		}
	}

	.sentence {
		display: contents;
	}

	/* Spans the full grid as a thin accent-coloured line, slid into the
	   row-gap with negative margins so it doesn't push the neighbouring rows.
	   pointer-events:none keeps it from interfering with drag detection. */
	.drop-indicator {
		grid-column: 1 / -1;
		height: 0;
		border-top: 2px solid var(--color-accent);
		margin: calc(-1 * var(--row-gap, 0.65em) / 2 - 1px) 0;
		pointer-events: none;
	}

	.action {
		opacity: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.1em;
		width: 1.5em;
		height: 1.5em;
		/* z-index keeps chrome above the margin bands / edges where they
		   overlap, so a hovered sentence's controls win pointer events at
		   the boundaries. */
		position: relative;
		z-index: 8;
	}

	/* Close the 1em grid gap around the chrome cells so dragger sits snug
	   against the language tag and the action buttons sit snug against the
	   sentence and each other. */
	.dragger {
		margin-inline-end: -0.65em;
	}

	.modify,
	.delete {
		margin-inline-start: -0.65em;
	}

	.action:hover {
		background-color: #eee;
	}

	.sentence:hover > .action {
		opacity: 1;
	}

	.editing .action {
		visibility: hidden;
	}

	.modifying-sentence .modify,
	.modifying-sentence .delete {
		visibility: hidden;
	}

	.dragger {
		cursor: move;
	}

	.delete {
		cursor: pointer;
		color: #e00020;
	}

	.pending-tray {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		padding: 0.6em 0.8em;
		margin-top: 0.4em;
		background: rgb(46 91 255 / 0.04);
		border: 1px dashed rgb(46 91 255 / 0.25);
		border-radius: 0.5em;
	}

	.pending-row {
		display: grid;
		grid-template-columns: minmax(6em, max-content) 1fr auto;
		align-items: center;
		gap: 0.65em;
		font-size: 0.9em;
		color: rgb(45 55 80);
	}

	.pending-tag {
		font-weight: 600;
		color: rgb(33 56 199);
		white-space: nowrap;
	}

	.pending-bar {
		height: 4px;
		background: rgb(46 91 255 / 0.12);
		border-radius: 2px;
		overflow: hidden;
		position: relative;
	}

	.pending-bar-inner {
		position: absolute;
		top: 0;
		left: -40%;
		width: 40%;
		height: 100%;
		background: linear-gradient(to right, rgb(73 132 255), rgb(44 71 255));
		border-radius: 2px;
		animation: output-pending-slide 1.2s ease-in-out infinite;
	}

	@keyframes output-pending-slide {
		0% {
			left: -40%;
		}
		100% {
			left: 100%;
		}
	}

	.pending-cancel {
		appearance: none;
		background: none;
		border: none;
		padding: 0.15em 0.3em;
		cursor: pointer;
		color: rgb(74 82 112);
		border-radius: 0.25em;
		display: inline-flex;
		align-items: center;
	}

	.pending-cancel:hover {
		background: rgb(24 33 61 / 0.08);
		color: #e00020;
	}

	output.modifying-sentence {
		background-color: transparent;
	}

	output.modifying-sentence .sentence:not(.modifying) > .tag,
	output.modifying-sentence .sentence:not(.modifying) > .sentence-body,
	output.modifying-sentence > svg {
		opacity: 0.3;
	}

	output.dragging {
		user-select: none;
	}

	output.dragging > svg {
		opacity: 0.5;
	}

	output.dragging > .sentence:not(.dragged) > * {
		opacity: 0.5;
	}

	.serif {
		font-family: serif;
	}

	.sans-serif {
		font-family: sans-serif;
	}

	.monospace {
		font-family: monospace;
	}

	.italic {
		font-style: italic;
	}

	.bold {
		font-weight: bold;
	}
</style>
