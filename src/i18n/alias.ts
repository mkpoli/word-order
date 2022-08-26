import { baseLocale, locales } from './i18n-util'
import type { Locales } from "./i18n-types";
import { detectLocale, type LocaleDetector } from 'typesafe-i18n/detectors';

export const LOCALE_ALIAS = new Map<string, Locales>([
  ['zh-CN', 'zh-HanS'],
  ['zh-TW', 'zh-HanT'],
  ['zh-HK', 'zh-HanT'],
  ['zh', 'zh-HanS'],
])

export function getAliasedLocale(locale: string): Locales {
  const aliasedLocale = (LOCALE_ALIAS.get(locale) ?? locale) as Locales
  return locales.includes(aliasedLocale) ? aliasedLocale : baseLocale
}

export function getAllLocales(): string[] {
  return [...locales, ...LOCALE_ALIAS.keys()];
}

export function detectLocaleAliased(detector: LocaleDetector): Locales {
  const locale = detectLocale<Locales>(baseLocale, getAllLocales() as Locales[], detector)
  return getAliasedLocale(locale)
}

