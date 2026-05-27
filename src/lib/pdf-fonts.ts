/**
 * On-demand font embedding for vector PDF export.
 *
 * Problem: jsPDF only ships the 14 standard PDF fonts (Helvetica / Times /
 * Courier variants), none of which cover non-Latin scripts. svg2pdf has no
 * way to read @font-face from the input SVG, so the previous PDF path
 * produced mojibake for any CJK / Cyrillic / Greek / Arabic / etc. text.
 *
 * Approach: at export time, walk the SVG's `<text>` elements, detect the
 * dominant script of each run, fetch a subsetted Google Fonts woff2 for the
 * matching Noto variant (using the `?text=` query param so we only pull the
 * glyphs we actually need), decode woff2 → TTF in the browser via wawoff2,
 * and register each subset with the jsPDF instance via `addFileToVFS` +
 * `addFont`. We also rewrite each `<text>` element's `font-family` to the
 * specific Noto variant for its script so svg2pdf binds to the registered
 * font directly instead of trying to walk the CSS fallback stack.
 *
 * The whole pipeline is keyed to the same Noto families the preview already
 * uses (declared in `src/app.html`), so the exported PDF's vector outlines
 * are literally identical to what's on screen.
 */
import type { jsPDF } from 'jspdf';

export type FontKind = 'sans' | 'serif' | 'mono';
export type FontScript = 'latin' | 'sc' | 'jp' | 'kr';

const NOTO_NAME: Record<FontKind, Record<FontScript, string>> = {
	sans: { latin: 'Noto Sans', sc: 'Noto Sans SC', jp: 'Noto Sans JP', kr: 'Noto Sans KR' },
	serif: { latin: 'Noto Serif', sc: 'Noto Serif SC', jp: 'Noto Serif JP', kr: 'Noto Serif KR' },
	// Noto Sans Mono is Latin-only; CJK runs fall back to the proportional
	// Noto Sans variants of the same script (there's no Noto Sans Mono CJK).
	mono: { latin: 'Noto Sans Mono', sc: 'Noto Sans SC', jp: 'Noto Sans JP', kr: 'Noto Sans KR' }
};

/** Map a single character to the Noto sub-family that covers it. */
function detectScript(ch: string): FontScript {
	const cp = ch.codePointAt(0);
	if (cp === undefined) return 'latin';
	// Hangul Syllables / Jamo
	if ((cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0x1100 && cp <= 0x11ff) || (cp >= 0x3130 && cp <= 0x318f)) return 'kr';
	// Hiragana + Katakana (Japanese-only)
	if (cp >= 0x3040 && cp <= 0x30ff) return 'jp';
	// CJK Unified Ideographs / Extensions / Compatibility — default to SC.
	// Without per-text language hints we can't distinguish JP-style vs SC-style
	// kanji, so SC is the broadest fallback (Noto Sans SC covers most CJK).
	if ((cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0x20000 && cp <= 0x2ebef)) {
		return 'sc';
	}
	// CJK Symbols and Punctuation — route through SC alongside the ideographs.
	if (cp >= 0x3000 && cp <= 0x303f) return 'sc';
	return 'latin';
}

/** Pick the dominant script for a string. Non-latin scripts win ties so a
 *  single Latin punctuation char in a CJK run doesn't pull the whole run
 *  back to Latin. */
function dominantScript(text: string): FontScript {
	const counts: Record<FontScript, number> = { latin: 0, sc: 0, jp: 0, kr: 0 };
	for (const ch of text) counts[detectScript(ch)]++;
	// Preference order when counts tie: non-latin scripts first so mixed runs
	// (e.g. CJK punctuation + ideographs) end up on a CJK font.
	let best: FontScript = 'latin';
	for (const s of ['kr', 'jp', 'sc', 'latin'] as const) {
		if (counts[s] > counts[best]) best = s;
	}
	return best;
}

/** Classify a CSS font-family stack into sans/serif/mono. */
function detectKind(stack: string): FontKind {
	const s = stack.toLowerCase();
	if (s.includes('mono') || s.includes('courier')) return 'mono';
	if (s.includes('serif') && !s.includes('sans-serif') && !s.includes('sans serif')) return 'serif';
	return 'sans';
}

interface FontEntry {
	family: string;
	weight: number;
	chars: Set<string>;
}

/** Module-level cache of decoded TTF bytes keyed by (family, weight, char-set).
 *  Survives across exports so consecutive PDF exports of the same diagram
 *  don't re-fetch the same subset. */
const ttfCache = new Map<string, ArrayBuffer>();

/**
 * Walk the SVG, group text by required (family, weight) subset, fetch +
 * decode + register them with the jsPDF instance, and rewrite each `<text>`
 * element's `font-family` to point at the registered name.
 *
 * No-op for pure-ASCII diagrams whose default Helvetica covers everything —
 * but we run the registration anyway so the exported text uses Noto for
 * visual parity with the preview.
 */
export async function registerSvgFonts(svg: SVGSVGElement, pdf: jsPDF): Promise<void> {
	const required = new Map<string, FontEntry>();

	const texts = svg.querySelectorAll('text');
	for (const t of Array.from(texts)) {
		const text = t.textContent ?? '';
		if (!text) continue;

		const stack = t.getAttribute('font-family') || '';
		const kind = detectKind(stack);
		const weightAttr = t.getAttribute('font-weight') || '400';
		const weight = /bold/i.test(weightAttr) || Number(weightAttr) >= 600 ? 700 : 400;

		const script = dominantScript(text);
		const family = NOTO_NAME[kind][script];

		const key = `${family}@${weight}`;
		let entry = required.get(key);
		if (!entry) {
			entry = { family, weight, chars: new Set() };
			required.set(key, entry);
		}
		for (const ch of text) entry.chars.add(ch);

		// svg2pdf walks comma-separated font-family looking for a registered
		// match. Rewriting it here means we don't have to register Noto under
		// the user's full CSS stack name (which includes commas + fallbacks).
		t.setAttribute('font-family', family);
	}

	if (required.size === 0) return;

	await Promise.all(
		Array.from(required.values()).map(async (entry) => {
			const charset = Array.from(entry.chars).sort().join('');
			const cacheKey = `${entry.family}@${entry.weight}:${charset}`;
			let ttf = ttfCache.get(cacheKey);
			if (!ttf) {
				ttf = await fetchAndDecode(entry.family, entry.weight, charset);
				ttfCache.set(cacheKey, ttf);
			}
			const base64 = arrayBufferToBase64(ttf);
			// jsPDF identifies registered fonts by (postScriptName -> file,
			// fontName -> displayed family). We use the same name for both —
			// svg2pdf looks up by fontName.
			const filename = `${entry.family.replace(/\s+/g, '')}-${entry.weight}.ttf`;
			pdf.addFileToVFS(filename, base64);
			pdf.addFont(filename, entry.family, 'normal', entry.weight === 700 ? 'bold' : 'normal');
		})
	);
}

async function fetchAndDecode(family: string, weight: number, charset: string): Promise<ArrayBuffer> {
	// Google Fonts CSS API: `text=` returns a single woff2 subsetted to
	// exactly the requested characters (works for Latin + CJK alike).
	const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(charset)}&display=swap`;
	const cssRes = await fetch(url);
	if (!cssRes.ok) throw new Error(`Font CSS fetch failed for ${family}@${weight}: HTTP ${cssRes.status}`);
	const css = await cssRes.text();
	const match = css.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
	if (!match) throw new Error(`No woff2 URL found in CSS response for ${family}@${weight}`);
	const woff2Res = await fetch(match[1]);
	if (!woff2Res.ok) throw new Error(`woff2 fetch failed for ${family}@${weight}: HTTP ${woff2Res.status}`);
	const woff2Bytes = new Uint8Array(await woff2Res.arrayBuffer());
	const { decompress } = await import('wawoff2');
	const ttfBytes = await decompress(woff2Bytes);
	const u8 = ttfBytes instanceof Uint8Array ? ttfBytes : new Uint8Array(ttfBytes);
	// Copy into a fresh ArrayBuffer so the return type stays narrow regardless
	// of whether the underlying buffer is SharedArrayBuffer-backed.
	const buf = new ArrayBuffer(u8.byteLength);
	new Uint8Array(buf).set(u8);
	return buf;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	let s = '';
	const CHUNK = 0x8000;
	for (let i = 0; i < bytes.length; i += CHUNK) {
		s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
	}
	return btoa(s);
}
