<script lang="ts">
	import LocaleSelect from '$lib/LocaleSelect.svelte';
	import { LL } from '$i18n/i18n-svelte';
	import type { Alignment } from '$lib/types';

	export let verticalGap = 30;
	export let lineGap = 5;
	export let alignment: Alignment = 'center';
</script>

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

<label for="alignment">{$LL.params.textAlignment()}</label>
<div class="alignment">
	<input type="radio" bind:group={alignment} name="alignment" value="left" id="alignment-left" />
	<label for="alignment-left"><iconify-icon icon="ic:round-format-align-left" /></label>
	<input type="radio" bind:group={alignment} name="alignment" value="center" id="alignment-center" />
	<label for="alignment-center"><iconify-icon icon="ic:round-format-align-center" /></label>
	<input type="radio" bind:group={alignment} name="alignment" value="right" id="alignment-right" />
	<label for="alignment-right"><iconify-icon icon="ic:round-format-align-right" /></label>
</div>

<label for="locale">{$LL.params.displayLanguage()}</label>
<LocaleSelect />
