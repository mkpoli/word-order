<script lang="ts">
	import { parseRuby, rubyRule } from './ruby';

	interface Props {
		word: string;
	}

	let { word }: Props = $props();
</script>

{#each word.split(rubyRule) as part}
	{#if part.match(rubyRule)}{@const { rb, rt } = parseRuby(part)}<ruby>{rb}<rt>{rt}</rt></ruby>{:else}{part}{/if}{/each}
