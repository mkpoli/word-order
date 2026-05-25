<script lang="ts">
	import { createBubbler, stopPropagation } from 'svelte/legacy';

	const bubble = createBubbler();
	import { LL } from '../i18n/i18n-svelte';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	function close() {
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<div class="backdrop" onclick={close} role="presentation">
		<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="about-title" onclick={stopPropagation(bubble('click'))}>
			<header>
				<h2 id="about-title">
					<iconify-icon icon="mdi:information-outline" inline="true"></iconify-icon>
					{$LL.about.title()}
				</h2>
				<button class="dismiss" type="button" aria-label={$LL.about.close()} onclick={close}>
					<iconify-icon icon="material-symbols:close-rounded" inline="true"></iconify-icon>
				</button>
			</header>

			<p class="lede">{$LL.about.tagline()}</p>

			<p class="credit">
				<iconify-icon icon="mdi:lightbulb-outline" inline="true"></iconify-icon>
				<span>
					{@html $LL.about.credit({
						author: '<a href="https://twitter.com/MC_such" target="_blank" rel="noreferrer noopener">@MC_such</a>'
					})}
				</span>
			</p>

			<nav class="links" aria-label={$LL.about.links()}>
				<a href="https://github.com/mkpoli/word-order#readme" target="_blank" rel="noreferrer noopener">
					<iconify-icon icon="mdi:book-open-variant" inline="true"></iconify-icon>
					README
				</a>
				<a href="https://github.com/mkpoli/word-order/" target="_blank" rel="noreferrer noopener">
					<iconify-icon icon="mdi:github" inline="true"></iconify-icon>
					GitHub
				</a>
				<a href="https://twitter.com/mkpoli/status/1562786122782380036" target="_blank" rel="noreferrer noopener">
					<iconify-icon icon="mdi:twitter" inline="true"></iconify-icon>
					2022
				</a>
				<a href="https://x.com/mkpoli/status/2058050806977634725" target="_blank" rel="noreferrer noopener">
					<iconify-icon icon="mdi:twitter" inline="true"></iconify-icon>
					2026
				</a>
			</nav>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgb(20 28 56 / 0.45);
		backdrop-filter: blur(3px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1em;
	}

	.dialog {
		background: white;
		max-width: 32em;
		width: 100%;
		border-radius: 0.8em;
		box-shadow: 0 20px 60px rgb(23 36 78 / 0.3);
		padding: 1.4em 1.6em;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		margin-bottom: 0.4em;
	}

	header h2 {
		margin: 0;
		font-size: 1.25em;
		color: rgb(33 56 199);
		display: flex;
		align-items: center;
		gap: 0.4em;
	}

	.dismiss {
		appearance: none;
		background: none;
		border: none;
		font-size: 1.2em;
		cursor: pointer;
		color: rgb(74 82 112);
		padding: 0.2em 0.4em;
		border-radius: 0.3em;
	}

	.dismiss:hover {
		background: rgb(24 33 61 / 0.08);
	}

	.lede {
		font-size: 1.05em;
		color: rgb(45 55 80);
		margin: 0.6em 0 0.8em;
		line-height: 1.5;
	}

	.credit {
		display: flex;
		gap: 0.5em;
		align-items: baseline;
		color: rgb(74 82 112);
		font-size: 0.95em;
		margin: 0 0 1em;
		line-height: 1.5;
	}

	.credit :global(a) {
		color: rgb(33 56 199);
		text-decoration: none;
		font-weight: 600;
	}

	.credit :global(a:hover) {
		text-decoration: underline;
	}

	.links {
		display: flex;
		gap: 0.5em;
		flex-wrap: wrap;
		margin: 0;
	}

	.links a {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.4em 0.85em;
		border: 1px solid rgb(46 91 255 / 0.3);
		border-radius: 0.4em;
		text-decoration: none;
		color: rgb(33 56 199);
		font-weight: 600;
		font-size: 0.9em;
	}

	.links a:hover {
		background: rgb(46 91 255 / 0.06);
	}
</style>
