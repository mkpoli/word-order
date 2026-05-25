/**
 * Encode/decode the current document into a URL hash fragment so links can
 * carry the diagram across browsers without a backend.
 *
 * Format:
 *   #d=<base64url(deflate-raw(JSON.stringify(doc)))>
 *
 * - JSON shape: `{ schemaVersion: 1, sentences, equivalency }` (same as the
 *   JSON export and the localStorage doc).
 * - Compression via the native `CompressionStream` API — no new dependency.
 * - base64url-encoded (URL-safe, no padding) so the hash can be pasted into
 *   chat / shared on social without escape mangling.
 */
import type { Sentence, SentenceData } from './types';
import { normalizeSentence } from './types';

export const URL_PAYLOAD_PARAM = 'd';

export type ShareableDoc = {
	schemaVersion: 1;
	sentences: Sentence[];
	equivalency: number[][][];
};

const SCHEMA_VERSION = 1 as const;

function base64UrlEncode(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): Uint8Array {
	const norm = s.replace(/-/g, '+').replace(/_/g, '/');
	const pad = norm.length % 4 === 0 ? '' : '='.repeat(4 - (norm.length % 4));
	const bin = atob(norm + pad);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

async function streamThrough(input: Uint8Array, transform: CompressionStream | DecompressionStream): Promise<Uint8Array> {
	const writer = transform.writable.getWriter();
	// Cast: CompressionStream's writable accepts BufferSource; TS 6's stricter
	// generics treat Uint8Array<ArrayBufferLike> as not assignable.
	void writer.write(input as unknown as BufferSource).then(() => writer.close());
	const reader = transform.readable.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		chunks.push(value);
		total += value.length;
	}
	const out = new Uint8Array(total);
	let offset = 0;
	for (const c of chunks) {
		out.set(c, offset);
		offset += c.length;
	}
	return out;
}

export async function encodeDocForUrl(doc: ShareableDoc): Promise<string> {
	const json = JSON.stringify(doc);
	const utf8 = new TextEncoder().encode(json);
	const compressed = await streamThrough(utf8, new CompressionStream('deflate-raw'));
	return base64UrlEncode(compressed);
}

export async function decodeDocFromUrl(payload: string): Promise<ShareableDoc | null> {
	try {
		const bytes = base64UrlDecode(payload);
		const decompressed = await streamThrough(bytes, new DecompressionStream('deflate-raw'));
		const json = new TextDecoder().decode(decompressed);
		const parsed = JSON.parse(json) as unknown;
		if (!parsed || typeof parsed !== 'object') return null;
		const p = parsed as Partial<ShareableDoc> & { sentences?: unknown; equivalency?: unknown };
		if (p.schemaVersion !== SCHEMA_VERSION) return null;
		if (!Array.isArray(p.sentences) || !Array.isArray(p.equivalency)) return null;
		return {
			schemaVersion: SCHEMA_VERSION,
			sentences: (p.sentences as SentenceData[]).map(normalizeSentence),
			equivalency: p.equivalency as number[][][]
		};
	} catch {
		return null;
	}
}

/** Read the payload out of `window.location.hash` (or `?d=…` for completeness). */
export function readPayloadFromUrl(): string | null {
	if (typeof window === 'undefined') return null;
	const hash = window.location.hash.replace(/^#/, '');
	if (hash.startsWith(`${URL_PAYLOAD_PARAM}=`)) return hash.slice(URL_PAYLOAD_PARAM.length + 1);
	const search = new URLSearchParams(window.location.search);
	const fromQuery = search.get(URL_PAYLOAD_PARAM);
	return fromQuery || null;
}

/** Build a full shareable URL containing the doc. */
export async function buildShareUrl(origin: string, doc: ShareableDoc): Promise<string> {
	const payload = await encodeDocForUrl(doc);
	return `${origin}/#${URL_PAYLOAD_PARAM}=${payload}`;
}
