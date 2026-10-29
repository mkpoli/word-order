<script lang="ts">
	import { LL } from '../i18n/i18n-svelte';
	import 'iconify-icon';

	// The header's Sponsor pill, led by the author's face, and the dialog it opens: her portrait,
	// why she needs help, then three steps that end at the Ko-fi button.
	let open = $state(false);
	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (open && dialog && !dialog.open) dialog.showModal();
	});

	// The dialog lives under <body>, away from the header's stacking and wrapping.
	function portal(node: HTMLElement) {
		document.body.append(node);
		return { destroy: () => node.remove() };
	}

	// A click on the backdrop closes the dialog; one on its own scrollbar also targets the dialog,
	// so only a click outside its box counts.
	function outside(event: MouseEvent) {
		if (!dialog || event.target !== dialog) return;
		const box = dialog.getBoundingClientRect();
		const { clientX: x, clientY: y } = event;
		if (x < box.left || x > box.right || y < box.top || y > box.bottom) dialog.close();
	}

	const heart = 'M12 21s-8.5-5.1-8.5-11.3A4.7 4.7 0 0 1 12 6.9a4.7 4.7 0 0 1 8.5 2.8C20.5 15.9 12 21 12 21Z';
</script>

<button type="button" class="sponsor" aria-label={$LL.sponsor.label()} aria-haspopup="dialog" onclick={() => (open = true)}>
	<span class="face" aria-hidden="true">
		<img src="/sponsor-face.webp" alt="" width="26" height="26" decoding="async" />
		<svg class="face-heart" viewBox="0 0 24 24"><path d={heart} /></svg>
	</span>
	<span class="label">{$LL.sponsor.label()}</span>
</button>

{#if open}
	<dialog class="sponsor-dialog" bind:this={dialog} use:portal aria-labelledby="sponsor-title" onclose={() => (open = false)} onclick={outside}>
		<header>
			<h2 id="sponsor-title">{$LL.sponsor.label()}</h2>
			<button class="dismiss" type="button" aria-label={$LL.sponsor.close()} onclick={() => dialog?.close()}>
				<iconify-icon icon="material-symbols:close-rounded" inline="true"></iconify-icon>
			</button>
		</header>
		<div class="sheet">
			<div class="hero" aria-hidden="true">
				<span class="portrait">
					<img src="/sponsor-portrait.webp" alt="" width="112" height="112" decoding="async" />
					<svg class="heart" viewBox="0 0 24 24">
						<path d={heart} />
						<ellipse class="shine" cx="7.6" cy="9.6" rx="1.5" ry="2.1" transform="rotate(-30 7.6 9.6)" />
					</svg>
				</span>
				<span class="spark s1">✦</span><span class="spark s2">✦</span><span class="spark s3">✦</span>
			</div>
			<p class="lead">{$LL.sponsor.lead()}</p>
			<p class="ask">{$LL.sponsor.ask()}</p>
			<section class="how">
				<h3>{$LL.sponsor.howTo()}</h3>
				<ol class="steps" role="list">
					{#each $LL.sponsor.steps as step, i (i)}<li>{step()}</li>{/each}
				</ol>
			</section>
			<a class="kofi" href="https://ko-fi.com/mkpoli" target="_blank" rel="noreferrer noopener">
				<span class="mark" aria-hidden="true"><iconify-icon icon="mdi:coffee-outline"></iconify-icon></span>
				<span class="copy"><strong>Ko-fi</strong><small>{$LL.sponsor.kofi()}</small></span>
				<iconify-icon class="arrow" icon="mdi:arrow-right" aria-hidden="true"></iconify-icon>
			</a>
			<a class="company" href="mailto:mkpoli@mkpo.li?subject=Sponsorship%20on%20word-order.mkpo.li">
				<iconify-icon icon="mdi:email-outline" aria-hidden="true"></iconify-icon>
				<span class="copy"><strong>{$LL.sponsor.company()}</strong><small>{$LL.sponsor.companyHint()}</small></span>
			</a>
			<p class="thanks">{$LL.sponsor.thanks()}</p>
		</div>
	</dialog>
{/if}

<style>
	.sponsor,
	.sponsor-dialog {
		--sp-ink: light-dark(#c2185b, #ffb3cd);
		--sp-heart: light-dark(#ff4f88, #ff7aa6);
		--sp-line: light-dark(#ffc2d6, #6b2c47);
		--sp-soft: light-dark(#fff1f5, #2f1822);
		--sp-ring: light-dark(#fff, #3d1a2b);
	}

	.sponsor {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 0.55rem;
		min-height: 2.4rem;
		padding: 0 1rem 0 0.35rem;
		border: 1px solid var(--sp-line);
		border-radius: 999px;
		background: linear-gradient(135deg, light-dark(#ffe6ef, #3d1a2b), light-dark(#fff0e0, #3a2318));
		color: var(--sp-ink);
		font-size: 1.02em;
		font-weight: bold;
		white-space: nowrap;
		cursor: pointer;
		box-shadow: 0 1px 2px rgb(194 24 91 / 0.12);
	}

	.sponsor:focus-visible,
	.dismiss:focus-visible,
	.kofi:focus-visible,
	.company:focus-visible {
		outline: 2px solid var(--color-accent-text);
		outline-offset: 2px;
	}

	.face {
		position: relative;
		flex: none;
		width: 1.65rem;
		height: 1.65rem;
	}

	.face img {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		box-shadow:
			0 0 0 1.5px var(--sp-ring),
			0 0 0 2.5px var(--sp-line);
	}

	.face-heart {
		position: absolute;
		right: -4px;
		bottom: -3px;
		width: 12px;
		height: 12px;
		fill: var(--sp-heart);
		stroke: var(--sp-ring);
		stroke-width: 2.5;
		paint-order: stroke;
		overflow: visible;
		transform-origin: 50% 60%;
	}

	@media (max-width: 720px) {
		.sponsor {
			width: 2.4rem;
			padding: 0;
			justify-content: center;
		}

		.label {
			display: none;
		}
	}

	.sponsor-dialog {
		width: min(480px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: 16px;
		background: var(--color-surface-elevated);
		color: var(--color-text);
		box-shadow: 0 30px 90px var(--color-shadow);
		overflow: auto;
	}

	.sponsor-dialog::backdrop {
		background: rgb(0 0 0 / 0.4);
		backdrop-filter: blur(4px);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 14px 0 24px;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.dismiss {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 1.25rem;
		cursor: pointer;
	}

	.dismiss:hover {
		background: var(--color-hover);
		color: var(--color-text);
	}

	.sheet {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 4px 24px 22px;
	}

	.sheet p {
		margin: 0;
	}

	.hero {
		position: relative;
		display: grid;
		place-items: center;
		height: 136px;
		background: radial-gradient(closest-side, light-dark(#ffd9e5, #4a1e31), transparent);
	}

	.portrait {
		position: relative;
		width: 112px;
		height: 112px;
	}

	.portrait img {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		box-shadow:
			0 0 0 4px var(--color-surface-elevated),
			0 0 0 6px var(--sp-line),
			0 10px 24px rgb(255 79 136 / 0.3);
	}

	.heart {
		position: absolute;
		right: -2px;
		bottom: 2px;
		width: 34px;
		height: 34px;
		fill: var(--sp-heart);
		stroke: var(--color-surface-elevated);
		stroke-width: 2;
		paint-order: stroke;
		overflow: visible;
		transform-origin: 50% 60%;
		filter: drop-shadow(0 3px 6px rgb(255 79 136 / 0.35));
	}

	.heart .shine {
		fill: #fff;
		stroke: none;
		opacity: 0.6;
	}

	.spark {
		position: absolute;
		color: var(--sp-heart);
		opacity: 0.75;
	}

	.s1 {
		top: 22px;
		left: calc(50% - 84px);
		font-size: 14px;
	}

	.s2 {
		top: 12px;
		left: calc(50% + 66px);
		font-size: 10px;
	}

	.s3 {
		bottom: 20px;
		left: calc(50% - 76px);
		font-size: 11px;
	}

	.lead {
		font-size: 0.95rem;
		line-height: 1.65;
	}

	.ask {
		font-size: 1rem;
		font-weight: bold;
		line-height: 1.5;
		color: var(--sp-ink);
	}

	.sheet:lang(ko) {
		word-break: keep-all;
	}

	.how {
		padding: 12px 14px;
		border: 1px dashed var(--sp-line);
		border-radius: 14px;
		background: var(--sp-soft);
	}

	h3 {
		margin: 0 0 8px;
		font-size: 0.85rem;
		color: var(--sp-ink);
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.steps li {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-size: 0.9rem;
		line-height: 1.45;
		counter-increment: step;
	}

	.steps li::before {
		content: counter(step);
		display: grid;
		flex: none;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--sp-ink);
		color: var(--sp-soft);
		font-size: 11px;
		font-weight: bold;
		line-height: 1;
		transform: translateY(-1px);
	}

	.kofi {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 18px 12px 12px;
		border-radius: 999px;
		background: linear-gradient(135deg, #d81b60, #b0124f);
		color: #fff;
		text-decoration: none;
		box-shadow: 0 6px 16px rgb(216 27 96 / 0.32);
	}

	.mark {
		display: grid;
		flex: none;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.22);
		font-size: 20px;
	}

	.arrow {
		flex: none;
		font-size: 18px;
	}

	.copy {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.copy strong {
		font-size: 0.9rem;
	}

	.copy small {
		font-size: 0.8rem;
		line-height: 1.4;
	}

	.kofi .copy strong {
		font-size: 1rem;
	}

	.company {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 8px 12px;
		border-radius: 12px;
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.company:hover {
		background: var(--color-hover);
		color: var(--color-text);
	}

	.company > iconify-icon {
		flex: none;
		margin-top: 2px;
	}

	.company .copy strong {
		font-size: 0.85rem;
		color: var(--color-text);
	}

	.thanks {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		text-align: center;
	}

	@media (prefers-reduced-motion: no-preference) {
		.sponsor {
			transition:
				transform 180ms ease,
				box-shadow 180ms ease;
		}

		.sponsor:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgb(255 79 136 / 0.28);
		}

		.face-heart,
		.heart {
			animation: beat 2.8s ease-in-out infinite;
		}

		.sponsor:hover .face-heart,
		.sponsor:focus-visible .face-heart {
			animation: bounce 0.6s ease-in-out infinite;
		}

		.spark {
			animation: twinkle 2.4s ease-in-out infinite;
		}

		.s2 {
			animation-delay: 0.8s;
		}

		.s3 {
			animation-delay: 1.6s;
		}

		.sponsor-dialog[open] {
			animation: arrive 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
		}

		.kofi {
			transition:
				transform 180ms ease,
				box-shadow 180ms ease;
		}

		.kofi:hover {
			transform: translateY(-1px);
			box-shadow: 0 8px 22px rgb(216 27 96 / 0.42);
		}
	}

	@keyframes beat {
		0%,
		70%,
		100% {
			transform: scale(1);
		}
		78% {
			transform: scale(1.18);
		}
		86% {
			transform: scale(0.96);
		}
		93% {
			transform: scale(1.1);
		}
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		40% {
			transform: translateY(-2px) scale(1.18) rotate(-8deg);
		}
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(0.7);
		}
		50% {
			opacity: 0.9;
			transform: scale(1);
		}
	}

	@keyframes arrive {
		from {
			opacity: 0;
			transform: translateY(14px) scale(0.98);
		}
	}
</style>
