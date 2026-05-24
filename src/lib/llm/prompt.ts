import type { TranslateRequest } from './types';

export const SYSTEM_PROMPT = `You translate one source sentence into several target languages and produce word-level alignments.

Output JSON ONLY, matching this shape exactly:
{
  "translations": [ { "lang": "<bcp47>", "tokens": ["w1", "w2", ...] } ],
  "alignment_groups": [ [[i,...], [j,...], ...], ... ]
}

Rules:
- Provide one translation per requested target, in the SAME ORDER as the request.
- Each translation's "tokens" must reconstruct the sentence when joined with no separator (no spaces between tokens). Include whitespace and punctuation as separate tokens for languages that use them (English, French, Russian, etc.) so token boundaries match the Unicode word-segmentation a browser's Intl.Segmenter("word") produces. For scripts without spaces (Japanese, Chinese, Thai), break on natural morpheme/word units.
- "alignment_groups" is an array of groups. Each group is an array of token-index lists, one per sentence in this order: [source, target_1, target_2, ...]. The list at position k contains the indices of tokens in sentence k that mean the same thing as the others in the group. Use an empty list [] when a sentence has no aligned token for a group.
- Cover content words (nouns, verbs, adjectives, adverbs, pronouns); skip purely grammatical particles unless they carry meaning that maps cleanly.
- Many-to-many alignments are fine (e.g. an English phrase mapping to a single Japanese compound).
- Do NOT include any prose, markdown, or commentary. JSON only.`;

export function buildUserPrompt(request: TranslateRequest): string {
	const sourceTokens = request.source.tokens.map((t, i) => `  ${i}: ${JSON.stringify(t)}`).join('\n');
	const targetList = request.targets.map((t, i) => `  ${i + 1}. ${t.lang} (${t.endonym})`).join('\n');
	return `Source language: ${request.source.lang}
Source text: ${JSON.stringify(request.source.text)}
Source tokens (use these indices for alignment_groups[g][0]):
${sourceTokens}

Targets (in this exact order — alignment_groups[g][1+i] refers to target i):
${targetList}

Translate the source into each target and emit the JSON described in the system instructions.`;
}

export const RESPONSE_JSON_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	required: ['translations', 'alignment_groups'],
	properties: {
		translations: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['lang', 'tokens'],
				properties: {
					lang: { type: 'string' },
					tokens: { type: 'array', items: { type: 'string' } }
				}
			}
		},
		alignment_groups: {
			type: 'array',
			items: {
				type: 'array',
				items: {
					type: 'array',
					items: { type: 'integer', minimum: 0 }
				}
			}
		}
	}
} as const;
