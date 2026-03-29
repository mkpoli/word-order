import Color from 'colorjs.io';

function* generateEvenlySpacedNumbers(start: number, end: number, n: number, scramble: boolean = false): Generator<number> {
	const distance = end - start;
	let step: number;
	if (scramble) {
		const coprimeN = (n >>> 1) - +((n & 1) === 0) - +((n & 3) === 2);
		step = (distance / n) * coprimeN;
	} else {
		step = distance / (n - 1);
	}

	for (let i = 0; i < n; i++) {
		yield start + i * step;
	}
}

type LCh = [l: number, c: number, h: number];

export function pickNColors(n: number, scramble: boolean = true): LCh[] {
	return [...generateEvenlySpacedNumbers(0, 360, n, scramble)].map((degrees) => [0.6, 0.25, degrees]);
}

export function lch2rgb(lch: LCh): string {
	return new Color('oklch', lch).to('srgb').toString({ format: 'hex' });
}
