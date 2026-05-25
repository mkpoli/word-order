/**
 * Encode/decode the current document into a URL hash fragment so links can
 * carry the diagram across browsers without a backend.
 *
 * Format:
 *   #d=c.<base64url(deflate-raw(JSON.stringify(doc)))>   // compressed
 *   #d=u.<base64url(JSON.stringify(doc))>                // fallback (no CompressionStream)
 *
 * - JSON shape: `{ schemaVersion: 1, sentences, equivalency }` (same as the
 *   JSON export and the localStorage doc).
 * - Compression via the native `CompressionStream` API — no new dependency.
 * - base64url-encoded (URL-safe, no padding) so the hash can be pasted into
 *   chat / shared on social without escape mangling.
 * - Decoder also accepts the older tag-less compressed format that the first
 *   draft of this feature emitted, for backwards compatibility.
 */
import type { Sentence, SentenceData } from './types';
import { normalizeSentence } from './types';

export const URL_PAYLOAD_PARAM = 'd';

/**
 * Threshold at which we flag the share URL as "long". Below this most
 * platforms (Twitter via t.co, Discord, Slack, Mastodon, email links) pass
 * URLs through cleanly; above it some link-grabbers truncate, some chat
 * clients refuse, and the browser address bar starts to look unhealthy.
 * Not a hard cap — copy still proceeds — but the UI surfaces a warning.
 */
export const URL_LONG_WARN_THRESHOLD = 4000;

/**
 * One-character tags that prefix the payload so the decoder can tell deflate
 * apart from a plain JSON fallback. Compressed is the default and emitted by
 * modern browsers; plain is the fallback for browsers without
 * CompressionStream (Safari < 16.4, very old FF/Chrome).
 */
const TAG_COMPRESSED = 'c';
const TAG_PLAIN = 'u';

export type ShareableDoc = {
	schemaVersion: 1;
	sentences: Sentence[];
	equivalency: number[][][];
};

const SCHEMA_VERSION = 1 as const;

function hasCompressionStream(): boolean {
	return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

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

	if (hasCompressionStream()) {
		const compressed = await streamThrough(utf8, new CompressionStream('deflate-raw'));
		return `${TAG_COMPRESSED}.${base64UrlEncode(compressed)}`;
	}

	// Fallback for browsers without CompressionStream (Safari < 16.4, etc.).
	// Larger URL but still functional.
	return `${TAG_PLAIN}.${base64UrlEncode(utf8)}`;
}

function parseDoc(json: string): ShareableDoc | null {
	try {
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

export async function decodeDocFromUrl(payload: string): Promise<ShareableDoc | null> {
	try {
		if (payload.startsWith(`${TAG_PLAIN}.`)) {
			const bytes = base64UrlDecode(payload.slice(2));
			return parseDoc(new TextDecoder().decode(bytes));
		}
		// Tagged-compressed or older tag-less compressed payload.
		const body = payload.startsWith(`${TAG_COMPRESSED}.`) ? payload.slice(2) : payload;
		const bytes = base64UrlDecode(body);
		if (!hasCompressionStream()) {
			// No way to decompress on this browser. Last-ditch: try as plain
			// JSON in case it happens to be uncompressed.
			return parseDoc(new TextDecoder().decode(bytes));
		}
		const decompressed = await streamThrough(bytes, new DecompressionStream('deflate-raw'));
		return parseDoc(new TextDecoder().decode(decompressed));
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

/** True when the share URL is large enough that some platforms may not handle it cleanly. */
export function isShareUrlLong(url: string): boolean {
	return url.length > URL_LONG_WARN_THRESHOLD;
}
