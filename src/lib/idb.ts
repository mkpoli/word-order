/**
 * Minimal promise wrapper around a single IndexedDB key-value store.
 *
 * The app's document used to live in localStorage, which caps at ~5 MB —
 * a large multi-sentence illustration with many annotation lanes can hit
 * that wall (#57). IndexedDB has no practical size limit and stores
 * structured-clonable objects directly (no JSON round-trip), so the doc
 * lives here now with localStorage kept only as a migration source and a
 * small-doc fallback.
 *
 * Deliberately dependency-free and tiny — one DB, one object store, get/set.
 */
const DB_NAME = 'word-order';
const STORE = 'kv';
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function idbAvailable(): boolean {
	return typeof indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;
	dbPromise = new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, VERSION);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
	// If opening fails, clear the cached rejected promise so a later call can retry.
	dbPromise.catch(() => {
		dbPromise = null;
	});
	return dbPromise;
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
	const db = await openDB();
	return new Promise<T | undefined>((resolve, reject) => {
		const tx = db.transaction(STORE, 'readonly');
		const req = tx.objectStore(STORE).get(key);
		req.onsuccess = () => resolve(req.result as T | undefined);
		req.onerror = () => reject(req.error);
	});
}

export async function idbSet(key: string, value: unknown): Promise<void> {
	const db = await openDB();
	return new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).put(value, key);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}

export async function idbDelete(key: string): Promise<void> {
	const db = await openDB();
	return new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).delete(key);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
