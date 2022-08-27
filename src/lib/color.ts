import * as d3 from 'd3-color';

function* generateEvenlySpacedNumbers(start: number, end: number, n: number): Generator<number> {
  const distance = end - start;
  const step = distance / (n - 1);

  for (let i = 0; i < n; i++) {
    yield start + i * step;
  }
}

type LCh = [l: number, c: number, h: number];

export function pickNColors(n: number): LCh[] {
  return [...generateEvenlySpacedNumbers(0, 360, n + 1)].map(degrees => [40, 100, degrees]).slice(0, -1) as LCh[];
}

export function lch2rgb(lch: LCh): string {
  const [l, c, h] = lch
  return d3.lch(l, c, h).formatRgb();
}