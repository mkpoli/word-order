/**
 * Hand-curated linguistic metadata for the locales most likely to appear in
 * Word Order Illustrator diagrams. Closes #83.
 *
 * The display chip in <Output> renders a compact summary —
 *   `Family · Typology · Morphology · Script`
 * — under the language tag. Toggle is wired through the Parameters panel.
 *
 * Family chain is top → leaf; the UI shows the leaf only by default. Speaker
 * tier is informational, not currently rendered, but kept here for future use.
 *
 * Sources cross-referenced for accuracy: WALS, Glottolog, Ethnologue, and
 * established typology reference works. Anything ambiguous (e.g. mixed-order
 * languages, free word-order languages) is tagged with the broadest defensible
 * category.
 */

export type WordOrder = 'SVO' | 'SOV' | 'VSO' | 'VOS' | 'OVS' | 'OSV' | 'free' | 'mixed' | 'analytic';

export type Morphology = 'isolating' | 'agglutinative' | 'fusional' | 'polysynthetic' | 'mixed';

export type SpeakerTier = '>100M' | '10–100M' | '1–10M' | '<1M' | 'extinct' | 'constructed';

export type LangMeta = {
	family: string[];
	typology: WordOrder;
	morphology: Morphology;
	script: string;
	speakers: SpeakerTier;
};

export const LANG_META: Record<string, LangMeta> = {
	// Indo-European — Germanic
	en: { family: ['Indo-European', 'Germanic', 'West Germanic'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '>100M' },
	de: { family: ['Indo-European', 'Germanic', 'West Germanic'], typology: 'mixed', morphology: 'fusional', script: 'Latin', speakers: '10–100M' },
	nl: { family: ['Indo-European', 'Germanic', 'West Germanic'], typology: 'mixed', morphology: 'fusional', script: 'Latin', speakers: '10–100M' },
	sv: { family: ['Indo-European', 'Germanic', 'North Germanic'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '1–10M' },
	no: { family: ['Indo-European', 'Germanic', 'North Germanic'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '1–10M' },
	da: { family: ['Indo-European', 'Germanic', 'North Germanic'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '1–10M' },
	is: { family: ['Indo-European', 'Germanic', 'North Germanic'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '<1M' },
	yi: { family: ['Indo-European', 'Germanic', 'West Germanic'], typology: 'SVO', morphology: 'fusional', script: 'Hebrew', speakers: '<1M' },

	// Indo-European — Romance
	fr: { family: ['Indo-European', 'Italic', 'Romance'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '>100M' },
	es: { family: ['Indo-European', 'Italic', 'Romance'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '>100M' },
	it: { family: ['Indo-European', 'Italic', 'Romance'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '10–100M' },
	pt: { family: ['Indo-European', 'Italic', 'Romance'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '>100M' },
	ro: { family: ['Indo-European', 'Italic', 'Romance'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '10–100M' },
	ca: { family: ['Indo-European', 'Italic', 'Romance'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '1–10M' },
	gl: { family: ['Indo-European', 'Italic', 'Romance'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '1–10M' },
	la: { family: ['Indo-European', 'Italic'], typology: 'SOV', morphology: 'fusional', script: 'Latin', speakers: 'extinct' },

	// Indo-European — Slavic
	ru: { family: ['Indo-European', 'Balto-Slavic', 'East Slavic'], typology: 'SVO', morphology: 'fusional', script: 'Cyrillic', speakers: '>100M' },
	uk: { family: ['Indo-European', 'Balto-Slavic', 'East Slavic'], typology: 'SVO', morphology: 'fusional', script: 'Cyrillic', speakers: '10–100M' },
	pl: { family: ['Indo-European', 'Balto-Slavic', 'West Slavic'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '10–100M' },
	cs: { family: ['Indo-European', 'Balto-Slavic', 'West Slavic'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '1–10M' },
	bg: { family: ['Indo-European', 'Balto-Slavic', 'South Slavic'], typology: 'SVO', morphology: 'fusional', script: 'Cyrillic', speakers: '1–10M' },
	sr: {
		family: ['Indo-European', 'Balto-Slavic', 'South Slavic'],
		typology: 'SVO',
		morphology: 'fusional',
		script: 'Cyrillic / Latin',
		speakers: '1–10M'
	},
	hr: { family: ['Indo-European', 'Balto-Slavic', 'South Slavic'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '1–10M' },

	// Indo-European — Hellenic / Albanian / Armenian / Celtic
	el: { family: ['Indo-European', 'Hellenic'], typology: 'free', morphology: 'fusional', script: 'Greek', speakers: '10–100M' },
	grc: { family: ['Indo-European', 'Hellenic'], typology: 'free', morphology: 'fusional', script: 'Greek', speakers: 'extinct' },
	hy: { family: ['Indo-European', 'Armenian'], typology: 'SOV', morphology: 'agglutinative', script: 'Armenian', speakers: '1–10M' },
	cy: { family: ['Indo-European', 'Celtic'], typology: 'VSO', morphology: 'fusional', script: 'Latin', speakers: '<1M' },
	ga: { family: ['Indo-European', 'Celtic'], typology: 'VSO', morphology: 'fusional', script: 'Latin', speakers: '<1M' },
	gd: { family: ['Indo-European', 'Celtic'], typology: 'VSO', morphology: 'fusional', script: 'Latin', speakers: '<1M' },

	// Indo-European — Indo-Iranian
	fa: { family: ['Indo-European', 'Indo-Iranian', 'Iranian'], typology: 'SOV', morphology: 'fusional', script: 'Arabic', speakers: '10–100M' },
	hi: { family: ['Indo-European', 'Indo-Iranian', 'Indo-Aryan'], typology: 'SOV', morphology: 'fusional', script: 'Devanagari', speakers: '>100M' },
	ur: { family: ['Indo-European', 'Indo-Iranian', 'Indo-Aryan'], typology: 'SOV', morphology: 'fusional', script: 'Arabic', speakers: '10–100M' },
	bn: { family: ['Indo-European', 'Indo-Iranian', 'Indo-Aryan'], typology: 'SOV', morphology: 'fusional', script: 'Bengali', speakers: '>100M' },
	pa: {
		family: ['Indo-European', 'Indo-Iranian', 'Indo-Aryan'],
		typology: 'SOV',
		morphology: 'fusional',
		script: 'Gurmukhi / Shahmukhi',
		speakers: '10–100M'
	},
	gu: { family: ['Indo-European', 'Indo-Iranian', 'Indo-Aryan'], typology: 'SOV', morphology: 'fusional', script: 'Gujarati', speakers: '10–100M' },
	sa: { family: ['Indo-European', 'Indo-Iranian', 'Indo-Aryan'], typology: 'SOV', morphology: 'fusional', script: 'Devanagari', speakers: 'extinct' },

	// Sino-Tibetan
	'zh-HanS': { family: ['Sino-Tibetan', 'Sinitic'], typology: 'SVO', morphology: 'isolating', script: 'Han (Simplified)', speakers: '>100M' },
	'zh-HanT': { family: ['Sino-Tibetan', 'Sinitic'], typology: 'SVO', morphology: 'isolating', script: 'Han (Traditional)', speakers: '10–100M' },
	zh: { family: ['Sino-Tibetan', 'Sinitic'], typology: 'SVO', morphology: 'isolating', script: 'Han', speakers: '>100M' },
	my: { family: ['Sino-Tibetan', 'Tibeto-Burman'], typology: 'SOV', morphology: 'agglutinative', script: 'Myanmar', speakers: '10–100M' },
	bo: { family: ['Sino-Tibetan', 'Tibeto-Burman'], typology: 'SOV', morphology: 'agglutinative', script: 'Tibetan', speakers: '1–10M' },

	// Japonic, Koreanic, Ainu
	ja: { family: ['Japonic'], typology: 'SOV', morphology: 'agglutinative', script: 'Kanji + Kana', speakers: '>100M' },
	'ja-Hira': { family: ['Japonic'], typology: 'SOV', morphology: 'agglutinative', script: 'Hiragana only', speakers: 'extinct' },
	ko: { family: ['Koreanic'], typology: 'SOV', morphology: 'agglutinative', script: 'Hangul', speakers: '10–100M' },
	'ko-Kore': { family: ['Koreanic'], typology: 'SOV', morphology: 'agglutinative', script: 'Hanja + Hangul', speakers: 'extinct' },
	ain: { family: ['Ainu'], typology: 'SOV', morphology: 'polysynthetic', script: 'Latin / Katakana', speakers: '<1M' },

	// Turkic, Mongolic, Tungusic
	tr: { family: ['Turkic', 'Oghuz'], typology: 'SOV', morphology: 'agglutinative', script: 'Latin', speakers: '10–100M' },
	az: { family: ['Turkic', 'Oghuz'], typology: 'SOV', morphology: 'agglutinative', script: 'Latin / Cyrillic', speakers: '10–100M' },
	kk: { family: ['Turkic', 'Kipchak'], typology: 'SOV', morphology: 'agglutinative', script: 'Cyrillic / Latin', speakers: '1–10M' },
	uz: { family: ['Turkic', 'Karluk'], typology: 'SOV', morphology: 'agglutinative', script: 'Latin / Cyrillic', speakers: '10–100M' },
	mn: { family: ['Mongolic'], typology: 'SOV', morphology: 'agglutinative', script: 'Cyrillic / Mongol', speakers: '1–10M' },

	// Uralic
	fi: { family: ['Uralic', 'Finnic'], typology: 'SVO', morphology: 'agglutinative', script: 'Latin', speakers: '1–10M' },
	et: { family: ['Uralic', 'Finnic'], typology: 'SVO', morphology: 'agglutinative', script: 'Latin', speakers: '<1M' },
	hu: { family: ['Uralic', 'Ugric'], typology: 'free', morphology: 'agglutinative', script: 'Latin', speakers: '10–100M' },

	// Afro-Asiatic
	ar: { family: ['Afro-Asiatic', 'Semitic'], typology: 'VSO', morphology: 'fusional', script: 'Arabic', speakers: '>100M' },
	he: { family: ['Afro-Asiatic', 'Semitic'], typology: 'SVO', morphology: 'fusional', script: 'Hebrew', speakers: '1–10M' },
	mt: { family: ['Afro-Asiatic', 'Semitic'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: '<1M' },
	am: { family: ['Afro-Asiatic', 'Semitic'], typology: 'SOV', morphology: 'fusional', script: 'Geʽez', speakers: '10–100M' },

	// Dravidian
	ta: { family: ['Dravidian'], typology: 'SOV', morphology: 'agglutinative', script: 'Tamil', speakers: '10–100M' },
	te: { family: ['Dravidian'], typology: 'SOV', morphology: 'agglutinative', script: 'Telugu', speakers: '10–100M' },
	kn: { family: ['Dravidian'], typology: 'SOV', morphology: 'agglutinative', script: 'Kannada', speakers: '10–100M' },
	ml: { family: ['Dravidian'], typology: 'SOV', morphology: 'agglutinative', script: 'Malayalam', speakers: '10–100M' },

	// Austroasiatic
	vi: { family: ['Austroasiatic', 'Vietic'], typology: 'SVO', morphology: 'isolating', script: 'Latin', speakers: '>100M' },
	km: { family: ['Austroasiatic', 'Khmeric'], typology: 'SVO', morphology: 'isolating', script: 'Khmer', speakers: '10–100M' },

	// Austronesian
	id: { family: ['Austronesian', 'Malayic'], typology: 'SVO', morphology: 'agglutinative', script: 'Latin', speakers: '>100M' },
	ms: { family: ['Austronesian', 'Malayic'], typology: 'SVO', morphology: 'agglutinative', script: 'Latin', speakers: '10–100M' },
	tl: { family: ['Austronesian', 'Philippine'], typology: 'VSO', morphology: 'agglutinative', script: 'Latin', speakers: '10–100M' },

	// Tai–Kadai
	th: { family: ['Tai-Kadai', 'Tai'], typology: 'SVO', morphology: 'isolating', script: 'Thai', speakers: '10–100M' },
	lo: { family: ['Tai-Kadai', 'Tai'], typology: 'SVO', morphology: 'isolating', script: 'Lao', speakers: '<1M' },

	// Niger-Congo
	sw: { family: ['Niger-Congo', 'Bantu'], typology: 'SVO', morphology: 'agglutinative', script: 'Latin', speakers: '10–100M' },
	yo: { family: ['Niger-Congo', 'Volta-Niger'], typology: 'SVO', morphology: 'isolating', script: 'Latin', speakers: '10–100M' },
	zu: { family: ['Niger-Congo', 'Bantu'], typology: 'SVO', morphology: 'agglutinative', script: 'Latin', speakers: '10–100M' },

	// Kartvelian / isolates
	ka: { family: ['Kartvelian'], typology: 'free', morphology: 'agglutinative', script: 'Georgian', speakers: '1–10M' },
	eu: { family: ['Language isolate'], typology: 'SOV', morphology: 'agglutinative', script: 'Latin', speakers: '<1M' },

	// Americas
	qu: { family: ['Quechuan'], typology: 'SOV', morphology: 'agglutinative', script: 'Latin', speakers: '1–10M' },
	nv: { family: ['Na-Dene', 'Athabaskan'], typology: 'SOV', morphology: 'polysynthetic', script: 'Latin', speakers: '<1M' },

	// Constructed
	eo: { family: ['Constructed (auxiliary)'], typology: 'SVO', morphology: 'agglutinative', script: 'Latin', speakers: 'constructed' },
	ia: { family: ['Constructed (auxiliary)'], typology: 'SVO', morphology: 'fusional', script: 'Latin', speakers: 'constructed' },
	tok: { family: ['Constructed (minimal)'], typology: 'SVO', morphology: 'isolating', script: 'Latin', speakers: 'constructed' }
};

/**
 * Look up metadata for a BCP-47 code. Tries the exact code first, then strips
 * subtags (region, script, variant) and tries the base language until a hit
 * or we run out — so `en-US` finds `en`, `ko-Kore` keeps its specific entry,
 * and `de-CH` finds `de`.
 */
export function getLangMeta(code: string): LangMeta | null {
	if (LANG_META[code]) return LANG_META[code];
	const parts = code.split('-');
	while (parts.length > 1) {
		parts.pop();
		const candidate = parts.join('-');
		if (LANG_META[candidate]) return LANG_META[candidate];
	}
	return null;
}
