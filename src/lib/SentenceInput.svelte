<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';

	const LANGUAGE_NAMES = getContext<Intl.DisplayNames>('LANGUAGE_NAMES');
	let lang = 'en';
	let displayName = 'English';
	let text = '';

	$: try {
		displayName = LANGUAGE_NAMES.of(lang)!;
	} catch (e) {
		displayName = lang;
	}

	const dispatch = createEventDispatcher<{
		add: {
			lang: string;
			words: string[];
		};
	}>();
</script>

<div class="input-form">
	<div>
		Please input the sentence here. Each word are separated automatically by space and punctuations. For further separtion (especially for
		CJK/Thai/Tibetan/etc. whose words are not separated by spaces), use the <code>|</code> (U+007C, VERTICAL LINE) instead.
	</div>
	<textarea placeholder="Input new sentence here..." bind:value={text} />
	<div>
		<input type="text" bind:value={lang} id="lang" />
		<label for="lang">{displayName}</label>
		<button
			on:click={() => {
				dispatch('add', { lang, words: text.split(/([\s\p{P}]+)|[|]/u).filter(Boolean) });
			}}>Add</button
		>
	</div>
</div>

<style>
	.input-form {
		display: grid;

		padding: 1em;
		gap: 1em;
	}

	code {
		display: inline-block;
		margin: 0 0.5em;
		background: lightgrey;
		padding: 0.5em;
		box-shadow: 1px 1px 5px 0 #ccc;
	}

	textarea {
		resize: none;
	}
</style>
