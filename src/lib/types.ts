export type Mode = 'view' | 'edit';
export type Alignment = 'left' | 'right' | 'center';
export type FontFamily = 'default' | 'sans-serif' | 'serif' | 'monospace';
export type FontStyle = 'normal' | 'italic' | 'bold' | 'bold-italic';

export type SentenceToken = {
	text: string;
	gloss: string;
};

export type Sentence = {
	lang: string;
	tokens: SentenceToken[];
	showGloss: boolean;
};

export type LegacySentence = [lang: string, words: string[]];

export type SentenceData =
	| Sentence
	| LegacySentence
	| {
			lang: string;
			words?: string[];
			glosses?: string[];
			showGloss?: boolean;
			tokens?: Array<Partial<SentenceToken>>;
	  };

export function createSentenceTokens(words: string[], glosses: string[] = []): SentenceToken[] {
	return words.map((text, index) => ({ text, gloss: glosses[index] ?? '' }));
}

export function createSentence(lang: string, words: string[], glosses: string[] = [], showGloss = false): Sentence {
	return { lang, tokens: createSentenceTokens(words, glosses), showGloss };
}

export function getSentenceWords(sentence: Sentence): string[] {
	return sentence.tokens.map(({ text }) => text);
}

export function getSentenceGlosses(sentence: Sentence): string[] {
	return sentence.tokens.map(({ gloss }) => gloss);
}

export function normalizeSentence(sentence: SentenceData): Sentence {
	if (Array.isArray(sentence)) {
		const [lang, words] = sentence;
		return createSentence(lang, words);
	}

	if ('tokens' in sentence && Array.isArray(sentence.tokens)) {
		return {
			lang: sentence.lang,
			showGloss: sentence.showGloss ?? sentence.tokens.some((token) => (token.gloss ?? '').length > 0),
			tokens: sentence.tokens.map((token) => ({
				text: token.text ?? '',
				gloss: token.gloss ?? ''
			}))
		};
	}

	const sentenceObject = sentence as {
		lang: string;
		words?: string[];
		glosses?: string[];
		showGloss?: boolean;
	};

	return createSentence(sentenceObject.lang, sentenceObject.words ?? [], sentenceObject.glosses ?? [], sentenceObject.showGloss ?? false);
}
