import type { Sentence, SentenceData } from './types';
import { normalizeSentence } from './types';
import { EXAMPLES, type Example } from './examples';

export type PersistedDoc = {
	schemaVersion: 1;
	sentences: Sentence[];
	equivalency: number[][][];
};

const STORAGE_KEY = 'word-order:state';
const SCHEMA_VERSION = 1 as const;

type LegacyDoc = { sentences: SentenceData[]; equivalency: number[][][] };

export function createDefaultDoc(): PersistedDoc {
	return docFromExample(EXAMPLES[0]);
}

export function docFromExample(example: Example): PersistedDoc {
	return {
		schemaVersion: SCHEMA_VERSION,
		sentences: structuredClone(example.sentences),
		equivalency: structuredClone(example.equivalency)
	};
}

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

export function loadDoc(): PersistedDoc {
	if (typeof localStorage === 'undefined') return createDefaultDoc();

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return createDefaultDoc();

	try {
		const parsed = JSON.parse(raw);

		// Current single-doc shape
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

		// Earlier multi-project shape from the tabs prototype — pluck the active project's data
		if (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects)) {
			const active =
				parsed.projects.find((p: { id: string }) => p.id === parsed.activeId) ?? parsed.projects[0];
			if (active && Array.isArray(active.sentences) && Array.isArray(active.equivalency)) {
				return {
					schemaVersion: SCHEMA_VERSION,
					sentences: active.sentences.map(normalizeSentence),
					equivalency: active.equivalency
				};
			}
		}

		// Legacy raw {sentences, equivalency} JSON export shape
		if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sentences) && Array.isArray(parsed.equivalency)) {
			return docFromLegacy(parsed as LegacyDoc);
		}
	} catch {
		// fall through to default
	}

	return createDefaultDoc();
}

export function saveDoc(doc: PersistedDoc): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
	} catch {
		// quota or other failure — best effort
	}
}

export function isDocEmpty(doc: { sentences: Sentence[]; equivalency: number[][][] }): boolean {
	return doc.sentences.length === 0 && doc.equivalency.length === 0;
}
