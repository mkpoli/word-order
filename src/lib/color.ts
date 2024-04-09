import Color from 'colorjs.io';

function* generateEvenlySpacedNumbers(start: number, end: number, n: number): Generator<number> {
	const distance = end - start;
	const coprimeN = (n >>> 1) - +((n & 1) === 0) - +((n & 3) === 2);
	const step = (distance / n) * coprimeN;

	for (let i = 0; i < n; i++) {
		yield start + i * step;
	}
}

type LCh = [l: number, c: number, h: number];

export function pickNColors(n: number): LCh[] {
	return [...generateEvenlySpacedNumbers(0, 360, n)].map((degrees) => [0.6, 0.25, degrees]);
}

export function lch2rgb(lch: LCh): string {
	return new Color('oklch', lch).to('srgb') + '';
}
