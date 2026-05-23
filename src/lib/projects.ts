import type { Sentence, SentenceData } from './types';
import { normalizeSentence } from './types';

export type PersistedDoc = {
	schemaVersion: 1;
	sentences: Sentence[];
	equivalency: number[][][];
};

const STORAGE_KEY = 'word-order:state';
const SCHEMA_VERSION = 1 as const;

type LegacyDoc = { sentences: SentenceData[]; equivalency: number[][][] };

export function docFromLegacy(doc: LegacyDoc): PersistedDoc {
	return {
		schemaVersion: SCHEMA_VERSION,
		sentences: doc.sentences.map(normalizeSentence),
		equivalency: doc.equivalency
	};
}

export function docToLegacy(doc: { sentences: Sentence[]; equivalency: number[][][] }): LegacyDoc {
	return { sentences: doc.sentences, equivalency: doc.equivalency };
}

export function isDocEmpty(doc: { sentences: Sentence[]; equivalency: number[][][] }): boolean {
	return doc.sentences.length === 0 && doc.equivalency.length === 0;
}

export function loadDoc(): PersistedDoc | null {
	if (typeof localStorage === 'undefined') return null;

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw);

		if (
			parsed &&
			typeof parsed === 'object' &&
			parsed.schemaVersion === SCHEMA_VERSION &&
			Array.isArray(parsed.sentences) &&
			Array.isArray(parsed.equivalency)
		) {
			return {
				schemaVersion: SCHEMA_VERSION,
				sentences: parsed.sentences.map(normalizeSentence),
				equivalency: parsed.equivalency
			};
		}

		// Tolerate raw {sentences, equivalency} JSON (exported files, older draft shapes)
		if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sentences) && Array.isArray(parsed.equivalency)) {
			return docFromLegacy(parsed as LegacyDoc);
		}
	} catch {
		// fall through
	}

	return null;
}

export function saveDoc(doc: PersistedDoc): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
	} catch {
		// quota or other failure — best effort
	}
}
