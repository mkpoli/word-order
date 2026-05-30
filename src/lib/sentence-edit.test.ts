import { describe, expect, it } from 'bun:test';
import { remapSentenceConnections } from './sentence-edit';

// remapSentenceConnections re-points the token indices of ONE sentence inside
// the equivalency structure (number[][][]: group -> per-sentence -> token ids)
// after that sentence is re-tokenised, using a character-level LCS diff between
// the previous and next word arrays.

describe('remapSentenceConnections', () => {
	it('leaves connections unchanged when the tokenisation is identical', () => {
		const eq = [
			[[0], [0]],
			[[1], [1]]
		];
		expect(remapSentenceConnections(eq, 0, ['a', 'b'], ['a', 'b'])).toEqual(eq);
	});

	it('maps a split token onto both of its resulting tokens', () => {
		// "ab" (token 0) -> "a","b" (tokens 0 and 1)
		expect(remapSentenceConnections([[[0], [0]]], 0, ['ab'], ['a', 'b'])).toEqual([[[0, 1], [0]]]);
	});

	it('maps two merged tokens onto the single resulting token', () => {
		// "a","b" -> "ab": both old tokens now point at token 0
		expect(
			remapSentenceConnections(
				[
					[[0], []],
					[[1], []]
				],
				0,
				['a', 'b'],
				['ab']
			)
		).toEqual([
			[[0], []],
			[[0], []]
		]);
	});

	it('drops a connection to a token that was deleted', () => {
		// "a","b","c" -> "a","c": the middle token (index 1) has no LCS image
		expect(remapSentenceConnections([[[1], []]], 0, ['a', 'b', 'c'], ['a', 'c'])).toEqual([[[], []]]);
	});

	it('renumbers surviving tokens after a deletion', () => {
		// token 0 ("a") stays 0; token 2 ("c") shifts to index 1
		expect(
			remapSentenceConnections(
				[
					[[0], []],
					[[2], []]
				],
				0,
				['a', 'b', 'c'],
				['a', 'c']
			)
		).toEqual([
			[[0], []],
			[[1], []]
		]);
	});

	it('only touches the edited sentence, leaving other sentences in the group intact', () => {
		// Editing sentence 0; sentence 1's token list ([5]) is preserved verbatim.
		expect(remapSentenceConnections([[[0], [5]]], 0, ['a'], ['a', 'b'])).toEqual([[[0], [5]]]);
	});

	it('de-duplicates when several old tokens collapse onto the same new token', () => {
		// "a","b" both map into the merged "ab" within one entry -> single [0], not [0,0]
		expect(remapSentenceConnections([[[0, 1], []]], 0, ['a', 'b'], ['ab'])).toEqual([[[0], []]]);
	});
});
