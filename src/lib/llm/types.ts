import type { ProviderId } from '$lib/settings';

export type TranslateRequest = {
	sources: Array<{
		lang: string;
		text: string;
		tokens: string[];
		/** Per-token glosses; same length as tokens. Empty string for non-content tokens or where the user didn't gloss. */
		glosses: string[];
	}>;
	targets: Array<{
		lang: string;
		endonym: string;
	}>;
};

export type LlmTranslation = {
	lang: string;
	tokens: string[];
	glosses: string[];
};

export type LlmRawResponse = {
	translations: LlmTranslation[];
};

export type ProviderCallContext = {
	apiKey: string;
	model: string;
	signal?: AbortSignal;
};

export interface LlmProvider {
	id: ProviderId;
	label: string;
	models: string[];
	defaultModel: string;
	keyHint: string;
	call(request: TranslateRequest, ctx: ProviderCallContext): Promise<LlmRawResponse>;
}

export class LlmError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown
	) {
		super(message);
		this.name = 'LlmError';
	}
}
