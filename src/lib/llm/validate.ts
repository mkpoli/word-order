import { tokenizeSentence } from '$lib/tokenize';
import type { LlmRawResponse, LlmTranslation, TranslateRequest } from './types';
import { LlmError } from './types';

export type ValidatedTranslation = {
	lang: string;
	tokens: string[];
	/** True when the LLM's tokens matched Intl.Segmenter; alignments only kept when true. */
	tokensTrusted: boolean;
};

export type ValidatedResponse = {
	translations: ValidatedTranslation[];
	/** Shape: alignment_groups[group][sentence][token_index]; sentence 0 = source, 1.. = targets. */
	alignment_groups: number[][][];
};

function arraysEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

export function validate(raw: LlmRawResponse, request: TranslateRequest): ValidatedResponse {
	if (!raw || typeof raw !== 'object') {
		throw new LlmError('Model response is not an object');
	}

	const rawTranslations = (raw as { translations?: unknown }).translations;
	const rawGroups = (raw as { alignment_groups?: unknown }).alignment_groups;

	if (!Array.isArray(rawTranslations) || rawTranslations.length !== request.targets.length) {
		throw new LlmError(`Expected ${request.targets.length} translations, got ${Array.isArray(rawTranslations) ? rawTranslations.length : 'none'}`);
	}

	const translations: ValidatedTranslation[] = rawTranslations.map((entry: unknown, i: number): ValidatedTranslation => {
		const requested = request.targets[i];
		if (!entry || typeof entry !== 'object') {
			throw new LlmError(`Translation ${i} is not an object`);
		}
		const t = entry as Partial<LlmTranslation>;
		if (typeof t.lang !== 'string' || !isStringArray(t.tokens)) {
			throw new LlmError(`Translation ${i} has wrong shape`);
		}

		const text = t.tokens.join('');
		const segmenterTokens = tokenizeSentence(text, requested.lang);
		const trusted = arraysEqual(t.tokens, segmenterTokens);

		return {
			lang: requested.lang,
			tokens: trusted ? t.tokens : segmenterTokens,
			tokensTrusted: trusted
		};
	});

	const sentenceLengths = [request.source.tokens.length, ...translations.map((t) => t.tokens.length)];

	if (!Array.isArray(rawGroups)) {
		return { translations, alignment_groups: [] };
	}

	const cleanedGroups: number[][][] = [];
	for (const group of rawGroups) {
		if (!Array.isArray(group)) continue;
		const cleanedGroup: number[][] = sentenceLengths.map((len, sentenceIdx) => {
			// Drop entire sentence's alignments if its tokens were not trusted (sentenceIdx 0 = source, always trusted).
			if (sentenceIdx > 0 && !translations[sentenceIdx - 1].tokensTrusted) return [];
			const slot = group[sentenceIdx];
			if (!Array.isArray(slot)) return [];
			const seen = new Set<number>();
			const out: number[] = [];
			for (const idx of slot) {
				if (typeof idx !== 'number' || !Number.isInteger(idx)) continue;
				if (idx < 0 || idx >= len) continue;
				if (seen.has(idx)) continue;
				seen.add(idx);
				out.push(idx);
			}
			return out;
		});
		if (cleanedGroup.some((indices) => indices.length > 0)) {
			cleanedGroups.push(cleanedGroup);
		}
	}

	return { translations, alignment_groups: cleanedGroups };
}
