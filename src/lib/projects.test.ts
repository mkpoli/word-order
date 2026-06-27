import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { loadDoc, saveDoc, type PersistedDoc } from './projects';

// projects.ts reads the bare `localStorage` / `indexedDB` globals. In this
// test environment indexedDB is absent, so loadDoc/saveDoc exercise the
// localStorage fallback path — which is exactly the safety net we want to
// pin down. (The IndexedDB-primary path is covered by the Playwright e2e.)
type Store = Record<string, string>;
const g = globalThis as unknown as {
	localStorage?: {
		getItem: (k: string) => string | null;
		setItem: (k: string, v: string) => void;
		removeItem: (k: string) => void;
	};
	indexedDB?: unknown;
};

let savedIndexedDB: unknown;

function installLocalStorageStub() {
	const store: Store = {};
	g.localStorage = {
		getItem: (k) => (k in store ? store[k] : null),
		setItem: (k, v) => {
			store[k] = String(v);
		},
		removeItem: (k) => {
			delete store[k];
		}
	};
	return store;
}

const SAMPLE: PersistedDoc = {
	schemaVersion: 1,
	sentences: [{ lang: 'en', tokens: [{ text: 'hi', annotationsAbove: [], annotationsBelow: [] }], lanesAbove: 0, lanesBelow: 0, showGloss: false }],
	equivalency: []
};

describe('projects persistence (localStorage fallback)', () => {
	beforeEach(() => {
		// Force the IndexedDB-unavailable branch.
		savedIndexedDB = g.indexedDB;
		delete g.indexedDB;
		installLocalStorageStub();
	});
	afterEach(() => {
		g.indexedDB = savedIndexedDB;
		delete g.localStorage;
	});

	test('round-trips a saved doc through localStorage', async () => {
		saveDoc(SAMPLE);
		const loaded = await loadDoc();
		expect(loaded).not.toBeNull();
		expect(loaded?.sentences[0].lang).toBe('en');
		expect(loaded?.sentences[0].tokens[0].text).toBe('hi');
	});

	test('returns null when nothing is stored', async () => {
		expect(await loadDoc()).toBeNull();
	});

	test('tolerates a legacy {sentences, equivalency} blob without schemaVersion', async () => {
		g.localStorage!.setItem('word-order:state', JSON.stringify({ sentences: [['en', ['a', 'b']]], equivalency: [] }));
		const loaded = await loadDoc();
		expect(loaded?.schemaVersion).toBe(1);
		expect(loaded?.sentences[0].lang).toBe('en');
		expect(loaded?.sentences[0].tokens.length).toBeGreaterThan(0);
	});

	test('ignores corrupt JSON', async () => {
		g.localStorage!.setItem('word-order:state', '{not json');
		expect(await loadDoc()).toBeNull();
	});
});
