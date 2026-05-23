<script lang="ts">
	import { LL } from '../i18n/i18n-svelte';

	export let open = false;

	let dialog: HTMLDivElement;

	function close() {
		open = false;
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
			aria-labelledby="help-title"
			bind:this={dialog}
			on:click|stopPropagation
		>
			<header>
				<h2 id="help-title">
					<iconify-icon icon="mdi:help-circle-outline" inline="true" />
					{$LL.help.title()}
				</h2>
				<button class="dismiss" type="button" aria-label={$LL.help.close()} on:click={close}>
					<iconify-icon icon="material-symbols:close-rounded" inline="true" />
				</button>
			</header>

			<section>
				<p class="lede">{$LL.help.tagline()}</p>
				<p>{$LL.help.intro()}</p>
			</section>

			<section>
				<h3>{$LL.help.howTitle()}</h3>
				<ol>
					<li>{$LL.help.howStep1()}</li>
					<li>{$LL.help.howStep2()}</li>
					<li>{$LL.help.howStep3()}</li>
					<li>{$LL.help.howStep4()}</li>
				</ol>
			</section>

			<section>
				<h3>{$LL.help.featuresTitle()}</h3>
				<ul>
					<li>{$LL.help.featureTokenization()}</li>
					<li>{$LL.help.featureGloss()}</li>
					<li>{$LL.help.featureRuby()}</li>
					<li>{$LL.help.featureTabs()}</li>
					<li>{$LL.help.featureAutosave()}</li>
					<li>{$LL.help.featureExport()}</li>
				</ul>
			</section>

			<footer>
				<button class="ok" type="button" on:click={close}>{$LL.help.gotIt()}</button>
			</footer>
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
		max-width: 36em;
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
		margin-bottom: 0.5em;
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

	section {
		margin-top: 1em;
	}

	section h3 {
		font-size: 1em;
		margin: 0 0 0.4em;
		color: rgb(33 56 199);
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.lede {
		font-size: 1.05em;
		color: rgb(35 51 120);
		margin: 0 0 0.5em;
	}

	p,
	li {
		line-height: 1.55;
		color: rgb(45 55 80);
	}

	ol,
	ul {
		padding-left: 1.3em;
		margin: 0;
		display: grid;
		gap: 0.3em;
	}

	footer {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.2em;
	}

	.ok {
		appearance: none;
		background: linear-gradient(to bottom, rgb(73 132 255), rgb(44 71 255));
		border: none;
		color: white;
		font-weight: 600;
		padding: 0.5em 1.1em;
		border-radius: 0.4em;
		cursor: pointer;
	}

	.ok:hover {
		opacity: 0.9;
	}
</style>
