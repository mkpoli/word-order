import { describe, expect, it } from 'bun:test';
import { parseRuby, rubyRule } from './ruby';

describe('parseRuby', () => {
	it('splits base text and reading from a well-formed ruby tag', () => {
		expect(parseRuby('<ruby>漢<rt>かん</rt></ruby>')).toEqual({ rb: '漢', rt: 'かん' });
	});

	it('handles multi-character base and reading', () => {
		expect(parseRuby('<ruby>東京<rt>とうきょう</rt></ruby>')).toEqual({ rb: '東京', rt: 'とうきょう' });
	});

	it('tolerates a missing closing </rt> tag', () => {
		// The regex makes the closing </rt> optional: ...(?:<\/rt>)*...
		expect(parseRuby('<ruby>漢<rt>かん</ruby>')).toEqual({ rb: '漢', rt: 'かん' });
	});

	it('returns the warning sentinel for non-ruby input', () => {
		expect(parseRuby('plain text')).toEqual({ rb: '⚠', rt: '⚠' });
	});

	it('returns the warning sentinel for an empty string', () => {
		expect(parseRuby('')).toEqual({ rb: '⚠', rt: '⚠' });
	});

	it('returns the warning sentinel when the base or reading is empty', () => {
		// [^<]+ requires at least one character in each slot.
		expect(parseRuby('<ruby><rt>かん</rt></ruby>')).toEqual({ rb: '⚠', rt: '⚠' });
		expect(parseRuby('<ruby>漢<rt></rt></ruby>')).toEqual({ rb: '⚠', rt: '⚠' });
	});
});

describe('rubyRule', () => {
	it('matches a ruby tag anywhere in the string', () => {
		expect(rubyRule.test('foo <ruby>漢<rt>かん</rt></ruby> bar')).toBe(true);
	});

	it('does not match plain text', () => {
		expect(rubyRule.test('no ruby here')).toBe(false);
	});

	it('captures the ruby tag when used to split', () => {
		// The capturing group keeps the delimiter in String.prototype.split output.
		expect('a<ruby>x<rt>y</rt></ruby>b'.split(rubyRule)).toEqual(['a', '<ruby>x<rt>y</rt></ruby>', 'b']);
	});
});
