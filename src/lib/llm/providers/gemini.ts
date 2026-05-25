import { LlmError, type LlmProvider, type LlmRawResponse } from '../types';
import { RESPONSE_JSON_SCHEMA, SYSTEM_PROMPT, buildUserPrompt } from '../prompt';

function toGeminiSchema(schema: unknown): unknown {
	if (Array.isArray(schema)) return schema.map(toGeminiSchema);
	if (schema === null || typeof schema !== 'object') return schema;
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
		if (key === 'additionalProperties') continue;
		if (key === 'type' && typeof value === 'string') {
			result.type = value.toUpperCase();
			continue;
		}
		result[key] = toGeminiSchema(value);
	}
	return result;
}

const GEMINI_SCHEMA = toGeminiSchema(RESPONSE_JSON_SCHEMA);

export const gemini: LlmProvider = {
	id: 'gemini',
	label: 'Google Gemini',
	models: ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
	defaultModel: 'gemini-2.5-flash',
	keyHint: 'AIza…',
	async call(request, { apiKey, model, signal }) {
		const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			signal,
			body: JSON.stringify({
				systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
				contents: [{ role: 'user', parts: [{ text: buildUserPrompt(request) }] }],
				generationConfig: {
					responseMimeType: 'application/json',
					responseSchema: GEMINI_SCHEMA
				}
			})
		});

		if (!response.ok) {
			const text = await response.text().catch(() => response.statusText);
			throw new LlmError(`Gemini ${response.status}: ${text}`);
		}

		const payload = await response.json();
		const parts = payload?.candidates?.[0]?.content?.parts;
		const text = Array.isArray(parts) ? parts.map((p: { text?: string }) => p?.text ?? '').join('') : '';
		if (!text) throw new LlmError('Gemini returned no text content');

		let raw: LlmRawResponse;
		try {
			raw = JSON.parse(text) as LlmRawResponse;
		} catch (err) {
			throw new LlmError('Gemini returned non-JSON content', err);
		}
		const u = payload?.usageMetadata;
		const usage =
			u && typeof u.promptTokenCount === 'number' && typeof u.candidatesTokenCount === 'number'
				? { inputTokens: u.promptTokenCount, outputTokens: u.candidatesTokenCount }
				: undefined;
		return { raw, usage };
	}
};
