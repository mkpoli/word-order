import type { LlmRawResponse, LlmTranslation, TranslateRequest } from './types';
import { LlmError } from './types';

export type ValidatedTranslation = {
	lang: string;
	tokens: string[];
	glosses: string[];
};

export type ValidatedResponse = {
	translations: ValidatedTranslation[];
};

const NO_SPACE_SCRIPTS = new Set(['zh', 'ja', 'ko', 'th', 'lo', 'km', 'my', 'bo']);

function localeUsesSpaces(lang: string): boolean {
	const base = lang.toLowerCase().split(/[-_]/)[0];
	return !NO_SPACE_SCRIPTS.has(base);
}

function isWhitespace(s: string): boolean {
	return /^\s+$/u.test(s);
}

function isPunctuation(s: string): boolean {
	return /^\p{P}+$/u.test(s);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * If the locale uses whitespace word boundaries but the LLM forgot to emit whitespace
 * tokens, inject single-space tokens between content tokens (with empty glosses) so the
 * sentence renders correctly. Skip insertion adjacent to punctuation.
 */
function ensureWhitespace(tokens: string[], glosses: string[], lang: string): { tokens: string[]; glosses: string[] } {
	if (!localeUsesSpaces(lang)) return { tokens, glosses };
	if (tokens.some(isWhitespace)) return { tokens, glosses };
	if (tokens.length < 2) return { tokens, glosses };

	const outTokens: string[] = [];
	const outGlosses: string[] = [];
	for (let i = 0; i < tokens.length; i++) {
		outTokens.push(tokens[i]);
		outGlosses.push(glosses[i] ?? '');
		const next = tokens[i + 1];
		if (next === undefined) continue;
		const curIsPunct = isPunctuation(tokens[i]);
		const nextIsPunct = isPunctuation(next);
		// Skip whitespace before an immediately-following punctuation mark, but always
		// space after punctuation (so "end. Next" works).
		if (nextIsPunct && !curIsPunct) continue;
		outTokens.push(' ');
		outGlosses.push('');
	}
	return { tokens: outTokens, glosses: outGlosses };
}

export function validate(raw: LlmRawResponse, request: TranslateRequest): ValidatedResponse {
	if (!raw || typeof raw !== 'object') {
		throw new LlmError('Model response is not an object');
	}

	const rawTranslations = (raw as { translations?: unknown }).translations;

	if (!Array.isArray(rawTranslations) || rawTranslations.length !== request.targets.length) {
		throw new LlmError(`Expected ${request.targets.length} translations, got ${Array.isArray(rawTranslations) ? rawTranslations.length : 'none'}`);
	}

	const translations: ValidatedTranslation[] = rawTranslations.map((entry: unknown, i: number): ValidatedTranslation => {
		const requested = request.targets[i];
		if (!entry || typeof entry !== 'object') {
			throw new LlmError(`Translation ${i} is not an object`);
		}
		const t = entry as Partial<LlmTranslation>;
		if (!isStringArray(t.tokens)) {
			throw new LlmError(`Translation ${i} has invalid tokens`);
		}

		// Reject obviously concatenated output for space-using languages: the LLM
		// occasionally returns a single multi-word token like "IchkannGlasessen…"
		// for German. Better to surface as an error than render a single giant token.
		if (localeUsesSpaces(requested.lang)) {
			const tooLong = t.tokens.find((tok) => tok.length > 25);
			if (tooLong) {
				throw new LlmError(
					`Translation for ${requested.lang} looks malformed (single token "${tooLong.slice(0, 30)}…" — model ignored the per-word tokenisation rule). Try again or switch to a stronger model.`
				);
			}
		}

		const rawGlosses = isStringArray(t.glosses) ? t.glosses : [];
		// Pad/truncate glosses to match tokens length.
		const glosses = t.tokens.map((_, j) => rawGlosses[j] ?? '');
		const fixed = ensureWhitespace(t.tokens, glosses, requested.lang);

		return {
			lang: requested.lang,
			tokens: fixed.tokens,
			glosses: fixed.glosses
		};
	});

	return { translations };
}
