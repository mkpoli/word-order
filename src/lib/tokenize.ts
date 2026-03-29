import { rubyRule } from './ruby';

const fallbackSplitRule = /(<ruby>.*?<\/ruby>)|([\s\p{P}]+)|[|]/u;
const tokenRule = /(<ruby>.*?<\/ruby>)|([|])/u;

type WordSegment = { segment: string };
type WordSegmenter = { segment(input: string): Iterable<WordSegment> };

const segmenters = new Map<string, WordSegmenter | null>();

function createSegmenter(lang: string): WordSegmenter | null {
	const locale = lang || 'und';
	const Segmenter = (
		Intl as typeof Intl & {
			Segmenter?: new (locale: string, options: { granularity: 'word' }) => WordSegmenter;
		}
	).Segmenter;

	if (segmenters.has(locale)) {
		return segmenters.get(locale) ?? null;
	}

	if (typeof Intl === 'undefined' || typeof Segmenter === 'undefined') {
		segmenters.set(locale, null);
		return null;
	}

	try {
		const segmenter = new Segmenter(locale, { granularity: 'word' });
		segmenters.set(locale, segmenter);
		return segmenter;
	} catch {
		segmenters.set(locale, null);
		return null;
	}
}

function fallbackSegment(text: string): string[] {
	return text.split(fallbackSplitRule).filter(Boolean);
}

function segmentText(text: string, lang: string): string[] {
	const segmenter = createSegmenter(lang);
	if (!segmenter) return fallbackSegment(text);

	return Array.from(segmenter.segment(text), ({ segment }) => segment).filter(Boolean);
}

export function tokenizeSentence(text: string, lang: string): string[] {
	const tokens: string[] = [];

	for (const part of text.split(tokenRule).filter(Boolean)) {
		if (part === '|') continue;
		if (rubyRule.test(part)) {
			tokens.push(part);
			continue;
		}

		tokens.push(...segmentText(part, lang));
	}

	return tokens;
}
