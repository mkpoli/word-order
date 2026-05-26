import { expect, test, describe } from 'bun:test';
import { applyPreviewColors, type DragPreview } from './equivalency-preview';

describe('applyPreviewColors', () => {
	const palette = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'];

	test('null preview returns the original array', () => {
		expect(applyPreviewColors(palette, null)).toBe(palette);
	});

	test('from === to is a no-op', () => {
		expect(applyPreviewColors(palette, { from: 3, to: 3 })).toBe(palette);
	});

	test('out-of-range from is a no-op', () => {
		expect(applyPreviewColors(palette, { from: -1, to: 2 })).toBe(palette);
		expect(applyPreviewColors(palette, { from: 99, to: 2 })).toBe(palette);
	});

	test('moving from > to shifts intermediate rows down by one slot', () => {
		// Drag entry from slot 5 to slot 2.
		// New entry-order: [E0, E1, E5, E2, E3, E4]
		// Each entry's NEW positional colour (= original colours indexed by new pos):
		//   E0 → c0 (still slot 0)
		//   E1 → c1 (still slot 1)
		//   E2 → c3 (pushed from slot 2 → slot 3)
		//   E3 → c4 (pushed slot 3 → slot 4)
		//   E4 → c5 (pushed slot 4 → slot 5)
		//   E5 → c2 (moved slot 5 → slot 2)
		const result = applyPreviewColors(palette, { from: 5, to: 2 });
		expect(result).toEqual(['c0', 'c1', 'c3', 'c4', 'c5', 'c2']);
	});

	test('moving from < to shifts intermediate rows up by one slot', () => {
		// Drag entry from slot 1 to slot 4.
		// New entry-order: [E0, E2, E3, E4, E1, E5]
		//   E0 → c0 (slot 0)
		//   E1 → c4 (moved slot 1 → slot 4)
		//   E2 → c1 (pushed slot 2 → slot 1)
		//   E3 → c2 (slot 3 → slot 2)
		//   E4 → c3 (slot 4 → slot 3)
		//   E5 → c5 (slot 5)
		const result = applyPreviewColors(palette, { from: 1, to: 4 });
		expect(result).toEqual(['c0', 'c4', 'c1', 'c2', 'c3', 'c5']);
	});

	test('moving the first slot to the last reverses just one position', () => {
		const small = ['a', 'b', 'c'];
		// from=0, to=2 → [b, c, a]
		expect(applyPreviewColors(small, { from: 0, to: 2 })).toEqual(['c', 'a', 'b']);
		// Wait: indexed by logical entry, "what colour does Eᵢ take?"
		//   E0 (originally at 0): new pos = 2 → c (= original colours[2])
		//   E1 (orig 1): pushed to 0 → a
		//   E2 (orig 2): pushed to 1 → b
		// Returned by `applyPreviewColors` in logical-index order: [c, a, b] ✓
	});

	test('adjacent swap (from=2, to=3) only affects the two slots', () => {
		const result = applyPreviewColors(palette, { from: 2, to: 3 });
		// E2 → c3, E3 → c2, others unchanged
		expect(result).toEqual(['c0', 'c1', 'c3', 'c2', 'c4', 'c5']);
	});

	test('works for arbitrary value types, not just strings', () => {
		const nums = [10, 20, 30, 40];
		expect(applyPreviewColors(nums, { from: 0, to: 3 })).toEqual([40, 10, 20, 30]);
	});

	test('preview type checks: DragPreview shape', () => {
		// Compile-time only — the assignment fails if the type drifts.
		const preview: DragPreview = { from: 1, to: 2 };
		expect(preview.from).toBe(1);
	});
});
