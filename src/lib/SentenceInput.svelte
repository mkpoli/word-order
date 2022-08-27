<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getLanguageName } from './lang';
	import { LL, locale } from '$i18n/i18n-svelte';

	export let modifying: number;
	export let sentences: [string, string[]][];

	let lang = 'en';
	let displayName = 'English';
	let text = '';

	$: displayName = getLanguageName(lang, $locale);

	let previousLang = 'en';
	let previousText = '';

	let textArea: HTMLTextAreaElement;

	$: onmodifyingchange(modifying);

	function onmodifyingchange(modifying: number) {
		if (modifying !== -1) {
			previousLang = lang;
			previousText = text;
			lang = sentences[modifying][0];
			text = sentences[modifying][1].join('|');
			textArea.focus();
		} else {
			lang = previousLang;
			text = previousText;
			previousText = '';
		}
	}

	const dispatch = createEventDispatcher<{
		submit: {
			lang: string;
			words: string[];
		};
	}>();

	let empty = false;
</script>

<fieldset>
	<legend>
		<iconify-icon icon="ri:input-cursor-move" inline="true" />
		{$LL.input.input()}
	</legend>

	<div class="input-form">
		<textarea
			placeholder={$LL.input.placeholder()}
			class:empty
			bind:value={text}
			bind:this={textArea}
			on:change={() => {
				empty = false;
			}}
		/>
		<div class="buttons">
			<input type="text" bind:value={lang} id="lang" />
			<label for="lang">{displayName}</label>
			<button
				on:click={() => {
					const words = text.split(modifying === -1 ? /([\s\p{P}]+)|[|]/u : /[|]/u).filter(Boolean);
					if (words.length === 0) {
						empty = true;
						return;
					}
					text = '';
					dispatch('submit', { lang, words });
				}}
			>
				<iconify-icon icon={modifying === -1 ? 'ic:round-plus' : 'material-symbols:edit-rounded'} width="1.3em" height="1.3em" />
				{modifying === -1 ? $LL.input.add() : $LL.input.modify()}
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
</fieldset>

<style>
	fieldset {
		height: 100%;
		padding: 1.5em;
	}

	.input-form {
		display: grid;

		grid-template-areas:
			't t t'
			'l n b'
			'i i i';

		grid-template-rows: 1fr auto auto;

		gap: 1em;

		height: 100%;

		justify-self: stretch;
		align-items: center;
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
		height: 100%;

		grid-area: t;
	}

	.buttons {
		display: contents;
		/* align-items: center;
		gap: 1em;

		 */
	}

	button {
		width: 100%;
		grid-area: b;
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
		grid-area: i;
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

	.empty {
		border-color: var(--color-error);
	}
</style>
