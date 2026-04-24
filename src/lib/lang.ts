import type { Locales } from '$i18n/i18n-types';

const languageNames: Record<string, Intl.DisplayNames> = {};

const options: Intl.DisplayNamesOptions = {
	type: 'language'
};

export function getLanguageNames(locale: string): Intl.DisplayNames {
	return languageNames[locale] ?? (languageNames[locale] = new Intl.DisplayNames([locale], options));
}

export function getLanguageName(code: string, locale: string): string {
	if (!locale) return code;
	if (!code) return '';
	const languageNames = getLanguageNames(locale);
	try {
		return languageNames.of(code) ?? code;
	} catch (e) {
		return code;
	}
}

export type LocaleOption = {
	value: Locales;
	endonym: string;
	iso639: string;
	tag: string;
};

export function getLocaleDisplayCode(option: Pick<LocaleOption, 'iso639' | 'tag'>): string {
	return option.tag.toLowerCase() === option.iso639.toLowerCase() ? option.iso639.toUpperCase() : option.tag.toUpperCase();
}

const LOCALE_OPTIONS: LocaleOption[] = [
	{ value: 'en', endonym: 'English', iso639: 'en', tag: 'en' },
	{ value: 'fr', endonym: 'Français', iso639: 'fr', tag: 'fr' },
	{ value: 'ja', endonym: '日本語', iso639: 'ja', tag: 'ja' },
	{ value: 'ko', endonym: '한국어', iso639: 'ko', tag: 'ko' },
	{ value: 'zh-HanS', endonym: '简体中文', iso639: 'zh', tag: 'zh-Hans' },
	{ value: 'zh-HanT', endonym: '繁體中文', iso639: 'zh', tag: 'zh-Hant' }
];

export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
	return locale === 'ar' ? 'rtl' : 'ltr';
}

export function getLocaleOptions(displayLocale: string): (LocaleOption & { exonym: string })[] {
	return LOCALE_OPTIONS.map((option) => ({
		...option,
		exonym: getLanguageName(option.tag, displayLocale)
	}));
}

export function getLocaleOption(locale: Locales, displayLocale = locale): LocaleOption & { exonym: string } {
	const option = LOCALE_OPTIONS.find((entry) => entry.value === locale) ?? LOCALE_OPTIONS[0];
	return {
		...option,
		exonym: getLanguageName(option.tag, displayLocale)
	};
}
