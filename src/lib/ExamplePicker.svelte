<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { LL } from '../i18n/i18n-svelte';
	import { EXAMPLES, type Example } from './examples';

	export let open = false;

	const dispatch = createEventDispatcher<{
		pick: { example: Example };
	}>();

	function close() {
		open = false;
	}

	function pick(example: Example) {
		dispatch('pick', { example });
		close();
	}

	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}
</script>

<svelte:window on:keydown={onkeydown} />

{#if open}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="backdrop" on:click={close} role="presentation">
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div
			class="dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="examples-title"
			on:click|stopPropagation
		>
			<header>
				<h2 id="examples-title">
					<iconify-icon icon="mdi:bookshelf" inline="true" />
					{$LL.examples.title()}
				</h2>
				<button class="dismiss" type="button" aria-label={$LL.examples.close()} on:click={close}>
					<iconify-icon icon="material-symbols:close-rounded" inline="true" />
				</button>
			</header>

			<ul class="example-list">
				{#each EXAMPLES as example (example.id)}
					<li>
						<button class="example" type="button" on:click={() => pick(example)}>
							<div class="example-name">{example.name}</div>
							<div class="example-langs">
								{#each example.sentences as sentence}
									<span class="lang-chip" lang={sentence.lang}>{sentence.lang}</span>
								{/each}
							</div>
						</button>
					</li>
				{/each}
			</ul>
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
		max-width: 42em;
		width: 100%;
		max-height: calc(100vh - 2em);
		overflow-y: auto;
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
		font-size: 1.3em;
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

	.example-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.6em;
	}

	.example {
		appearance: none;
		width: 100%;
		text-align: left;
		background: rgb(249 251 255 / 0.9);
		border: 1px solid rgb(46 91 255 / 0.18);
		border-radius: 0.55em;
		padding: 0.9em 1em;
		cursor: pointer;
		font: inherit;
		color: inherit;
		display: grid;
		gap: 0.35em;
		transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
	}

	.example:hover {
		background: rgb(46 91 255 / 0.06);
		border-color: rgb(46 91 255 / 0.4);
		transform: translateY(-1px);
	}

	.example-name {
		font-weight: 700;
		font-size: 1.05em;
		color: rgb(33 56 199);
	}

	.example-langs {
		display: flex;
		gap: 0.3em;
		flex-wrap: wrap;
		margin-top: 0.15em;
	}

	.lang-chip {
		font-size: 0.78em;
		font-weight: 600;
		padding: 0.1em 0.5em;
		border-radius: 999px;
		background: rgb(46 91 255 / 0.1);
		color: rgb(33 56 199);
		letter-spacing: 0.04em;
	}
</style>
