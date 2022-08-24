export function segmentate(arr: number[]): number[][] {
  const array = [...new Set(arr)].sort((a, b) => a - b);
  const result: number[][] = [];

  let segment: [start: number, end: number] = [array[0], array[0]];
  for (let i = 0; i <= array.length - 1; i++) {
    const [curr, next] = [array[i], array[i + 1]];

    if (curr + 1 === next) {
      segment = [segment[0], next];
    } else {
      result.push(segment);
      segment = [next, next];
    }
  }
  return result;
}

export function cartesian<T>(...arrays: T[][]): T[][] {
  const result: T[][] = [];
  const length = arrays.length;
  const product = arrays.reduce((a, b) => a * b.length, 1);
  for (let i = 0; i < product; i++) {
    const row = [];
    for (let j = 0; j < length; j++) {
      row.push(arrays[j][i % arrays[j].length]);
    }
    result.push(row);
  }
  return result;
}