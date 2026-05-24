import type { ProviderId } from '$lib/settings';
import type { LlmProvider } from '../types';
import { anthropic } from './anthropic';
import { gemini } from './gemini';
import { openai } from './openai';

const REGISTRY: Record<ProviderId, LlmProvider> = {
	openai,
	anthropic,
	gemini
};

export const PROVIDERS: LlmProvider[] = [openai, anthropic, gemini];

export function getProvider(id: ProviderId): LlmProvider {
	return REGISTRY[id];
}
