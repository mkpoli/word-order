import type { Locales } from './i18n-types';

const baseLocale: Locales = 'en';
const locales = [
	'ain',
	'ar',
	'bn',
	'de',
	'en',
	'eo',
	'es',
	'fa',
	'fr',
	'grc',
	'hi',
	'ia',
	'id',
	'it',
	'ja',
	'ja-Hira',
	'ko',
	'ko-Kore',
	'la',
	'nl',
	'pl',
	'pt',
	'ru',
	'th',
	'tok',
	'tr',
	'uk',
	'vi',
	'zh-HanS',
	'zh-HanT'
] satisfies Locales[];

export const LOCALE_ALIAS = new Map<string, Locales>([
	['zh-CN', 'zh-HanS'],
	['zh-SG', 'zh-HanS'],
	['zh-TW', 'zh-HanT'],
	['zh-HK', 'zh-HanT'],
	['zh-MO', 'zh-HanT'],
	['zh', 'zh-HanS'],
	['ja-Hrkt', 'ja-Hira'],
	['ja-Kana', 'ja-Hira'],
	['ko-Hani', 'ko-Kore'],
	['ko-Hant', 'ko-Kore']
]);

export function getAliasedLocale(locale: string): Locales {
	const normalizedLocale = locale.trim();
	const baseLanguage = normalizedLocale.split('-')[0];
	const aliasedLocale = (LOCALE_ALIAS.get(normalizedLocale) ?? LOCALE_ALIAS.get(baseLanguage) ?? baseLanguage) as Locales;
	return locales.includes(aliasedLocale) ? aliasedLocale : baseLocale;
}

export function getAllLocales(): string[] {
	return [...locales, ...LOCALE_ALIAS.keys()];
}

export function detectLocaleAliased(acceptLanguage: string | null): Locales {
	const candidates =
		acceptLanguage
			?.split(',')
			.map((part) => part.split(';')[0]?.trim())
			.filter(Boolean) ?? [];
	for (const candidate of candidates) {
		const locale = getAliasedLocale(candidate);
		if (locale !== baseLocale || candidate.split('-')[0] === baseLocale) return locale;
	}
	return baseLocale;
}
