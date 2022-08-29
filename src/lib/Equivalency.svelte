<script lang="ts">
	import { pickNColors, lch2rgb } from '$lib/color';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let sentences: [string, string[]][];
	export let equivalency: number[][][];
	export let colors: string[];

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

<div
	class="color-bar"
	style:background-image={`linear-gradient(to bottom, ${pickNColors(15)
		.map(lch2rgb)
		.map((c, i) => `${c} ${((i * 1) / 15) * 100}%`)
		.join(', ')})`}
/>
<div class="entries">
	{#each equivalency as entry, i}
		<div
			class="equivalency"
			style={`color: ${colors[i]}`}
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
							<span class="word">{sentences[j][1][k]}</span>
						{/each}
					{/if}
				</span>
			{/each}
		</div>
	{/each}
</div>

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
	}

	.words:not(:last-of-type)::after {
		content: '＝';
	}

	.word:not(:last-of-type)::after {
		content: '|';
	}
</style>
