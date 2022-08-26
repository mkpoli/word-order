<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getLanguageName } from './lang';
	import { LL, locale } from '$i18n/i18n-svelte';

	let lang = 'en';
	let displayName = 'English';
	let text = '';

	$: displayName = getLanguageName(lang, $locale);

	const dispatch = createEventDispatcher<{
		add: {
			lang: string;
			words: string[];
		};
	}>();
</script>

<div class="input-form">
	<textarea placeholder={$LL.input.placeholder()} bind:value={text} />
	<div class="buttons">
		<input type="text" bind:value={lang} id="lang" />
		<label for="lang">{displayName}</label>
		<button
			on:click={() => {
				dispatch('add', { lang, words: text.split(/([\s\p{P}]+)|[|]/u).filter(Boolean) });
			}}
		>
			<iconify-icon icon="ic:round-plus" width="1.3em" height="1.3em" />
			{$LL.input.add()}
		</button>
	</div>
	<div class="guidance">
		<iconify-icon icon="ph:info" width="1.5em" height="1.5em" />
		<p>
			{@html $LL.input.guidance({
				delimiter: '<code title="(U+007C, VERTICAL LINE)">|</code>',
				example: `
<code>我|愛|你。</code>
→
<span style="display:inline-flex; font-family: sans-serif;" lang="zh-HanT">
	<span style="color:orange">我</span>
	<span style="color:crimson">愛</span>
	<span style="color:hotpink">你</span>
	<span>。</span>
</span>
`
			})}
		</p>
	</div>
</div>

<style>
	.input-form {
		display: grid;

		padding: 1em;
		gap: 1em;
	}

	:global(code) {
		display: inline-block;
		margin: 0 0.2em;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 0.2em;
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

	.guidance {
		background: rgb(0, 123, 255, 0.1);
		padding: 1em 0.8em;
		border-radius: 0.2em;
		border: 1px solid rgb(0, 123, 255);

		color: rgb(0, 39, 80);

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1em;
	}

	.guidance > p {
		margin: 0;
	}

	button {
		appearance: none;
		background: linear-gradient(to bottom, rgb(73 132 255), rgb(44 71 255));

		font-weight: bold;

		border: none;
		border-radius: 0.2em;
		padding: 0.5em 1em;

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;

		color: white;
	}

	button:hover {
		opacity: 0.8;
	}
</style>
