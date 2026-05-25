import Color from 'colorjs.io';

function* generateEvenlySpacedNumbers(start: number, end: number, n: number, scramble = false): Generator<number> {
	if (n <= 0) return;
	if (n === 1) {
		yield start;
		return;
	}

	const distance = end - start;
	const step = scramble ? (distance / n) * ((n >>> 1) - +((n & 1) === 0) - +((n & 3) === 2)) : distance / n;

	for (let i = 0; i < n; i++) {
		yield ((((start + i * step - start) % distance) + distance) % distance) + start;
	}
}

type OklchTuple = [l: number, c: number, h: number];

/**
 * Named palettes the user can pick from. Each one parameterises the OKLCH
 * generation differently, so existing diagrams just re-color themselves
 * when the palette changes — no schema migration.
 *
 * - `spectrum`  — original wide-gamut rainbow (L=0.6, C=0.25, evenly hue-spaced)
 * - `pastel`    — softer, lower-chroma version of the spectrum
 * - `vivid`     — punched-up chroma; useful for projection / dense diagrams
 * - `warm`      — yellow → red → magenta range
 * - `cool`      — green → blue → violet range
 * - `mono-blue` — single-hue blue ladder varying lightness
 * - `mono-warm` — single-hue warm ladder varying lightness
 */
export type PaletteId = 'spectrum' | 'pastel' | 'vivid' | 'warm' | 'cool' | 'mono-blue' | 'mono-warm';

export const PALETTES: { id: PaletteId; label: string }[] = [
	{ id: 'spectrum', label: 'Full spectrum' },
	{ id: 'pastel', label: 'Pastel' },
	{ id: 'vivid', label: 'Vivid' },
	{ id: 'warm', label: 'Warm' },
	{ id: 'cool', label: 'Cool' },
	{ id: 'mono-blue', label: 'Mono · blue' },
	{ id: 'mono-warm', label: 'Mono · warm' }
];

export const DEFAULT_PALETTE: PaletteId = 'spectrum';

type PaletteSpec = {
	lightness: number;
	chroma: number;
	hueRange: [number, number];
	/** Mono palettes set this; the per-row lightness sweeps across the range while hue stays nearly constant. */
	lightnessRange?: [number, number];
};

const SPECS: Record<PaletteId, PaletteSpec> = {
	spectrum: { lightness: 0.6, chroma: 0.25, hueRange: [0, 360] },
	pastel: { lightness: 0.78, chroma: 0.1, hueRange: [0, 360] },
	vivid: { lightness: 0.55, chroma: 0.32, hueRange: [0, 360] },
	warm: { lightness: 0.6, chroma: 0.25, hueRange: [40, 380] }, // through red → magenta (wraps)
	cool: { lightness: 0.6, chroma: 0.25, hueRange: [140, 320] }, // green → blue → violet
	'mono-blue': { lightness: 0.6, chroma: 0.18, hueRange: [240, 250], lightnessRange: [0.35, 0.85] },
	'mono-warm': { lightness: 0.62, chroma: 0.18, hueRange: [25, 40], lightnessRange: [0.4, 0.88] }
};

export function pickNColors(n: number, scramble = true, palette: PaletteId = DEFAULT_PALETTE): OklchTuple[] {
	const spec = SPECS[palette] ?? SPECS[DEFAULT_PALETTE];

	// Mono palettes vary lightness so adjacent rows stay distinguishable even
	// though hues are nearly identical.
	if (spec.lightnessRange) {
		const lightnesses = [...generateEvenlySpacedNumbers(spec.lightnessRange[0], spec.lightnessRange[1], n, scramble)];
		const hueSpan = spec.hueRange[1] - spec.hueRange[0];
		const hueStep = n > 1 ? hueSpan / (n - 1) : 0;
		return lightnesses.map((l, i) => [l, spec.chroma, spec.hueRange[0] + i * hueStep]);
	}

	const [hStart, hEnd] = spec.hueRange;
	return [...generateEvenlySpacedNumbers(hStart, hEnd, n, scramble)].map((degrees) => [spec.lightness, spec.chroma, degrees % 360]);
}

/** Converts an OKLCH tuple to a hex string. */
export function oklchToHex(oklch: OklchTuple): string {
	return new Color('oklch', oklch).to('srgb').toString({ format: 'hex' });
}
