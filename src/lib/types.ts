export type Mode = 'view' | 'edit';
export type Alignment = 'left' | 'right' | 'center';
export type FontFamily = 'default' | 'sans-serif' | 'serif' | 'monospace';
export type FontStyle = 'normal' | 'italic' | 'bold' | 'bold-italic';

export type AnnotationPosition = 'above' | 'below';
export type Margin = { top: number; right: number; bottom: number; left: number };

export type SentenceToken = {
	text: string;
	annotationsAbove: string[];
	annotationsBelow: string[];
};

export type Sentence = {
	lang: string;
	tokens: SentenceToken[];
	lanesAbove: number;
	lanesBelow: number;
	showGloss: boolean;
};

export type LegacySentence = [lang: string, words: string[]];

type LegacyTokenShape = Partial<SentenceToken> & { gloss?: string };

export type SentenceData =
	| Sentence
	| LegacySentence
	| {
			lang: string;
			words?: string[];
			glosses?: string[];
			showGloss?: boolean;
			lanesAbove?: number;
			lanesBelow?: number;
			tokens?: Array<LegacyTokenShape>;
	  };

export function createSentenceTokens(words: string[], glosses: string[] = []): SentenceToken[] {
	return words.map((text, index) => ({
		text,
		annotationsAbove: glosses[index] ? [glosses[index]] : [],
		annotationsBelow: []
	}));
}

export function createSentence(lang: string, words: string[], glosses: string[] = [], showGloss = false): Sentence {
	const tokens = createSentenceTokens(words, glosses);
	const lanesAbove = glosses.some(Boolean) ? 1 : 0;
	return normalizeLanes({ lang, tokens, lanesAbove, lanesBelow: 0, showGloss });
}

export function getSentenceWords(sentence: Sentence): string[] {
	return sentence.tokens.map(({ text }) => text);
}

/** Returns the topmost above-lane (lane index 0 above the word). Useful for legacy callers that thought in single-gloss terms. */
export function getSentenceGlosses(sentence: Sentence): string[] {
	return sentence.tokens.map(({ annotationsAbove }) => annotationsAbove[0] ?? '');
}

export function getLaneValues(sentence: Sentence, position: AnnotationPosition, lane: number): string[] {
	return sentence.tokens.map((token) => (position === 'above' ? token.annotationsAbove[lane] : token.annotationsBelow[lane]) ?? '');
}

export function setTokenAnnotation(token: SentenceToken, position: AnnotationPosition, lane: number, value: string): SentenceToken {
	const annotations = position === 'above' ? [...token.annotationsAbove] : [...token.annotationsBelow];
	annotations[lane] = value;
	return position === 'above'
		? { ...token, annotationsAbove: annotations }
		: { ...token, annotationsBelow: annotations };
}

/** Pad/truncate each token's annotation arrays to match `lanesAbove` and `lanesBelow`. */
export function normalizeLanes(sentence: Sentence): Sentence {
	const tokens = sentence.tokens.map((token) => ({
		text: token.text,
		annotationsAbove: fitLane(token.annotationsAbove, sentence.lanesAbove),
		annotationsBelow: fitLane(token.annotationsBelow, sentence.lanesBelow)
	}));
	return { ...sentence, tokens };
}

function fitLane(values: string[], length: number): string[] {
	const out = new Array(length).fill('');
	for (let i = 0; i < Math.min(values.length, length); i++) out[i] = values[i] ?? '';
	return out;
}

function normalizeToken(token: LegacyTokenShape): SentenceToken {
	const text = token.text ?? '';
	if (Array.isArray(token.annotationsAbove) || Array.isArray(token.annotationsBelow)) {
		return {
			text,
			annotationsAbove: (token.annotationsAbove ?? []).map((v) => v ?? ''),
			annotationsBelow: (token.annotationsBelow ?? []).map((v) => v ?? '')
		};
	}
	const legacyGloss = token.gloss ?? '';
	return {
		text,
		annotationsAbove: legacyGloss ? [legacyGloss] : [],
		annotationsBelow: []
	};
}

export function sentenceHasAnyAnnotation(sentence: Sentence): boolean {
	return sentence.tokens.some(
		(t) => t.annotationsAbove.some((v) => v && v.trim().length > 0) || t.annotationsBelow.some((v) => v && v.trim().length > 0)
	);
}

export function normalizeSentence(sentence: SentenceData): Sentence {
	if (Array.isArray(sentence)) {
		const [lang, words] = sentence;
		return createSentence(lang, words);
	}

	if ('tokens' in sentence && Array.isArray(sentence.tokens)) {
		const tokens = sentence.tokens.map(normalizeToken);
		const lanesAbove =
			(sentence as { lanesAbove?: number }).lanesAbove ?? tokens.reduce((max, t) => Math.max(max, t.annotationsAbove.length), 0);
		const lanesBelow =
			(sentence as { lanesBelow?: number }).lanesBelow ?? tokens.reduce((max, t) => Math.max(max, t.annotationsBelow.length), 0);
		const showGloss = sentence.showGloss ?? tokens.some((t) => t.annotationsAbove.some(Boolean) || t.annotationsBelow.some(Boolean));
		return normalizeLanes({ lang: sentence.lang, tokens, lanesAbove, lanesBelow, showGloss });
	}

	const sentenceObject = sentence as {
		lang: string;
		words?: string[];
		glosses?: string[];
		showGloss?: boolean;
	};

	return createSentence(sentenceObject.lang, sentenceObject.words ?? [], sentenceObject.glosses ?? [], sentenceObject.showGloss ?? false);
}
