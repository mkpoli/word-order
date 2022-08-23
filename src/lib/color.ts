function* generateEvenlySpacedNumbers(start: number, end: number, n: number): Generator<number> {
  const distance = end - start;
  const step = distance / (n - 1);

  for (let i = 0; i < n; i++) {
    yield start + i * step;
  }
}

type LCh = [number, number, number];

export function pickNColors(n: number): LCh[] {
  return [...generateEvenlySpacedNumbers(0, 360, n + 1)].map(degrees => [40, 100, degrees]).slice(0, -1) as LCh[];
}