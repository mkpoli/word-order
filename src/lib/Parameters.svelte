<script lang="ts">
	import LocaleSelect from '$lib/LocaleSelect.svelte';
	import { LL } from '$i18n/i18n-svelte';
	import type { Alignment, FontFamily, FontStyle } from '$lib/types';

	export let verticalGap = 30;
	export let lineGap = 5;
	export let alignment: Alignment = 'center';
	export let fontFamily: FontFamily = 'default';
	export let fontStyle: FontStyle = 'normal';
	export let fontSize = 15;
</script>

<fieldset>
	<legend>
		<iconify-icon icon="gg:options" inline="true" />
		{$LL.params.options()}
	</legend>

	<label for="vertical-gap">
		<iconify-icon icon="mdi:arrow-expand-vertical" inline="true" />
		{$LL.params.verticalGap()} ({verticalGap}px)
	</label>
	<input type="range" bind:value={verticalGap} id="vertical-gap" name="vertical-gap" min="0" max="100" />
	<label for="line-gap">
		<iconify-icon icon="mdi:arrow-split-horizontal" inline="true" />
		{$LL.params.lineGap()} ({lineGap}px)
	</label>
	<input type="range" bind:value={lineGap} id="line-gap" name="line-gap" min="-5" max={verticalGap / 2} />

	<label for="locale">
		<iconify-icon icon="mdi:earth" inline="true" />
		{$LL.params.displayLanguage()}
	</label>
	<LocaleSelect />
</fieldset>

<fieldset>
	<legend>
		<iconify-icon icon="mdi:format-font" inline="true" />
		{$LL.params.text()}
	</legend>

	<label for="alignment">
		<iconify-icon icon="mdi:format-align-justify" inline="true" />
		{$LL.params.textAlignment()}
	</label>
	<div class="alignment">
		<input type="radio" bind:group={alignment} name="alignment" value="left" id="alignment-left" />
		<label for="alignment-left"><iconify-icon icon="ic:round-format-align-left" /></label>
		<input type="radio" bind:group={alignment} name="alignment" value="center" id="alignment-center" />
		<label for="alignment-center"><iconify-icon icon="ic:round-format-align-center" /></label>
		<input type="radio" bind:group={alignment} name="alignment" value="right" id="alignment-right" />
		<label for="alignment-right"><iconify-icon icon="ic:round-format-align-right" /></label>
	</div>

	<label for="font-family">
		<iconify-icon icon="fluent:text-font-16-regular" inline="true" />
		{$LL.params.fontFamily()}
	</label>
	<select bind:value={fontFamily} id="font" name="font">
		<option value="default">{$LL.params.default()}</option>
		<option value="serif">{$LL.params.serif()}</option>
		<option value="sans-serif">{$LL.params.sansSerif()}</option>
		<option value="monospace">{$LL.params.monospace()}</option>
	</select>

	<label for="font-style">
		<iconify-icon icon="radix-icons:font-family" inline="true" />
		{$LL.params.fontStyle()}
	</label>
	<select bind:value={fontStyle} id="font-style" name="font-style">
		<option value="normal">{$LL.params.normal()}</option>
		<option value="italic">{$LL.params.italic()}</option>
		<option value="bold">{$LL.params.bold()}</option>
		<option value="bold-italic">{$LL.params.boldItalic()}</option>
	</select>

	<label for="font-size">
		<iconify-icon icon="ant-design:font-size-outlined" inline="true" />
		{$LL.params.fontSize()} ({fontSize}px)
	</label>
	<input type="range" bind:value={fontSize} id="font-size" name="font-size" min="10" max="30" />
</fieldset>

<style>
	.alignment {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		justify-content: center;
		align-items: center;

		padding: 0;

		font-size: 1.2em;
		border-radius: 0.2em;
		border: 1px solid transparent;

		color: var(--color-accent);

		overflow: hidden;
		position: relative;
	}

	.alignment:hover {
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
		background-color: var(--color-accent);
		border: 1px solid var(--color-accent);
	}

	input[type='radio'][name='alignment'] {
		position: absolute;
		opacity: 0;
		cursor: pointer;
		height: 0;
		width: 0;
		display: none;
	}

	input[type='radio'][name='alignment'] + label {
		cursor: pointer;
	}

	input:not[type='radio'],
	select {
		margin: 0 0.5em;
	}

	fieldset {
		display: flex;
		flex-direction: column;
		gap: 0.4em;

		padding: 1em 1.5em;
		border-radius: 0.5em;
		border: none;
		box-shadow: 1px 1px 5px 0 #ccc;
	}

	legend {
		background: white;
		padding: 0.2em 0.8em;
		border-radius: 0.3em;
		box-shadow: 1px 1px 5px 0 #ccc;
		font-weight: bold;
	}

	:global(fieldset > select) {
		padding: 0.2em 0.5em;
	}
</style>
