import { describe, expect, it } from 'bun:test';
import { addGlossAlignments } from './gloss-align';
import { createSentence } from './types';

// addGlossAlignments buckets tokens across sentences by their normalised gloss
// key and wires them into equivalency groups: merging into an overlapping group,
// else a label/surface-matching group, else a brand-new group (only when the
// bucket spans >= 2 sentences). Groups are number[][][] (group -> sentence -> token ids).

describe('addGlossAlignments', () => {
	it('creates a new group for a gloss shared across two sentences', () => {
		const en = createSentence('en', ['the', 'cat', 'eats'], ['the', 'cat', 'eat']);
		const ja = createSentence('ja', ['猫', 'が', '食べる'], ['cat', 'TOP', 'eat']);
		// "cat" -> group [s0 tok1, s1 tok0]; "eat" -> group [s0 tok2, s1 tok2].
		// "the" and "TOP" appear in only one sentence, so they make no group.
		expect(addGlossAlignments([en, ja], [], [0, 1])).toEqual([
			[[1], [0]],
			[[2], [2]]
		]);
	});

	it('does not create a group for a gloss confined to a single sentence', () => {
		expect(addGlossAlignments([createSentence('en', ['a'], ['x'])], [], [0])).toEqual([]);
	});

	it('buckets tokens by morphology-stripped gloss key (me.DAT == me.ACC == me)', () => {
		const a = createSentence('en', ['me'], ['me.DAT']);
		const b = createSentence('ja', ['私'], ['me.ACC']);
		expect(addGlossAlignments([a, b], [], [0, 1])).toEqual([[[0], [0]]]);
	});

	it('matches by surface form when the gloss equals an existing token text', () => {
		const en = createSentence('en', ['glass'], ['glass']);
		const de = createSentence('de', ['Glas'], ['glass']);
		expect(addGlossAlignments([en, de], [], [0, 1])).toEqual([[[0], [0]]]);
	});

	it('merges a new token into an existing group that already overlaps it', () => {
		const en = createSentence('en', ['the', 'cat'], ['the', 'cat']);
		const ja = createSentence('ja', ['猫'], ['cat']);
		// Existing group already holds s0 tok1 ("cat"); the new s1 "cat" joins it.
		expect(addGlossAlignments([en, ja], [[[1], []]], [1])).toEqual([[[1], [0]]]);
	});

	it('attaches a new gloss to a group whose glossless source token matches by surface', () => {
		const src = createSentence('en', ['eat'], []); // no gloss, surface "eat"
		const tgt = createSentence('ja', ['食べる'], ['eat']);
		// Group holds the glossless source token; the new "eat" gloss is matched by surface.
		expect(addGlossAlignments([src, tgt], [[[0], []]], [1])).toEqual([[[0], [0]]]);
	});

	it('preserves existing manual groups when no new sentence touches them', () => {
		const a = createSentence('en', ['x'], []);
		const b = createSentence('en', ['y'], []);
		const manual = [[[0], [0]]];
		expect(addGlossAlignments([a, b], manual, [])).toEqual(manual);
	});

	it('does not mutate the input equivalency array', () => {
		const en = createSentence('en', ['cat'], ['cat']);
		const ja = createSentence('ja', ['猫'], ['cat']);
		const existing = [[[0], []]];
		const snapshot = JSON.stringify(existing);
		addGlossAlignments([en, ja], existing, [1]);
		expect(JSON.stringify(existing)).toBe(snapshot);
	});
});
