import type { Sentence, SentenceData } from './types';
import { normalizeSentence } from './types';
import type { Example } from './examples';
import { idbAvailable, idbGet, idbSet } from './idb';

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

export function docFromExample(example: Example): PersistedDoc {
	return {
		schemaVersion: SCHEMA_VERSION,
		sentences: structuredClone(example.sentences),
		equivalency: structuredClone(example.equivalency)
	};
}

export function isDocEmpty(doc: { sentences: Sentence[]; equivalency: number[][][] }): boolean {
	return doc.sentences.length === 0 && doc.equivalency.length === 0;
}

// Coerce an unknown blob (parsed JSON from localStorage, or a structured-clone
// object from IndexedDB) into a PersistedDoc, or null if it isn't one.
function parseDoc(parsed: unknown): PersistedDoc | null {
	if (!parsed || typeof parsed !== 'object') return null;
	const obj = parsed as Record<string, unknown>;
	if (!Array.isArray(obj.sentences) || !Array.isArray(obj.equivalency)) return null;
	if (obj.schemaVersion === SCHEMA_VERSION) {
		return {
			schemaVersion: SCHEMA_VERSION,
			sentences: (obj.sentences as SentenceData[]).map(normalizeSentence),
			equivalency: obj.equivalency as number[][][]
		};
	}
	// Tolerate raw {sentences, equivalency} (exported files, older draft shapes).
	return docFromLegacy(obj as unknown as LegacyDoc);
}

function loadDocFromLocalStorage(): PersistedDoc | null {
	if (typeof localStorage === 'undefined') return null;
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		return parseDoc(JSON.parse(raw));
	} catch {
		return null;
	}
}

/**
 * Load the persisted document. IndexedDB is the primary store; localStorage is
 * read only as a migration source / fallback. Async because IndexedDB is —
 * the sole caller already runs in an async onMount.
 */
export async function loadDoc(): Promise<PersistedDoc | null> {
	if (idbAvailable()) {
		try {
			const fromIdb = parseDoc(await idbGet<unknown>(STORAGE_KEY));
			if (fromIdb) return fromIdb;
		} catch {
			// IndexedDB unreadable (private mode, corruption) — fall back to LS.
		}
		// Nothing in IndexedDB yet: migrate an existing localStorage doc in.
		const migrated = loadDocFromLocalStorage();
		if (migrated) idbSet(STORAGE_KEY, migrated).catch(() => {});
		return migrated;
	}
	return loadDocFromLocalStorage();
}

/**
 * Persist the document. Fire-and-forget to IndexedDB (primary), plus a
 * best-effort localStorage mirror so small docs survive even if IndexedDB is
 * unavailable. Large docs that overflow the localStorage quota are silently
 * skipped there — IndexedDB still holds them, which is the whole point of #57.
 */
export function saveDoc(doc: PersistedDoc): void {
	if (idbAvailable()) idbSet(STORAGE_KEY, doc).catch(() => {});
	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
		} catch {
			// Quota exceeded (large doc) or private-mode failure — IndexedDB has it.
		}
	}
}
