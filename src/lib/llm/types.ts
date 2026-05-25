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

export type KeyValidation = { status: 'valid' } | { status: 'invalid'; reason: string } | { status: 'network-error' };

export interface LlmProvider {
	id: ProviderId;
	label: string;
	models: string[];
	defaultModel: string;
	keyHint: string;
	call(request: TranslateRequest, ctx: ProviderCallContext): Promise<LlmRawResponse>;
	/**
	 * Cheapest possible authenticated round-trip to confirm the key is good.
	 * Should NOT incur token-billable cost — use a metadata endpoint
	 * (e.g. GET /models). Returns:
	 *  - `valid`: 2xx response
	 *  - `invalid`: 401/403, key is rejected
	 *  - `network-error`: 5xx, CORS failure, abort — the key may still be
	 *    fine, we just can't tell from here.
	 */
	validateKey(apiKey: string, signal?: AbortSignal): Promise<KeyValidation>;
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
