<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getLanguageName } from './lang';
	import { LL, locale } from '$i18n/i18n-svelte';
	import { tokenizeSentence } from './tokenize';
	import type { Sentence } from './types';
	import { createSentenceTokens, getSentenceGlosses, getSentenceWords } from './types';

	export let modifying: number;
	export let sentences: Sentence[];
	export let text = '';
	export let glosses: string[] = [];
	export let glossEnabled = false;

	let lang = 'en';
	let displayName = 'English';

	$: displayName = getLanguageName(lang, $locale);
	$: syncGlosses(text, glosses);

	let previousLang = 'en';

	let textArea: HTMLTextAreaElement;

	$: onmodifyingchange(modifying);

	function onmodifyingchange(modifying: number) {
		if (modifying !== -1) {
			previousLang = lang;
			lang = sentences[modifying].lang;
			text = getSentenceWords(sentences[modifying]).join('|');
			glosses = [...getSentenceGlosses(sentences[modifying])];
			glossEnabled = sentences[modifying].showGloss || glosses.some(Boolean);
			textArea.focus();
		} else {
			lang = previousLang;
			text = '';
			glosses = [];
			glossEnabled = false;
		}
	}

	const dispatch = createEventDispatcher<{
		submit: {
			lang: string;
			words: string[];
			glosses: string[];
			showGloss: boolean;
		};
	}>();

	let empty = false;

	function getWords(value: string): string[] {
		return modifying === -1 ? tokenizeSentence(value, lang) : value.split(/[|]/u).filter(Boolean);
	}

	function syncGlosses(value: string, currentGlosses: string[]) {
		const words = getWords(value);
		const nextGlosses = words.map((_, index) => currentGlosses[index] ?? '');

		if (
			nextGlosses.length === currentGlosses.length &&
			nextGlosses.every((gloss, index) => gloss === currentGlosses[index])
		) {
			return;
		}

		glosses = nextGlosses;
	}

	function isGlossableToken(word: string): boolean {
		return !word.match(/^(\s|\p{P}+)$/u);
	}

	$: glossTokens = createSentenceTokens(getWords(text), glosses);
</script>

<fieldset class:editing={modifying !== -1}>
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
		></textarea>
		<details class="gloss-panel" bind:open={glossEnabled}>
			<summary>
				<iconify-icon icon="mdi:format-annotation-plus" inline="true" />
				Interlinear gloss
			</summary>
			<div class="gloss-content">
				{#if glossTokens.length === 0}
					<p class="gloss-empty">Add some words first to enter glosses.</p>
				{:else}
					<div class="gloss-grid">
						{#each glossTokens as token, index}
							{#if isGlossableToken(token.text)}
								<label class="gloss-field" for={`gloss-${index}`}>
									<span class="gloss-word" lang={lang}>{token.text}</span>
									<input id={`gloss-${index}`} type="text" bind:value={glosses[index]} placeholder="Gloss" />
								</label>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</details>
		<div class="buttons">
			<input type="text" bind:value={lang} id="lang" />
			<label for="lang">{displayName}</label>
			<button
				on:click={() => {
					const words = getWords(text);
					if (words.length === 0) {
						empty = true;
						return;
					}
					text = '';
					const nextGlosses = words.map((_, index) => glosses[index] ?? '');
					dispatch('submit', { lang, words, glosses: nextGlosses, showGloss: glossEnabled || nextGlosses.some(Boolean) });
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
		margin: 0;
		border: 1px solid transparent;
		border-radius: 0.4em;
		min-width: 0;
		transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
	}

	fieldset.editing {
		border-color: rgb(46 91 255 / 0.22);
		box-shadow: 0 0 0 0.22rem rgb(46 91 255 / 0.08);
	}

	.input-form {
		display: grid;

		grid-template-areas:
			't t t'
			'g g g'
			'l n b'
			'i i i';

		grid-template-rows: 1fr auto auto auto;

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

	.gloss-panel {
		grid-area: g;
		border: 1px solid rgb(44 71 255 / 18%);
		border-radius: 0.5em;
		background: rgb(249 251 255 / 92%);
		overflow: hidden;
	}

	.gloss-panel summary {
		list-style: none;
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.8em 1em;
		cursor: pointer;
		font-weight: 600;
		color: rgb(35 51 120);
	}

	.gloss-panel summary::-webkit-details-marker {
		display: none;
	}

	.gloss-content {
		padding: 0 1em 1em;
	}

	.gloss-grid {
		display: grid;
		gap: 0.75em;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	}

	.gloss-field {
		display: grid;
		gap: 0.35em;
	}

	.gloss-word {
		display: block;
		font-size: 0.92em;
		font-weight: 600;
		color: rgb(60 67 96);
		word-break: break-word;
	}

	.gloss-empty {
		margin: 0;
		color: rgb(92 98 124);
		font-size: 0.92em;
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

	@media (max-width: 700px) {
		.input-form {
			grid-template-areas:
				't t t'
				'g g g'
				'n n n'
				'l l l'
				'b b b'
				'i i i';
		}

		button {
			width: 100%;
		}
	}

	.empty {
		border-color: var(--color-error);
	}
</style>
