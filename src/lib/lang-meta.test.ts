import { expect, test, describe } from 'bun:test';
import { getLangMeta, LANG_META } from './lang-meta';

describe('getLangMeta', () => {
	test('returns metadata for exact-match codes', () => {
		expect(getLangMeta('en')?.typology).toBe('SVO');
		expect(getLangMeta('ja')?.typology).toBe('SOV');
		expect(getLangMeta('ar')?.typology).toBe('VSO');
	});

	test('returns null for unknown codes with no parent', () => {
		expect(getLangMeta('xyz')).toBeNull();
	});

	test('strips region subtags down to base language', () => {
		expect(getLangMeta('en-US')?.family[0]).toBe('Indo-European');
		expect(getLangMeta('de-CH')?.family[0]).toBe('Indo-European');
	});

	test('keeps specific script/variant tags when present', () => {
		expect(getLangMeta('ja-Hira')?.script).toBe('Hiragana only');
		expect(getLangMeta('ja')?.script).toBe('Kanji + Kana');
		expect(getLangMeta('ko-Kore')?.script).toBe('Hanja + Hangul');
		expect(getLangMeta('ko')?.script).toBe('Hangul');
	});

	test('every entry has all required fields', () => {
		for (const [code, meta] of Object.entries(LANG_META)) {
			expect(meta.family.length, `${code} has empty family`).toBeGreaterThan(0);
			expect(meta.typology, `${code} missing typology`).toBeTruthy();
			expect(meta.morphology, `${code} missing morphology`).toBeTruthy();
			expect(meta.script, `${code} missing script`).toBeTruthy();
			expect(meta.speakers, `${code} missing speakers`).toBeTruthy();
		}
	});

	test('covers the locales we ship UI translations for', () => {
		const uiLocales = [
			'en',
			'ja',
			'ko',
			'zh-HanS',
			'zh-HanT',
			'de',
			'fr',
			'es',
			'it',
			'pt',
			'ru',
			'ar',
			'hi',
			'bn',
			'fa',
			'tr',
			'vi',
			'id',
			'th',
			'nl',
			'pl',
			'uk',
			'fi',
			'bg',
			'eo',
			'la',
			'grc',
			'ain',
			'tok',
			'ia',
			'ja-Hira',
			'ko-Kore'
		];
		for (const code of uiLocales) {
			expect(getLangMeta(code), `${code} has no metadata`).not.toBeNull();
		}
	});
});
