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

export type TokenUsage = {
	inputTokens: number;
	outputTokens: number;
};

export type ProviderCallResult = {
	raw: LlmRawResponse;
	/**
	 * Provider-reported token counts. Optional because some endpoints / older
	 * API versions don't return them; UI hides the usage chip when absent.
	 */
	usage?: TokenUsage;
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
	call(request: TranslateRequest, ctx: ProviderCallContext): Promise<ProviderCallResult>;
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
