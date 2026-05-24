import { LlmError, type LlmProvider, type LlmRawResponse } from '../types';
import { RESPONSE_JSON_SCHEMA, SYSTEM_PROMPT, buildUserPrompt } from '../prompt';

export const openai: LlmProvider = {
	id: 'openai',
	label: 'OpenAI',
	models: [
		'gpt-5.5',
		'gpt-5.5-pro',
		'gpt-5.4',
		'gpt-5.4-mini',
		'gpt-5.4-nano',
		'gpt-5.4-pro',
		'gpt-5',
		'gpt-5-mini',
		'gpt-5-nano',
		'gpt-4.1',
		'gpt-4.1-mini',
		'gpt-4.1-nano',
		'gpt-4o',
		'gpt-4o-mini'
	],
	defaultModel: 'gpt-5-mini',
	keyHint: 'sk-…',
	async call(request, { apiKey, model, signal }) {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${apiKey}`
			},
			signal,
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					{ role: 'user', content: buildUserPrompt(request) }
				],
				response_format: {
					type: 'json_schema',
					json_schema: {
						name: 'translate_and_align',
						strict: true,
						schema: RESPONSE_JSON_SCHEMA
					}
				}
			})
		});

		if (!response.ok) {
			const text = await response.text().catch(() => response.statusText);
			throw new LlmError(`OpenAI ${response.status}: ${text}`);
		}

		const payload = await response.json();
		const content = payload?.choices?.[0]?.message?.content;
		if (typeof content !== 'string') {
			throw new LlmError('OpenAI returned no message content');
		}

		try {
			return JSON.parse(content) as LlmRawResponse;
		} catch (err) {
			throw new LlmError('OpenAI returned non-JSON content', err);
		}
	}
};
