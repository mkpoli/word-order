import { baseLocale, locales } from './i18n-util';
import type { Locales } from './i18n-types';
import { detectLocale, type LocaleDetector } from 'typesafe-i18n/detectors';

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

export function detectLocaleAliased(detector: LocaleDetector): Locales {
	const locale = detectLocale(baseLocale, getAllLocales(), detector);
	return getAliasedLocale(locale);
}
