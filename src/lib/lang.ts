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
	{ value: 'es', endonym: 'Español', iso639: 'es', tag: 'es' },
	{ value: 'id', endonym: 'Bahasa Indonesia', iso639: 'id', tag: 'id' },
	{ value: 'fr', endonym: 'Français', iso639: 'fr', tag: 'fr' },
	{ value: 'de', endonym: 'Deutsch', iso639: 'de', tag: 'de' },
	{ value: 'it', endonym: 'Italiano', iso639: 'it', tag: 'it' },
	{ value: 'nl', endonym: 'Nederlands', iso639: 'nl', tag: 'nl' },
	{ value: 'pl', endonym: 'Polski', iso639: 'pl', tag: 'pl' },
	{ value: 'pt', endonym: 'Português', iso639: 'pt', tag: 'pt' },
	{ value: 'tr', endonym: 'Türkçe', iso639: 'tr', tag: 'tr' },
	{ value: 'vi', endonym: 'Tiếng Việt', iso639: 'vi', tag: 'vi' },
	{ value: 'uk', endonym: 'Українська', iso639: 'uk', tag: 'uk' },
	{ value: 'ru', endonym: 'Русский', iso639: 'ru', tag: 'ru' },
	{ value: 'ar', endonym: 'العربية', iso639: 'ar', tag: 'ar' },
	{ value: 'fa', endonym: 'فارسی', iso639: 'fa', tag: 'fa' },
	{ value: 'ur', endonym: 'اردو', iso639: 'ur', tag: 'ur' },
	{ value: 'bn', endonym: 'বাংলা', iso639: 'bn', tag: 'bn' },
	{ value: 'ain', endonym: 'アイヌ イタㇰ', iso639: 'ain', tag: 'ain' },
	{ value: 'hi', endonym: 'हिन्दी', iso639: 'hi', tag: 'hi' },
	{ value: 'th', endonym: 'ไทย', iso639: 'th', tag: 'th' },
	{ value: 'grc', endonym: 'Ἑλληνική', iso639: 'grc', tag: 'grc' },
	{ value: 'eo', endonym: 'Esperanto', iso639: 'eo', tag: 'eo' },
	{ value: 'ia', endonym: 'Interlingua', iso639: 'ia', tag: 'ia' },
	{ value: 'la', endonym: 'Lingua Latina', iso639: 'la', tag: 'la' },
	{ value: 'tok', endonym: 'toki pona', iso639: 'tok', tag: 'tok' },
	{ value: 'ja', endonym: '日本語', iso639: 'ja', tag: 'ja' },
	{ value: 'ja-Hira', endonym: 'やさしい日本語', iso639: 'ja', tag: 'ja-Hira' },
	{ value: 'ko', endonym: '한국어', iso639: 'ko', tag: 'ko' },
	{ value: 'ko-Kore', endonym: '韓國語 (國漢文混用)', iso639: 'ko', tag: 'ko-Kore' },
	{ value: 'zh-HanS', endonym: '简体中文', iso639: 'zh', tag: 'zh-Hans' },
	{ value: 'zh-HanT', endonym: '繁體中文', iso639: 'zh', tag: 'zh-Hant' }
];

export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
	return ['ar', 'fa', 'ur'].includes(locale) ? 'rtl' : 'ltr';
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
