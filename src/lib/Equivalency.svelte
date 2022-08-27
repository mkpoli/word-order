<script lang="ts">
	import { pickNColors, lch2rgb } from '$lib/color';

	export let sentences: [string, string[]][];
	export let equivalency: number[][][];
	export let colors: string[];

	console.log(
		`linear-gradient(to bottom, ${pickNColors(20)
			.map(lch2rgb)
			.map((c, i) => `${c} ${((i * 1) / 20) * 100}%`)
			.join(', ')})`
	);
</script>

<div
	class="color-bar"
	style:background-image={`linear-gradient(to bottom, ${pickNColors(15)
		.map(lch2rgb)
		.map((c, i) => `${c} ${((i * 1) / 15) * 100}%`)
		.join(', ')})`}
/>
<div class="entries">
	{#each equivalency as entry, i}
		<div class="equivalency" style={`color: ${colors[i]}`}>
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
