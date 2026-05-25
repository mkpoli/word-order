import { LlmError, type LlmProvider, type LlmRawResponse } from '../types';
import { RESPONSE_JSON_SCHEMA, SYSTEM_PROMPT, buildUserPrompt } from '../prompt';

const TOOL_NAME = 'emit_translation';

export const anthropic: LlmProvider = {
	id: 'anthropic',
	label: 'Anthropic',
	models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-4-6', 'claude-sonnet-4-5', 'claude-opus-4-5', 'claude-opus-4-1'],
	defaultModel: 'claude-haiku-4-5',
	keyHint: 'sk-ant-…',
	async call(request, { apiKey, model, signal }) {
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'anthropic-dangerous-direct-browser-access': 'true'
			},
			signal,
			body: JSON.stringify({
				model,
				max_tokens: 4096,
				system: SYSTEM_PROMPT,
				tools: [
					{
						name: TOOL_NAME,
						description: 'Emit the translations and alignment groups.',
						input_schema: RESPONSE_JSON_SCHEMA
					}
				],
				tool_choice: { type: 'tool', name: TOOL_NAME },
				messages: [{ role: 'user', content: buildUserPrompt(request) }]
			})
		});

		if (!response.ok) {
			const text = await response.text().catch(() => response.statusText);
			throw new LlmError(`Anthropic ${response.status}: ${text}`);
		}

		const payload = await response.json();
		const toolBlock = Array.isArray(payload?.content)
			? payload.content.find((block: { type?: string; name?: string }) => block?.type === 'tool_use' && block?.name === TOOL_NAME)
			: undefined;
		if (!toolBlock || typeof toolBlock.input !== 'object' || toolBlock.input === null) {
			throw new LlmError('Anthropic did not return the expected tool_use block');
		}
		return toolBlock.input as LlmRawResponse;
	},
	async validateKey(apiKey, signal) {
		try {
			const r = await fetch('https://api.anthropic.com/v1/models', {
				method: 'GET',
				headers: {
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
					'anthropic-dangerous-direct-browser-access': 'true'
				},
				signal
			});
			if (r.ok) return { status: 'valid' };
			if (r.status === 401 || r.status === 403) {
				const text = await r.text().catch(() => r.statusText);
				return { status: 'invalid', reason: text || `${r.status}` };
			}
			return { status: 'network-error' };
		} catch {
			return { status: 'network-error' };
		}
	}
};
