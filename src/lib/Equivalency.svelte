<script lang="ts">
	import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import Word from './Word.svelte';

	const dispatch = createEventDispatcher();

	export let sentences: [string, string[]][];
	export let equivalency: number[][][];
	export let colors: string[];

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

	let stripePositions: number[] = [];
	let entriesContainer: HTMLDivElement;

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

	afterUpdate(() => {
		updateStripePositions();
	});

	$: stripeGradient = buildStripeGradient(colors, stripePositions);

	let draggingIndex = -1;
	let draggingPosition = { x: 0, y: 0 };
	let draggingOffset = { x: 0, y: 0 };
	let equivalencyDivs: HTMLDivElement[] = [];

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
				dispatch('reorder', {
					from: draggingIndex,
					to: i
				});
				break;
			}

			lastBottom = rect.bottom;
		}

		draggingIndex = -1;
		draggingOffset = { x: 0, y: 0 };
	}

	function onpointermove(e: PointerEvent) {
		if (draggingIndex >= 0) {
			draggingOffset.x = e.clientX - draggingPosition.x;
			draggingOffset.y = e.clientY - draggingPosition.y;
		}
	}

	function getTransform(l: number, draggingOffset: { x: number; y: number }) {
		if (draggingIndex !== l) return 'none';
		return `translate(${draggingOffset.x}px, ${draggingOffset.y}px)`;
	}
</script>

<svelte:window on:pointerup={dragend} on:pointermove={onpointermove} />

<div class="color-bar" style:background-image={stripeGradient} />
<div class="entries" bind:this={entriesContainer}>
	{#each equivalency as entry, i}
		<div
			class="equivalency"
			style:color={colors[i]}
			on:pointerdown={(e) => dragstart(i, e)}
			on:pointerup={dragend}
			bind:this={equivalencyDivs[i]}
			style:transform={getTransform(i, draggingOffset)}
		>
			{#each entry as words, j}
				<span class="words">
					{#if words.length === 0}
						<span class="word">❌</span>
					{:else}
						{#each words as k}
							<span lang={sentences[j][0]} class="word"><Word word={sentences[j][1][k]} /></span>
						{/each}
					{/if}
				</span>
			{/each}
		</div>
	{/each}
</div>
<button class="scramble-all" title={$LL.menu.scramble()} aria-label={$LL.menu.scramble()} on:click={() => dispatch('scramble')}>
	<iconify-icon icon="fad:random-1dice" width="1.5em" />
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
		color: #777;
		transition: color 0.15s ease;
	}

	.scramble-all:hover {
		color: #333;
	}
</style>
