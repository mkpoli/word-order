<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { LL } from '../i18n/i18n-svelte';
	import Word from './Word.svelte';
	import type { Sentence } from './types';

	interface Props {
		sentences: Sentence[];
		equivalency: number[][][];
		colors: string[];
		onreorder?: (e: { from: number; to: number }) => void;
		onscramble?: () => void;
	}

	let { sentences, equivalency, colors, onreorder, onscramble }: Props = $props();

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

	let stripeGradient = $derived(buildStripeGradient(colors, stripePositions));

	let draggingIndex = $state(-1);
	let draggingPosition = { x: 0, y: 0 };
	let draggingOffset = $state({ x: 0, y: 0 });

	function dragstart(l: number, e: PointerEvent) {
		draggingIndex = l;
		if (e.target instanceof HTMLDivElement) {
			e.target.setPointerCapture(e.pointerId);
		}

		draggingPosition = { x: e.clientX, y: e.clientY };
	}

	function dragend(e: PointerEvent) {
		if (draggingIndex < 0) return;

		if (e.target instanceof Element) {
			e.target.releasePointerCapture(e.pointerId);
		}

		let lastBottom = -1;
		for (const [i, div] of equivalencyDivs.entries()) {
			const rect = div.getBoundingClientRect();
			const centerBetween = (rect.top - lastBottom) / 2;

			if (i !== draggingIndex && (i === 0 ? rect.top : centerBetween) <= e.clientY && rect.bottom >= e.clientY) {
				onreorder?.({ from: draggingIndex, to: i });
				break;
			}

			lastBottom = rect.bottom;
		}

		draggingIndex = -1;
		draggingOffset = { x: 0, y: 0 };
	}

	function onpointermove(e: PointerEvent) {
		if (draggingIndex >= 0) {
			draggingOffset = {
				x: e.clientX - draggingPosition.x,
				y: e.clientY - draggingPosition.y
			};
		}
	}

	function getTransform(l: number, draggingOffset: { x: number; y: number }) {
		if (draggingIndex !== l) return 'none';
		return `translate(${draggingOffset.x}px, ${draggingOffset.y}px)`;
	}
</script>

<svelte:window onpointerup={dragend} {onpointermove} />

<div class="color-bar" style:background-image={stripeGradient}></div>
<div class="entries" bind:this={entriesContainer}>
	{#each equivalency as entry, i (i)}
		<div
			class="equivalency"
			style:color={colors[i]}
			onpointerdown={(e) => dragstart(i, e)}
			onpointerup={dragend}
			bind:this={equivalencyDivs[i]}
			style:transform={getTransform(i, draggingOffset)}
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
