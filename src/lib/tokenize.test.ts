import { describe, expect, it } from 'bun:test';
import { tokenizeSentence } from './tokenize';

describe('tokenizeSentence', () => {
	it('returns no tokens for an empty string', () => {
		expect(tokenizeSentence('', 'en')).toEqual([]);
	});

	it('splits Latin text into words and whitespace segments', () => {
		// Latin word segmentation is stable across ICU versions.
		expect(tokenizeSentence('hello world', 'en')).toEqual(['hello', ' ', 'world']);
	});

	it('keeps punctuation as its own segment', () => {
		expect(tokenizeSentence('the cat.', 'en')).toEqual(['the', ' ', 'cat', '.']);
	});

	it('treats "|" as an explicit boundary and drops it from the output', () => {
		expect(tokenizeSentence('a|b', 'en')).toEqual(['a', 'b']);
		expect(tokenizeSentence('a|b', 'en')).not.toContain('|');
	});

	it('forces a split at "|" even between otherwise-joined runs', () => {
		// Without the pipe the segmenter would keep "onetwo" together.
		expect(tokenizeSentence('one|two three', 'en')).toEqual(['one', 'two', ' ', 'three']);
	});

	it('keeps a ruby tag as a single indivisible token', () => {
		const ruby = '<ruby>漢<rt>かん</rt></ruby>';
		expect(tokenizeSentence(ruby, 'ja')).toEqual([ruby]);
		expect(tokenizeSentence(`${ruby}字`, 'ja')[0]).toBe(ruby);
	});

	it('interleaves ruby tags with surrounding text without splitting them', () => {
		const ruby = '<ruby>漢<rt>かん</rt></ruby>';
		const tokens = tokenizeSentence(`foo ${ruby} bar`, 'en');
		expect(tokens).toContain(ruby);
		// The ruby tag survives intact — none of the other tokens is a fragment of it.
		expect(tokens.filter((t) => t.includes('<ruby>'))).toEqual([ruby]);
	});

	it('reconstructs the original text (minus pipes) when tokens are rejoined', () => {
		// Word boundaries for CJK depend on the ICU version, so assert the
		// invariant that holds regardless: concatenation is lossless except for
		// the explicit "|" boundary markers, which are consumed.
		for (const [text, lang] of [
			['hello world', 'en'],
			['the cat.', 'en'],
			['猫が魚を食べる', 'ja'],
			['one|two three', 'en']
		] as const) {
			expect(tokenizeSentence(text, lang).join('')).toBe(text.replace(/\|/g, ''));
		}
	});

	it('produces only non-empty tokens and never emits a bare "|"', () => {
		const tokens = tokenizeSentence('猫が|魚を 食べる', 'ja');
		expect(tokens.every((t) => t.length > 0)).toBe(true);
		expect(tokens).not.toContain('|');
	});

	it('segments CJK text into multiple tokens', () => {
		// Exact boundaries are ICU-dependent; just assert segmentation happened.
		expect(tokenizeSentence('猫が魚を食べる', 'ja').length).toBeGreaterThan(1);
	});
});
