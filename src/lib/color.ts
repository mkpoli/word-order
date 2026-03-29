import Color from 'colorjs.io';

function* generateEvenlySpacedNumbers(start: number, end: number, n: number, scramble = false): Generator<number> {
	if (n <= 0) return;
	if (n === 1) {
		yield start;
		return;
	}

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

type OklchTuple = [l: number, c: number, h: number];

export function pickNColors(n: number, scramble = true): OklchTuple[] {
	return [...generateEvenlySpacedNumbers(0, 360, n, scramble)].map((degrees) => [0.6, 0.25, degrees]);
}

/**
 * Converts an OKLCH tuple to a hex string.
 */
export function oklchToHex(oklch: OklchTuple): string {
	return new Color('oklch', oklch).to('srgb').toString({ format: 'hex' });
}
