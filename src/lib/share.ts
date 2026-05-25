/**
 * Encode/decode the current document into a URL hash fragment so links can
 * carry the diagram across browsers without a backend.
 *
 * Wire formats (tag-prefixed so the decoder can tell them apart):
 *   #d=t.<base64url(deflate-raw(tuple-JSON))>   ← default, smallest
 *   #d=c.<base64url(deflate-raw(JSON))>         ← previous default, still read
 *   #d=u.<base64url(JSON | tuple-JSON))>        ← fallback (no CompressionStream)
 *
 * The tuple form drops object keys and represents each token compactly
 * (a plain string when no annotations, otherwise a 3-tuple). On the
 * 4-sentence default doc that shaves ~35–40% off the URL length versus
 * the JSON form, because the structural overhead from repeated keys
 * (`"text"`, `"annotationsAbove"`, …) was a sizeable fraction of the
 * post-deflate payload.
 *
 * All three encodings carry the same `{schemaVersion: 1, sentences,
 * equivalency}` payload — schemaVersion stays at 1 because the data shape
 * didn't change, only the wire format.
 */
import type { Sentence, SentenceData, SentenceToken } from './types';
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

const TAG_TUPLE = 't';
const TAG_COMPRESSED = 'c';
const TAG_PLAIN = 'u';

export type ShareableDoc = {
	schemaVersion: 1;
	sentences: Sentence[];
	equivalency: number[][][];
};

const SCHEMA_VERSION = 1 as const;

/* -------------------------------------------------------------------------- */
/* Tuple wire format                                                          */
/* -------------------------------------------------------------------------- */

type SentenceOptsT =
	| [lanesAbove: number, lanesBelow: number, showGloss: 0 | 1]
	| [lanesAbove: number, lanesBelow: number, showGloss: 0 | 1, displayName: string];
type TokenT = string | [text: string, above: string[], below: string[]];
/** Opts is omitted when it would be `[0, 0, 0]` (the default — no annotation lanes) and no displayName override is set. */
type SentenceT = [lang: string, tokens: TokenT[]] | [lang: string, tokens: TokenT[], opts: SentenceOptsT];
type DocT = [schemaVersion: 1, sentences: SentenceT[], equivalency: number[][][]];

function tokenToTuple(token: SentenceToken): TokenT {
	const anyAbove = token.annotationsAbove.some(Boolean);
	const anyBelow = token.annotationsBelow.some(Boolean);
	if (!anyAbove && !anyBelow) return token.text;
	return [token.text, token.annotationsAbove, token.annotationsBelow];
}

function tupleToToken(t: TokenT, lanesAbove: number, lanesBelow: number): SentenceToken {
	if (typeof t === 'string') {
		return {
			text: t,
			annotationsAbove: new Array(lanesAbove).fill(''),
			annotationsBelow: new Array(lanesBelow).fill('')
		};
	}
	const [text, above, below] = t;
	return {
		text,
		annotationsAbove: padOrTrim(above, lanesAbove),
		annotationsBelow: padOrTrim(below, lanesBelow)
	};
}

function padOrTrim(arr: string[], len: number): string[] {
	if (arr.length === len) return arr;
	const out = new Array(len).fill('');
	for (let i = 0; i < Math.min(arr.length, len); i++) out[i] = arr[i] ?? '';
	return out;
}

function docToTuple(doc: ShareableDoc): DocT {
	const sentences: SentenceT[] = doc.sentences.map((s) => {
		const tokens = s.tokens.map(tokenToTuple);
		// Elide the opts triple when it equals the default [0, 0, 0] and there's
		// no displayName override. The common "plain row, no annotation lanes"
		// case ends up as a 2-tuple `[lang, tokens]` — saves ~6 bytes per
		// sentence in the JSON form, plus fewer key-less zeros to deflate.
		if (s.lanesAbove === 0 && s.lanesBelow === 0 && !s.showGloss && !s.displayName) return [s.lang, tokens];
		const showG: 0 | 1 = s.showGloss ? 1 : 0;
		return s.displayName
			? [s.lang, tokens, [s.lanesAbove, s.lanesBelow, showG, s.displayName]]
			: [s.lang, tokens, [s.lanesAbove, s.lanesBelow, showG]];
	});
	return [SCHEMA_VERSION, sentences, doc.equivalency];
}

function tupleToDoc(t: unknown): ShareableDoc | null {
	if (!Array.isArray(t) || t.length < 3) return null;
	const [v, sentencesRaw, equiv] = t as [unknown, unknown, unknown];
	if (v !== SCHEMA_VERSION) return null;
	if (!Array.isArray(sentencesRaw) || !Array.isArray(equiv)) return null;
	const sentences: Sentence[] = [];
	for (const s of sentencesRaw) {
		if (!Array.isArray(s) || s.length < 2) return null;
		const [lang, tokensRaw] = s as [unknown, unknown];
		if (typeof lang !== 'string' || !Array.isArray(tokensRaw)) return null;
		// Opts is optional — when absent, default to [0, 0, 0].
		let lanesAbove = 0;
		let lanesBelow = 0;
		let showG: 0 | 1 = 0;
		let displayName: string | undefined;
		if (s.length >= 3) {
			const opts = s[2];
			if (!Array.isArray(opts) || opts.length < 3) return null;
			[lanesAbove, lanesBelow, showG] = opts as [number, number, 0 | 1];
			if (opts.length >= 4 && typeof opts[3] === 'string' && opts[3]) displayName = opts[3];
		}
		const tokens = (tokensRaw as TokenT[]).map((tk) => tupleToToken(tk, lanesAbove, lanesBelow));
		sentences.push({
			lang,
			tokens,
			lanesAbove,
			lanesBelow,
			showGloss: Boolean(showG),
			...(displayName ? { displayName } : {})
		});
	}
	return { schemaVersion: SCHEMA_VERSION, sentences, equivalency: equiv as number[][][] };
}

/* -------------------------------------------------------------------------- */
/* Transport: deflate-raw + base64url                                         */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Encode / decode                                                            */
/* -------------------------------------------------------------------------- */

export async function encodeDocForUrl(doc: ShareableDoc): Promise<string> {
	const tupleJson = JSON.stringify(docToTuple(doc));
	const utf8 = new TextEncoder().encode(tupleJson);

	if (hasCompressionStream()) {
		const compressed = await streamThrough(utf8, new CompressionStream('deflate-raw'));
		return `${TAG_TUPLE}.${base64UrlEncode(compressed)}`;
	}

	// Fallback for browsers without CompressionStream (Safari < 16.4, etc.).
	// The plain tag still carries the tuple form (just uncompressed); decoder
	// detects whether the body is a tuple array or a {schemaVersion,…} object.
	return `${TAG_PLAIN}.${base64UrlEncode(utf8)}`;
}

function parseJsonDoc(json: string): ShareableDoc | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return null;
	}
	if (Array.isArray(parsed)) return tupleToDoc(parsed);
	if (parsed && typeof parsed === 'object') {
		const p = parsed as Partial<ShareableDoc> & { sentences?: unknown; equivalency?: unknown };
		if (p.schemaVersion !== SCHEMA_VERSION) return null;
		if (!Array.isArray(p.sentences) || !Array.isArray(p.equivalency)) return null;
		return {
			schemaVersion: SCHEMA_VERSION,
			sentences: (p.sentences as SentenceData[]).map(normalizeSentence),
			equivalency: p.equivalency as number[][][]
		};
	}
	return null;
}

export async function decodeDocFromUrl(payload: string): Promise<ShareableDoc | null> {
	try {
		// `u.…` — uncompressed; body is straight base64url(JSON | tuple-JSON).
		if (payload.startsWith(`${TAG_PLAIN}.`)) {
			const bytes = base64UrlDecode(payload.slice(2));
			return parseJsonDoc(new TextDecoder().decode(bytes));
		}

		// `t.…` / `c.…` / untagged — all need deflate.
		const tagless = payload.startsWith(`${TAG_TUPLE}.`) || payload.startsWith(`${TAG_COMPRESSED}.`) ? payload.slice(2) : payload;
		const bytes = base64UrlDecode(tagless);
		if (!hasCompressionStream()) {
			// No way to decompress on this browser. Last-ditch: assume the
			// payload happens to be plain JSON.
			return parseJsonDoc(new TextDecoder().decode(bytes));
		}
		const decompressed = await streamThrough(bytes, new DecompressionStream('deflate-raw'));
		return parseJsonDoc(new TextDecoder().decode(decompressed));
	} catch {
		return null;
	}
}

/* -------------------------------------------------------------------------- */
/* URL helpers                                                                */
/* -------------------------------------------------------------------------- */

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
