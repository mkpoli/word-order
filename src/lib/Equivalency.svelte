<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { LL } from '../i18n/i18n-svelte';
	import Word from './Word.svelte';
	import type { Sentence } from './types';
	import { applyPreviewColors, type DragPreview } from './equivalency-preview';

	interface Props {
		sentences: Sentence[];
		equivalency: number[][][];
		colors: string[];
		/** Active drag preview ({from, to} as it would be emitted on drop), or null when idle. Read by the parent so it can permute the line colors live. */
		dragPreview?: DragPreview;
		onreorder?: (e: { from: number; to: number }) => void;
		onscramble?: () => void;
	}

	let { sentences, equivalency, colors, dragPreview = $bindable(null), onreorder, onscramble }: Props = $props();

	// Live colour preview shared by row swatches, the colour-bar gradient, and
	// (via the bound dragPreview) the connector lines in Output.svelte. Without
	// this, the phantom would slide to a new slot while the lines stayed at the
	// old colour order — visually fragmented.
	let displayColors = $derived(applyPreviewColors(colors, dragPreview));

	function buildStripeGradient(colors: string[], positions: number[]): string {
		if (colors.length === 0) return 'none';
		if (colors.length === 1) return `linear-gradient(to bottom, ${colors[0]}, ${colors[0]})`;
		if (positions.length !== colors.length) return `linear-gradient(to bottom, ${colors.join(', ')})`;

		const stops: string[] = [];
		for (const [index, color] of colors.entries()) {
			const position = positions[index];
			stops.push(`${color} ${position}%`);

			if (index < colors.length - 1) {
				const nextColor = colors[index + 1];
				const nextPosition = positions[index + 1];
				const quarter = position + (nextPosition - position) * 0.25;
				const midpoint = position + (nextPosition - position) * 0.5;
				const threeQuarter = position + (nextPosition - position) * 0.75;

				stops.push(`color-mix(in oklch, ${color} 75%, ${nextColor}) ${quarter}%`);
				stops.push(`color-mix(in oklch, ${color} 50%, ${nextColor}) ${midpoint}%`);
				stops.push(`color-mix(in oklch, ${color} 25%, ${nextColor}) ${threeQuarter}%`);
			}
		}

		return `linear-gradient(to bottom, ${stops.join(', ')})`;
	}

	let stripePositions: number[] = $state([]);
	let entriesContainer: HTMLDivElement | undefined = $state();
	let equivalencyDivs: HTMLDivElement[] = $state([]);

	function updateStripePositions() {
		if (!entriesContainer || colors.length === 0) {
			stripePositions = [];
			return;
		}

		const containerHeight = entriesContainer.offsetHeight;
		const divs = equivalencyDivs.slice(0, colors.length);
		if (containerHeight <= 0 || divs.length !== colors.length || divs.some((div) => !div)) {
			stripePositions = [];
			return;
		}

		stripePositions = divs.map((div) => ((div.offsetTop + div.offsetHeight / 2) / containerHeight) * 100);
	}

	onMount(() => {
		updateStripePositions();

		const resizeObserver = new ResizeObserver(() => {
			updateStripePositions();
		});

		if (entriesContainer) resizeObserver.observe(entriesContainer);
		for (const div of equivalencyDivs) {
			if (div) resizeObserver.observe(div);
		}

		return () => {
			resizeObserver.disconnect();
		};
	});

	// Replaces the Svelte 4 afterUpdate hook — re-measure stripe positions after any
	// re-render, since equivalencyDivs/colors changes shift the bars.
	$effect(() => {
		// Touch dependencies so the effect re-runs after updates.
		void equivalency;
		void colors;
		void sentences;
		tick().then(updateStripePositions);
	});

	let stripeGradient = $derived(buildStripeGradient(displayColors, stripePositions));

	let draggingIndex = $state(-1);
	let draggingPosition = { x: 0, y: 0 };
	let draggingOffset = $state({ x: 0, y: 0 });
	/** Visual drop index (0..equivalency.length); null when not dragging. */
	let dropTargetIndex = $state<number | null>(null);

	/** Visual `dropTargetIndex` mapped to the post-splice `to` index `onreorder` uses. */
	function visualToSpliceTo(visual: number, from: number): number {
		return visual < from ? visual : Math.max(0, visual - 1);
	}

	function syncDragPreview() {
		if (draggingIndex < 0 || dropTargetIndex === null) {
			dragPreview = null;
			return;
		}
		const to = visualToSpliceTo(dropTargetIndex, draggingIndex);
		dragPreview = { from: draggingIndex, to };
	}

	function dragstart(l: number, e: PointerEvent) {
		draggingIndex = l;
		if (e.target instanceof HTMLDivElement) {
			e.target.setPointerCapture(e.pointerId);
		}

		draggingPosition = { x: e.clientX, y: e.clientY };
		dropTargetIndex = l;
		syncDragPreview();
	}

	/** Count of equivalency rows whose vertical centre sits above the cursor. */
	function computeDropVisualIndex(clientY: number): number {
		let dropAt = 0;
		for (const div of equivalencyDivs) {
			const rect = div.getBoundingClientRect();
			const center = (rect.top + rect.bottom) / 2;
			if (clientY > center) dropAt++;
			else break;
		}
		return dropAt;
	}

	function dragend(e: PointerEvent) {
		if (draggingIndex < 0) return;

		if (e.target instanceof Element) {
			e.target.releasePointerCapture(e.pointerId);
		}

		const visual = computeDropVisualIndex(e.clientY);
		if (visual !== draggingIndex && visual !== draggingIndex + 1) {
			onreorder?.({ from: draggingIndex, to: visualToSpliceTo(visual, draggingIndex) });
		}

		draggingIndex = -1;
		draggingOffset = { x: 0, y: 0 };
		dropTargetIndex = null;
		dragPreview = null;
	}

	function onpointermove(e: PointerEvent) {
		if (draggingIndex >= 0) {
			draggingOffset = {
				x: e.clientX - draggingPosition.x,
				y: e.clientY - draggingPosition.y
			};
			dropTargetIndex = computeDropVisualIndex(e.clientY);
			syncDragPreview();
		}
	}

	function getTransform(l: number, draggingOffset: { x: number; y: number }, shifts: number[]) {
		if (draggingIndex === l) {
			return `translate(${draggingOffset.x}px, ${draggingOffset.y}px)`;
		}
		const shift = shifts[l] ?? 0;
		return shift ? `translateY(${shift}px)` : 'none';
	}

	// While dragging, non-dragged rows that sit between the source slot and the
	// proposed drop slot slide out of the way by the dragged row's height — so
	// the phantom doesn't visually overlap their text, and the user sees a live
	// preview of the post-drop layout instead of a row floating over a static
	// column. Empty array when idle so the rows render in their natural slots.
	let displayShifts: number[] = $derived.by(() => {
		const shifts = equivalency.map(() => 0);
		if (!dragPreview || equivalencyDivs.length === 0) return shifts;
		const { from, to } = dragPreview;
		if (from === to || from < 0 || from >= equivalencyDivs.length) return shifts;
		const draggedHeight = equivalencyDivs[from]?.offsetHeight ?? 0;
		if (draggedHeight === 0) return shifts;
		for (let i = 0; i < shifts.length; i++) {
			if (i === from) continue;
			if (from < to && i > from && i <= to) shifts[i] = -draggedHeight;
			else if (to < from && i >= to && i < from) shifts[i] = draggedHeight;
		}
		return shifts;
	});
</script>

<svelte:window onpointerup={dragend} {onpointermove} />

<div class="color-bar" style:background-image={stripeGradient}></div>
<div class="entries" bind:this={entriesContainer} role="list">
	{#each equivalency as entry, i (i)}
		{#if dropTargetIndex === i && draggingIndex !== i && draggingIndex !== i - 1}
			<div class="drop-indicator" aria-hidden="true"></div>
		{/if}
		<div
			class="equivalency"
			class:dragging={draggingIndex === i}
			style:color={displayColors[i]}
			onpointerdown={(e) => dragstart(i, e)}
			onpointerup={dragend}
			bind:this={equivalencyDivs[i]}
			style:transform={getTransform(i, draggingOffset, displayShifts)}
			role="listitem"
		>
			{#each entry as words, j (j)}
				<span class="words">
					{#if words.length === 0}
						<span class="word">❌</span>
					{:else}
						{#each words as k (k)}
							<span lang={sentences[j].lang} class="word"><Word word={sentences[j].tokens[k].text} /></span>
						{/each}
					{/if}
				</span>
			{/each}
		</div>
	{/each}
	{#if dropTargetIndex === equivalency.length && draggingIndex !== equivalency.length - 1}
		<div class="drop-indicator" aria-hidden="true"></div>
	{/if}
</div>
<button class="scramble-all" title={$LL.menu.scramble()} aria-label={$LL.menu.scramble()} onclick={() => onscramble?.()}>
	<iconify-icon icon="fad:random-1dice" width="1.5em"></iconify-icon>
</button>

<style>
	.entries {
		display: flex;
		flex-direction: column;
		position: relative;
		height: fit-content;
	}

	.equivalency {
		cursor: move;
		user-select: none;
		/* Non-dragged rows shift out of the way (see displayShifts) — animate
		   that transform so the preview reads as a smooth swap rather than
		   teleport. The active drag opts out below so the phantom tracks the
		   cursor without lag. */
		transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.equivalency.dragging {
		transition: none;
		/* Lift the phantom above the row it's hovering over so the colour
		   tag isn't visually under another row's text mid-drag. */
		z-index: 1;
		position: relative;
	}

	.drop-indicator {
		height: 0;
		border-top: 2px solid var(--color-accent);
		margin: -1px 0;
		pointer-events: none;
	}

	.color-bar {
		/* position: absolute; */
		width: 0.3em;
		border-radius: 9999px;
		filter: saturate(1.08);
	}

	.words:not(:last-of-type)::after {
		content: '＝';
	}

	.word:not(:last-of-type)::after {
		content: '|';
	}

	.scramble-all {
		appearance: none;
		border: none;
		background: none;
		cursor: pointer;
		align-self: center;
		color: var(--color-text-faint);
		transition: color 0.15s ease;
	}

	.scramble-all:hover {
		color: var(--color-text);
	}
</style>
