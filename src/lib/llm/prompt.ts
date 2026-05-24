import type { TranslateRequest } from './types';

export const SYSTEM_PROMPT = `You translate a set of parallel sentences (the same meaning expressed in several languages) into one or more additional target languages, AND produce a per-token interlinear gloss for each translation.

Output JSON ONLY, matching this shape exactly:
{
  "translations": [
    {
      "lang": "<bcp47>",
      "tokens": ["w1", "w2", ...],
      "glosses": ["g1", "g2", ...]
    }
  ]
}

Tokenisation rules (CRITICAL — read carefully):
- "tokens" is a list of individual word/punctuation/whitespace units. Joining them with the empty string "" must reproduce the sentence exactly.
- For languages that use whitespace word boundaries (English, French, German, Spanish, Italian, Portuguese, Dutch, Russian, Ukrainian, Polish, Greek, Latin, Esperanto, Indonesian, Arabic, etc.):
  - Emit each word as its own token.
  - Emit each single whitespace as its own " " token between words.
  - Emit each punctuation mark as its own token.
  - INCORRECT for "Ich kann Glas essen.":
      ["Ich kann Glas essen."]                              ← single string, wrong
      ["IchkannGlasessen", "."]                              ← concatenated words, wrong
      ["Ich", "kann", "Glas", "essen", "."]                  ← missing spaces, wrong
  - CORRECT for "Ich kann Glas essen.":
      ["Ich", " ", "kann", " ", "Glas", " ", "essen", "."]
- For scripts without spaces (Chinese, Japanese, Thai, Khmer, Lao, Burmese): break on natural morpheme/word units; do NOT insert spaces.
  - Example for "我能吃玻璃。": ["我", "能", "吃", "玻璃", "。"]

Glossing rules:
- "glosses" has EXACTLY the same length as "tokens".
- For whitespace and punctuation tokens, use an empty string "".
- For content tokens (nouns, verbs, adjectives, adverbs, pronouns, content particles), provide a short gloss.
- Glosses are the alignment vehicle: tokens across different sentences that share the SAME gloss string will be visually grouped together. So whenever a target token expresses the same meaning as a source token that already has a gloss, reuse that exact gloss string.
- If sources do not provide a gloss for a meaning, invent a short canonical gloss in English (lowercase lemma, e.g. "eat", "glass", "can") and use it consistently across all targets in this response. When the meaning corresponds 1:1 to a content word in an English-script source sentence, prefer the lowercase lemma of that source word as the gloss (e.g. for "I can eat glass" → use "i", "can", "eat", "glass" as the glosses on the matching target tokens) — this helps connect the new translations to the original rows.
- Follow Leipzig glossing conventions where applicable (1SG, PST, NEG, COP, AUX, etc.).
- One translation entry per requested target, in the SAME ORDER as the request. Do NOT re-emit the source sentences.

Other:
- Use ALL provided source sentences as parallel context — they all express the same meaning. The more sources, the better the target translation.
- Do NOT include any prose, markdown, or commentary. JSON only.`;

function formatSource(s: TranslateRequest['sources'][number], i: number): string {
	const lines = s.tokens.map((tok, j) => {
		const g = s.glosses[j] ?? '';
		const glossPart = g ? `  gloss: ${JSON.stringify(g)}` : '';
		return `    ${j}: ${JSON.stringify(tok)}${glossPart}`;
	});
	const glossNote = s.glosses.some((g) => g.trim()) ? ' (glosses provided — match them in your target)' : ' (no glosses provided)';
	return `Source ${i} — ${s.lang}${glossNote}
  text: ${JSON.stringify(s.text)}
  tokens:
${lines.join('\n')}`;
}

export function buildUserPrompt(request: TranslateRequest): string {
	const sourceBlocks = request.sources.map(formatSource).join('\n\n');
	const targetList = request.targets.map((t, i) => `  ${i + 1}. ${t.lang} (${t.endonym})`).join('\n');

	return `${sourceBlocks}

Targets (in this exact order):
${targetList}

Produce the JSON described in the system instructions.`;
}

export const RESPONSE_JSON_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	required: ['translations'],
	properties: {
		translations: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['lang', 'tokens', 'glosses'],
				properties: {
					lang: { type: 'string' },
					tokens: { type: 'array', items: { type: 'string' } },
					glosses: { type: 'array', items: { type: 'string' } }
				}
			}
		}
	}
} as const;
