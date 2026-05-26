<script lang="ts">
	import { run } from 'svelte/legacy';

	// Components
	import RangeSlider from '$lib/ui/RangeSlider.svelte';

	import { LL } from '$i18n/i18n-svelte';
	import type { Alignment, FontFamily, FontStyle, LineStyle } from '$lib/types';
	import { PALETTES, DEFAULT_PALETTE, type PaletteId, pickNColors, oklchToHex } from '$lib/color';

	interface Props {
		verticalGap?: number;
		lineGap?: number;
		lineWidth?: number;
		lineStyle?: LineStyle;
		lineHalo?: boolean;
		lineHaloWidth?: number;
		straightLength?: number;
		endpointCorrection?: number;
		curvature?: number;
		alignment?: Alignment;
		fontFamily?: FontFamily;
		fontStyle?: FontStyle;
		fontSize?: number;
		glossFontSize?: number;
		spaceWidth?: number;
		letterSpacing?: number;
		tokenGap?: number;
		palette?: PaletteId;
	}

	let {
		verticalGap = $bindable(30),
		lineGap = $bindable(5),
		lineWidth = $bindable(1),
		lineStyle = $bindable('solid'),
		lineHalo = $bindable(false),
		lineHaloWidth = $bindable(1.5),
		straightLength = $bindable(0),
		endpointCorrection = $bindable(0),
		curvature = $bindable(1),
		alignment = $bindable('center'),
		fontFamily = $bindable('default'),
		fontStyle = $bindable('normal'),
		fontSize = $bindable(15),
		glossFontSize = $bindable(11),
		spaceWidth = $bindable(4),
		letterSpacing = $bindable(0),
		tokenGap = $bindable(0),
		palette = $bindable(DEFAULT_PALETTE)
	}: Props = $props();

	// Five-swatch preview rendered next to the dropdown so users can see what
	// they're picking. Five samples is enough to show the hue/lightness story
	// without crowding the panel.
	const PALETTE_PREVIEWS: Record<PaletteId, string[]> = Object.fromEntries(
		PALETTES.map(({ id }) => [id, pickNColors(5, false, id).map(oklchToHex)])
	) as Record<PaletteId, string[]>;

	run(() => {
		lineGap = Math.min(lineGap, verticalGap / 2);
	});
	run(() => {
		lineWidth = Math.max(0.1, lineWidth);
	});
	run(() => {
		straightLength = Math.min(straightLength, verticalGap / 2);
	});
	run(() => {
		endpointCorrection = lineGap <= 0 || straightLength > 0 ? 0 : Math.min(endpointCorrection, lineGap);
	});
	run(() => {
		curvature = Math.max(0, Math.min(curvature, 2));
	});
</script>

<fieldset>
	<legend>
		<iconify-icon icon="gg:options" inline="true"></iconify-icon>
		{$LL.params.options()}
	</legend>

	<label for="vertical-gap">
		<iconify-icon icon="mdi:arrow-expand-vertical" inline="true"></iconify-icon>
		{$LL.params.verticalGap()}
	</label>
	<RangeSlider id="vertical-gap" min={0} max={100} bind:value={verticalGap} suffix=" px" />
	<!-- <input type="range" bind:value={verticalGap} id="vertical-gap" name="vertical-gap" min="0" max="100" /> -->

	<label for="line-gap">
		<iconify-icon icon="mdi:arrow-split-horizontal" inline="true"></iconify-icon>
		{$LL.params.lineGap()}
	</label>
	<RangeSlider id="line-gap" min={-5} max={verticalGap / 2} bind:value={lineGap} suffix=" px" />

	<label for="line-width">
		<iconify-icon icon="mdi:vector-line" inline="true"></iconify-icon>
		{$LL.params.lineWidth()}
	</label>
	<RangeSlider id="line-width" min={0.1} max={6} step={0.1} bind:value={lineWidth} suffix=" px" />

	<label for="line-style">
		<iconify-icon icon="mdi:dots-horizontal" inline="true"></iconify-icon>
		{$LL.params.lineStyle()}
	</label>
	<select id="line-style" name="line-style" bind:value={lineStyle}>
		<option value="solid">{$LL.params.lineStyleSolid()}</option>
		<option value="dashed">{$LL.params.lineStyleDashed()}</option>
		<option value="dotted">{$LL.params.lineStyleDotted()}</option>
	</select>

	<label for="line-halo">
		<iconify-icon icon="mdi:circle-double" inline="true"></iconify-icon>
		{$LL.params.lineHalo()}
	</label>
	<div class="halo-row">
		<label class="halo-toggle">
			<input type="checkbox" id="line-halo" bind:checked={lineHalo} />
			<span>{$LL.params.lineHaloOn()}</span>
		</label>
		<RangeSlider id="line-halo-width" min={0.5} max={4} step={0.1} bind:value={lineHaloWidth} suffix=" px" disabled={!lineHalo} />
	</div>

	<label for="straight-length">
		<iconify-icon icon="material-symbols:subdirectory-arrow-right" inline="true"></iconify-icon>
		{$LL.params.straightLength()}
	</label>
	<RangeSlider id="straight-length" min={0} max={verticalGap / 2} bind:value={straightLength} suffix=" px" />

	<label for="endpoint-correction">
		<iconify-icon icon="lets-icons:line" inline="true"></iconify-icon>
		{$LL.params.endpointCorrection()}
	</label>
	<RangeSlider
		id="endpoint-correction"
		min={0}
		max={lineGap}
		step={0.1}
		bind:value={endpointCorrection}
		suffix=" px"
		disabled={lineGap <= 0 || straightLength > 0}
	/>

	<label for="curvature">
		<iconify-icon icon="mdi:transit-connection-variant" inline="true"></iconify-icon>
		{$LL.params.curvature()}
	</label>
	<RangeSlider id="curvature" min={0} max={2} step={0.1} bind:value={curvature} suffix="x" />
</fieldset>

<fieldset>
	<legend>
		<iconify-icon icon="mdi:format-font" inline="true"></iconify-icon>
		{$LL.params.text()}
	</legend>

	<label for="alignment">
		<iconify-icon icon="mdi:format-align-justify" inline="true"></iconify-icon>
		{$LL.params.textAlignment()}
	</label>
	<div class="alignment">
		<input type="radio" bind:group={alignment} name="alignment" value="left" id="alignment-left" />
		<label for="alignment-left"><iconify-icon icon="ic:round-format-align-left"></iconify-icon></label>
		<input type="radio" bind:group={alignment} name="alignment" value="center" id="alignment-center" />
		<label for="alignment-center"><iconify-icon icon="ic:round-format-align-center"></iconify-icon></label>
		<input type="radio" bind:group={alignment} name="alignment" value="right" id="alignment-right" />
		<label for="alignment-right"><iconify-icon icon="ic:round-format-align-right"></iconify-icon></label>
	</div>

	<label for="font-family">
		<iconify-icon icon="fluent:text-font-16-regular" inline="true"></iconify-icon>
		{$LL.params.fontFamily()}
	</label>
	<select bind:value={fontFamily} id="font" name="font">
		<option value="default">{$LL.params.default()}</option>
		<option value="serif">{$LL.params.serif()}</option>
		<option value="sans-serif">{$LL.params.sansSerif()}</option>
		<option value="monospace">{$LL.params.monospace()}</option>
	</select>

	<label for="font-style">
		<iconify-icon icon="radix-icons:font-family" inline="true"></iconify-icon>
		{$LL.params.fontStyle()}
	</label>
	<select bind:value={fontStyle} id="font-style" name="font-style">
		<option value="normal">{$LL.params.normal()}</option>
		<option value="italic">{$LL.params.italic()}</option>
		<option value="bold">{$LL.params.bold()}</option>
		<option value="bold-italic">{$LL.params.boldItalic()}</option>
	</select>

	<label for="font-size">
		<iconify-icon icon="ant-design:font-size-outlined" inline="true"></iconify-icon>
		{$LL.params.fontSize()}
	</label>
	<RangeSlider bind:value={fontSize} id="font-size" min={10} max={30} suffix=" px" />

	<label for="gloss-font-size">
		<iconify-icon icon="mdi:format-annotation-plus" inline="true"></iconify-icon>
		{$LL.params.glossFontSize()}
	</label>
	<RangeSlider bind:value={glossFontSize} id="gloss-font-size" min={6} max={24} suffix=" px" />

	<label for="space-width">
		<iconify-icon icon="mdi:format-horizontal-align-center" inline="true"></iconify-icon>
		{$LL.params.spaceWidth()}
	</label>
	<RangeSlider bind:value={spaceWidth} id="space-width" min={0} max={40} suffix=" px" />

	<label for="letter-spacing">
		<iconify-icon icon="mdi:format-letter-spacing" inline="true"></iconify-icon>
		{$LL.params.letterSpacing()}
	</label>
	<RangeSlider bind:value={letterSpacing} id="letter-spacing" min={-2} max={10} step={0.1} suffix=" px" />

	<label for="token-gap">
		<iconify-icon icon="mdi:arrow-expand-horizontal" inline="true"></iconify-icon>
		{$LL.params.tokenGap()}
	</label>
	<RangeSlider bind:value={tokenGap} id="token-gap" min={0} max={20} step={0.5} suffix=" px" />
</fieldset>

<fieldset>
	<legend>
		<iconify-icon icon="mdi:palette-outline" inline="true"></iconify-icon>
		{$LL.params.colors()}
	</legend>

	<label for="palette">
		<iconify-icon icon="mdi:palette-swatch-outline" inline="true"></iconify-icon>
		{$LL.params.palette()}
	</label>
	<div class="palette-row">
		<select id="palette" name="palette" bind:value={palette}>
			{#each PALETTES as { id } (id)}
				<option value={id}>{$LL.params.paletteNames[id]()}</option>
			{/each}
		</select>
		<span class="palette-preview" aria-hidden="true">
			{#each PALETTE_PREVIEWS[palette] as hex (hex)}
				<span class="swatch" style:background={hex}></span>
			{/each}
		</span>
	</div>
</fieldset>

<style>
	.halo-row {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.6em;
		margin: 0 0.5em;
	}

	.halo-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		font-weight: normal;
		font-size: 0.92em;
		color: var(--color-text-muted);
		cursor: pointer;
		white-space: nowrap;
	}

	.alignment {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		justify-content: center;
		align-items: center;

		padding: 0;

		font-size: 1.2em;
		border-radius: 0.2em;
		border: 1px solid transparent;

		color: var(--color-inactive);

		overflow: hidden;
		position: relative;
	}

	.alignment:hover {
		border-color: var(--color-inactive);
	}

	.alignment:focus-within {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.alignment > label {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.1em;
		margin: 0;
	}

	input[type='radio'][name='alignment']:checked + label {
		color: white;
		background-color: var(--color-inactive);
		border: 1px solid var(--color-inactive);
	}

	.alignment:focus-within > input[type='radio'][name='alignment']:checked + label {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
	}

	input[type='radio'][name='alignment'] {
		position: absolute;
		opacity: 0;
		cursor: pointer;
		height: 0;
		width: 0;
	}

	input[type='radio'][name='alignment'] + label {
		cursor: pointer;
	}

	input:not[type='radio'],
	select {
		margin: 0 0.5em;
	}

	:global(fieldset > select) {
		padding: 0.2em 0.5em;
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 0.2em;
	}

	.palette-row {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 0.5em;
		margin: 0 0.5em;
	}

	.palette-row > select {
		margin: 0;
	}

	.palette-preview {
		display: inline-flex;
		gap: 2px;
		padding: 2px;
		border: 1px solid var(--color-border);
		border-radius: 0.2em;
		background: var(--color-surface);
	}

	.swatch {
		display: inline-block;
		width: 0.9em;
		height: 0.9em;
		border-radius: 2px;
	}
</style>
