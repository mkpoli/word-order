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
