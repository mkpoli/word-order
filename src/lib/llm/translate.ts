import { createSentence, type Sentence } from '$lib/types';
import { llmSettings, type LlmSettings } from '$lib/settings';
import { get } from 'svelte/store';
import { getProvider } from './providers';
import type { TranslateRequest } from './types';
import { LlmError } from './types';
import { validate } from './validate';

export const MAX_SOURCE_TOKENS = 120;

export type TranslateResult = {
	sentences: Sentence[];
};

export async function translateAndAlign(
	request: TranslateRequest,
	settings: LlmSettings = get(llmSettings),
	signal?: AbortSignal
): Promise<TranslateResult> {
	if (request.sources.length === 0) {
		throw new LlmError('No source sentences.');
	}
	for (const [i, s] of request.sources.entries()) {
		if (s.tokens.length > MAX_SOURCE_TOKENS) {
			throw new LlmError(`Source sentence ${i + 1} (${s.lang}) is too long (${s.tokens.length} tokens, max ${MAX_SOURCE_TOKENS}).`);
		}
	}
	if (request.targets.length === 0) {
		throw new LlmError('No target languages selected.');
	}

	const provider = getProvider(settings.provider);
	const apiKey = settings.keys[settings.provider];
	if (!apiKey) throw new LlmError(`No API key set for ${provider.label}.`);
	const model = settings.model || provider.defaultModel;

	const raw = await provider.call(request, { apiKey, model, signal });
	const validated = validate(raw, request);

	const sentences: Sentence[] = validated.translations.map((t) => {
		const showGloss = t.glosses.some((g) => g.trim().length > 0);
		return createSentence(t.lang, t.tokens, t.glosses, showGloss);
	});
	return { sentences };
}
