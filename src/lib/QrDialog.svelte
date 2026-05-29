<script lang="ts">
	import { LL } from '$i18n/i18n-svelte';
	import QRCode from 'qrcode';

	interface Props {
		open?: boolean;
		url?: string;
	}

	let { open = $bindable(false), url = '' }: Props = $props();

	let svgMarkup = $state('');
	let error = $state<string | null>(null);

	// Re-render whenever the dialog opens with a new URL. We render to SVG so
	// the modal preview AND the "Download SVG" button share one source of truth
	// (also a PNG can be rasterised from the SVG cheaply).
	$effect(() => {
		if (!open || !url) {
			svgMarkup = '';
			error = null;
			return;
		}
		QRCode.toString(url, {
			type: 'svg',
			errorCorrectionLevel: 'M',
			margin: 2,
			width: 320,
			color: { dark: '#000000', light: '#ffffff' }
		})
			.then((s) => {
				svgMarkup = s;
				error = null;
			})
			.catch((e: unknown) => {
				// Most likely cause: payload too long. Tell the user instead of
				// rendering a half-broken code.
				const msg = e instanceof Error ? e.message : String(e);
				error = msg;
				svgMarkup = '';
			});
	});

	function close() {
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}

	function downloadSvg() {
		if (!svgMarkup) return;
		const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
		const href = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = href;
		a.download = 'word-order-qr.svg';
		a.click();
		URL.revokeObjectURL(href);
	}

	async function downloadPng() {
		if (!svgMarkup) return;
		// Rasterise the SVG via an off-DOM Image. 1024×1024 gives a sharp PNG
		// for sharing in chats without needing a separate raster pipeline.
		const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml' });
		const svgUrl = URL.createObjectURL(svgBlob);
		try {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('Image load failed'));
				img.src = svgUrl;
			});
			const size = 1024;
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, size, size);
			ctx.drawImage(img, 0, 0, size, size);
			const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
			if (!pngBlob) return;
			const pngUrl = URL.createObjectURL(pngBlob);
			const a = document.createElement('a');
			a.href = pngUrl;
			a.download = 'word-order-qr.png';
			a.click();
			URL.revokeObjectURL(pngUrl);
		} finally {
			URL.revokeObjectURL(svgUrl);
		}
	}

	async function copyUrl() {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			// Older browsers / iframes — surface nothing, user can long-press to copy.
		}
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<!-- Close only on a direct backdrop click — see AboutDialog for rationale. -->
	<div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()} role="presentation">
		<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="qr-title">
			<header>
				<h2 id="qr-title">
					<iconify-icon icon="mdi:qrcode" inline="true"></iconify-icon>
					{$LL.menu.qrTitle()}
				</h2>
				<button class="dismiss" type="button" aria-label={$LL.menu.qrClose()} onclick={close}>
					<iconify-icon icon="material-symbols:close-rounded" inline="true"></iconify-icon>
				</button>
			</header>

			{#if error}
				<p class="error">
					<iconify-icon icon="mdi:alert-outline" inline="true"></iconify-icon>
					<span>{$LL.menu.qrTooLong()}</span>
				</p>
			{:else if svgMarkup}
				<div class="qr-frame">
					{@html svgMarkup}
				</div>

				<div class="url-row">
					<input type="text" readonly value={url} aria-label={$LL.menu.qrLinkLabel()} />
					<button type="button" class="copy" onclick={copyUrl} title={$LL.menu.share()}>
						<iconify-icon icon="mdi:content-copy" inline="true"></iconify-icon>
					</button>
				</div>

				<div class="actions">
					<button type="button" class="fill" onclick={downloadSvg}>
						<iconify-icon icon="mdi:vector-square" inline="true"></iconify-icon>
						{$LL.menu.qrDownloadSvg()}
					</button>
					<button type="button" class="text" onclick={downloadPng}>
						<iconify-icon icon="mdi:image-outline" inline="true"></iconify-icon>
						{$LL.menu.qrDownloadPng()}
					</button>
				</div>
			{:else}
				<p class="loading">…</p>
			{/if}
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
		background: var(--color-surface);
		color: var(--color-text);
		max-width: 26em;
		width: 100%;
		border-radius: 0.8em;
		box-shadow: 0 20px 60px var(--color-shadow);
		padding: 1.4em 1.6em;
		border: 1px solid var(--color-border-soft);
		display: grid;
		gap: 1em;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
	}

	header h2 {
		margin: 0;
		font-size: 1.25em;
		color: var(--color-accent-text);
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
		color: var(--color-text-muted);
		padding: 0.2em 0.4em;
		border-radius: 0.3em;
	}

	.dismiss:hover {
		background: var(--color-hover);
	}

	.qr-frame {
		display: flex;
		justify-content: center;
		background: white;
		padding: 1em;
		border-radius: 0.6em;
		border: 1px solid var(--color-border);
	}

	.qr-frame :global(svg) {
		width: 100%;
		height: auto;
		max-width: 18em;
		display: block;
	}

	.url-row {
		display: flex;
		gap: 0.4em;
	}

	.url-row input {
		flex: 1;
		font-family: monospace;
		font-size: 0.82em;
		padding: 0.4em 0.5em;
		border: 1px solid var(--color-border);
		border-radius: 0.3em;
		background: var(--color-surface);
		color: var(--color-text);
		text-overflow: ellipsis;
	}

	.copy {
		appearance: none;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.3em;
		padding: 0.4em 0.6em;
		cursor: pointer;
		color: var(--color-text);
	}

	.copy:hover {
		background: var(--color-hover);
	}

	.actions {
		display: flex;
		gap: 0.6em;
		justify-content: flex-end;
	}

	.error,
	.loading {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin: 0;
		color: var(--color-text-muted);
	}

	.error {
		color: var(--color-danger, var(--color-error));
	}
</style>
