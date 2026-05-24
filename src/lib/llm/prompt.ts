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

Glossing rules (the WHOLE POINT of glosses here is alignment — read this carefully):
- "glosses" has EXACTLY the same length as "tokens". Whitespace and punctuation use "".
- A gloss is a SHORT, BARE English lemma — lowercase, no morphology markers, no case suffixes, no Leipzig codes.
- The SAME meaning across all target translations MUST use the EXACT same gloss string (string equality is how tokens get grouped into colour-aligned sets across rows). This is non-negotiable; it is the entire point of the glosses.
- Prefer using the surface form of the corresponding English-source content word as the gloss when possible, lowercase (so "I can eat glass" → use "i", "can", "eat", "glass" on the matching target tokens). This anchors the new rows to the original parallel sentences.

INCORRECT — these break alignment because the strings don't match across rows:
  "me.DAT", "me.ACC", "me.OBJ", "me.PART"        → use just "me" in all of them
  "can.1SG", "can.MOD"                            → just "can"
  "eat.PST", "eat.MOD", "eat.INF"                 → just "eat"
  "glass.ACC", "glass.PART", "glass.NOM"          → just "glass"
  "hurt.CONN", "hurt.CONNEG", "hurt.PASS"         → just "hurt"
  "and.NEG"                                       → use "and" on the conjunction token, "not" on the separate negation token
  "i.TOP-i.TOP", "1SG"                            → just "i"
  Standalone morphology labels (1SG, PST, NEG, COP, AUX, TOP, DECL, PART, ACC, DAT...)  → omit; glosses are MEANINGS, not features

CORRECT worked example. Given parallel sources "I can eat glass." / "Ich kann Glas essen." / "Mi povas manĝi vitron.":
  English   gloss inventory: i, can, eat, glass
  German    tokens: ["Ich"," ","kann"," ","Glas"," ","essen","."]
            glosses: ["i","","can","","glass","","eat",""]
  Esperanto tokens: ["Mi"," ","povas"," ","manĝi"," ","vitron","."]
            glosses: ["i","","can","","eat","","glass",""]
  Finnish   tokens: ["Voin"," ","syödä"," ","lasia","."]
            glosses: ["can","","eat","","glass",""]   (Finnish "Voin" packs "i" + "can" — gloss the dominant meaning, the verb)
  Korean    tokens: ["나는"," ","유리를"," ","먹을"," ","수"," ","있다","."]
            glosses: ["i","","glass","","eat","","can","","can",""]  (split-verb auxiliary — both tokens get "can")

When a single target token packs several meanings (Turkish "yiyebilirim" = eat-can-1SG, Korean "나는" = i-TOP), pick the ONE bare lemma that best captures its primary content meaning. Do not combine glosses with "." or "-".

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
