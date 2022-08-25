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
	<textarea placeholder="Input new sentence here..." bind:value={text} />
	<div class="buttons">
		<input type="text" bind:value={lang} id="lang" />
		<label for="lang">{displayName}</label>
		<button
			on:click={() => {
				dispatch('add', { lang, words: text.split(/([\s\p{P}]+)|[|]/u).filter(Boolean) });
			}}>Add</button
		>
	</div>
	<div>
		Each word are separated automatically by space and punctuations. Use <code title="(U+007C, VERTICAL LINE)">|</code> for further separation or
		non-space separated script, such as CJK / Thai / Tibetan / etc., e.g.
		<code>我|愛|你。</code>
		→
		<span style="display:inline-flex">
			<span style="color:orange">我</span>
			<span style="color:crimson">愛</span>
			<span style="color:hotpink">你</span>
			<span>。</span>
		</span>
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
		margin: 0 0.2em;
		background: lightgrey;
		padding: 0.3em 0.5em;
		box-shadow: 1px 1px 5px 0 #ccc;
	}

	textarea {
		resize: none;
	}

	.buttons {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	button {
		width: 100%;
	}
</style>
