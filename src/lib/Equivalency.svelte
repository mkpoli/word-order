<script lang="ts">
	export let sentences: [string, string[]][];
	export let equivalency: number[][][];
	export let colors: string[];
</script>

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

<style>
	.words:not(:last-of-type)::after {
		content: '＝';
	}

	.word:not(:last-of-type)::after {
		content: '|';
	}
</style>
