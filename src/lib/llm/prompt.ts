import type { TranslateRequest } from './types';

export const SYSTEM_PROMPT = `You translate a set of parallel sentences (the same meaning expressed in several languages) into one or more additional target languages, and produce word-level alignments across ALL sentences (existing + new).

Output JSON ONLY, matching this shape exactly:
{
  "translations": [ { "lang": "<bcp47>", "tokens": ["w1", "w2", ...] } ],
  "alignment_groups": [ [[i,...], [j,...], ...], ... ]
}

Rules:
- The "translations" array contains EXACTLY one entry per requested target, in the SAME ORDER as the request. Do NOT re-emit the existing source sentences.
- Each translation's "tokens" must reconstruct the sentence when joined with no separator (no spaces between tokens). Include whitespace and punctuation as separate tokens for languages that use them (English, French, Russian, etc.) so token boundaries match the Unicode word-segmentation a browser's Intl.Segmenter("word") produces. For scripts without spaces (Japanese, Chinese, Thai), break on natural morpheme/word units.
- "alignment_groups" is an array of groups. Each group is an array of token-index lists, one per sentence in this exact order: [source_0, source_1, ..., source_{S-1}, target_0, target_1, ..., target_{T-1}]. The list at position k contains the indices of tokens in sentence k that mean the same thing as the others in the group. Use an empty list [] when a sentence has no aligned token for a group.
- Use ALL provided source sentences as parallel context — they all express the same meaning. The more sources, the more confident you can be about the target translations and alignments.
- Cover content words (nouns, verbs, adjectives, adverbs, pronouns); skip purely grammatical particles unless they carry meaning that maps cleanly.
- Many-to-many alignments are fine (e.g. an English phrase mapping to a single Japanese compound).
- Do NOT include any prose, markdown, or commentary. JSON only.`;

export function buildUserPrompt(request: TranslateRequest): string {
	const sourceBlocks = request.sources.map((s, i) => {
		const tokens = s.tokens.map((t, j) => `    ${j}: ${JSON.stringify(t)}`).join('\n');
		return `Source ${i} — ${s.lang}
  text: ${JSON.stringify(s.text)}
  tokens (use these indices for alignment_groups[g][${i}]):
${tokens}`;
	}).join('\n\n');

	const targetList = request.targets.map((t, i) => `  ${i + 1}. ${t.lang} (${t.endonym})  → alignment_groups[g][${request.sources.length + i}]`).join('\n');

	return `${sourceBlocks}

Targets (in this exact order — append to alignment_groups slots after the sources):
${targetList}

Translate the meaning into each target and emit the JSON described in the system instructions.`;
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
