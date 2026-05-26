import { expect, test, describe } from 'bun:test';
import { pickNColors, oklchToHex, PALETTES, DEFAULT_PALETTE, type PaletteId } from './color';

describe('pickNColors', () => {
	test('n=0 returns an empty array', () => {
		expect(pickNColors(0)).toEqual([]);
	});

	test('n=1 returns one tuple', () => {
		const result = pickNColors(1);
		expect(result).toHaveLength(1);
		expect(result[0]).toHaveLength(3); // [L, C, H]
	});

	test('returns exactly n tuples', () => {
		for (const n of [2, 5, 10, 20]) {
			expect(pickNColors(n)).toHaveLength(n);
		}
	});

	test('every palette ID produces tuples in OKLCH range', () => {
		for (const { id } of PALETTES) {
			const result = pickNColors(5, false, id);
			for (const [L, C, H] of result) {
				expect(L).toBeGreaterThanOrEqual(0);
				expect(L).toBeLessThanOrEqual(1);
				expect(C).toBeGreaterThanOrEqual(0);
				expect(C).toBeLessThanOrEqual(0.4); // OKLCH chroma in practice
				expect(H).toBeGreaterThanOrEqual(0);
				expect(H).toBeLessThan(360);
			}
		}
	});

	test('mono palettes vary lightness across the range', () => {
		const result = pickNColors(5, false, 'mono-blue');
		const lightnesses = result.map(([L]) => L);
		const min = Math.min(...lightnesses);
		const max = Math.max(...lightnesses);
		expect(max - min).toBeGreaterThan(0.3); // mono-blue spec: [0.35, 0.85]
	});

	test('mono palettes keep hue nearly constant', () => {
		const result = pickNColors(5, false, 'mono-blue');
		const hues = result.map(([, , H]) => H);
		const min = Math.min(...hues);
		const max = Math.max(...hues);
		expect(max - min).toBeLessThan(15); // spec: hueRange [240, 250]
	});

	test('non-scrambled hues are monotonic for spectrum', () => {
		const result = pickNColors(8, false, 'spectrum');
		const hues = result.map(([, , H]) => H);
		for (let i = 1; i < hues.length; i++) {
			expect(hues[i]).toBeGreaterThan(hues[i - 1]);
		}
	});

	test('unknown palette falls back to default', () => {
		const bogus = pickNColors(3, false, 'not-a-real-palette' as PaletteId);
		const def = pickNColors(3, false, DEFAULT_PALETTE);
		expect(bogus).toEqual(def);
	});
});

describe('oklchToHex', () => {
	test('returns a #rrggbb string', () => {
		const hex = oklchToHex([0.5, 0.1, 200]);
		expect(hex).toMatch(/^#[0-9a-f]{3,6}$/i);
	});

	test('black and white round-trip into the expected hex range', () => {
		const black = oklchToHex([0, 0, 0]);
		const white = oklchToHex([1, 0, 0]);
		expect(black.toLowerCase()).toBe('#000');
		// White at L=1 with C=0 should be near pure white
		expect(white.toLowerCase()).toMatch(/^#f/);
	});

	test('pickNColors output feeds straight into oklchToHex', () => {
		const colors = pickNColors(5, false, 'spectrum');
		for (const oklch of colors) {
			const hex = oklchToHex(oklch);
			expect(hex).toMatch(/^#[0-9a-f]{3,6}$/i);
		}
	});
});

describe('PALETTES metadata', () => {
	test('every palette id has a label', () => {
		for (const p of PALETTES) {
			expect(p.id).toBeTruthy();
			expect(p.label).toBeTruthy();
		}
	});

	test('DEFAULT_PALETTE is one of the listed palette ids', () => {
		expect(PALETTES.map((p) => p.id)).toContain(DEFAULT_PALETTE);
	});
});
