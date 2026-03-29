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

export function pickNColors(n: number, scramble = true): OklchTuple[] {
	return [...generateEvenlySpacedNumbers(0, 360, n, scramble)].map((degrees) => [0.6, 0.25, degrees]);
}

/**
 * Converts an OKLCH tuple to a hex string.
 */
export function oklchToHex(oklch: OklchTuple): string {
	return new Color('oklch', oklch).to('srgb').toString({ format: 'hex' });
}
