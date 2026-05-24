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
- A gloss is "<lemma>" OR "<lemma>.<MORPH1>[.<MORPH2>...]". The lemma is a short BARE lowercase English root word for the meaning; the optional dotted suffixes are Leipzig morphology features (ACC, DAT, NOM, 1SG, PST, NEG, etc.) when they are linguistically meaningful for that token. Leipzig suffixes are encouraged when they add real information; omit them otherwise.

ALIGNMENT INVARIANT (non-negotiable): the LEMMA — i.e. everything BEFORE the first "." or "-" in the gloss string — MUST be IDENTICAL across all sentences for the same meaning. Tokens are grouped into one colour by comparing lemmas, so "me", "me.DAT" and "me.ACC" all align with each other, but "me" and "mir" do NOT. Reuse the same lemma string everywhere a meaning recurs.

Prefer the lowercase form of the corresponding English-source content word as the lemma when possible (so for "I can eat glass" → lemma "i", "can", "eat", "glass"). This anchors the new rows to the original parallel sentences.

CORRECT — Leipzig morphology is fine as long as the lemma matches across rows:
  German "mir"     → "me.DAT"   (lemma "me")
  Esperanto "min"  → "me.ACC"   (lemma "me")
  Finnish "minua"  → "me.PART"  (lemma "me")
  Korean "나를"     → "me.ACC"   (lemma "me")
  → all four align together because the lemma is "me" in every case.

INCORRECT — these break alignment because the LEMMAS differ across rows:
  German "mir"  → "to_me"      while Esperanto "min" → "me"       (lemmas "to_me" ≠ "me")
  Finnish "Voin" → "can.1SG"   while Italian "Posso" → "be_able.1SG"
  Korean "나는" → "i.TOP-i.TOP" (use just "i" or "i.TOP" — no duplicated chunk after "-")
  Standalone morphology labels with no lemma ("1SG", "NEG", "PART") → invalid; a gloss MUST start with a lemma.

WORKED EXAMPLE. Parallel sources "I can eat glass." / "Ich kann Glas essen." / "Mi povas manĝi vitron." with extra targets Finnish + Korean:
  German    tokens: ["Ich"," ","kann"," ","Glas"," ","essen","."]
            glosses: ["i","","can","","glass","","eat",""]
  Esperanto tokens: ["Mi"," ","povas"," ","manĝi"," ","vitron","."]
            glosses: ["i","","can","","eat","","glass.ACC",""]
  Finnish   tokens: ["Voin"," ","syödä"," ","lasia","."]
            glosses: ["can.1SG","","eat","","glass.PART",""]   (Finnish "Voin" packs "i"+"can"; gloss the verb meaning)
  Korean    tokens: ["나는"," ","유리를"," ","먹을"," ","수"," ","있다","."]
            glosses: ["i.TOP","","glass.ACC","","eat.MOD","","can","","can",""]

When a single target token packs several meanings (Turkish "yiyebilirim" = eat-can-1SG, Korean "나는" = i-TOP), pick ONE lemma capturing its primary content meaning, optionally followed by Leipzig suffixes. Do not combine multiple lemmas with "." or "-".

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
