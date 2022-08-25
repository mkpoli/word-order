const languageNames: Record<string, Intl.DisplayNames> = {}

const options = {
  type: 'language',
} as Intl.DisplayNamesOptions

export function getLanguageNames(locale: string): Intl.DisplayNames {
  return languageNames[locale] ?? ((languageNames[locale] = new Intl.DisplayNames([locale], options)))
}

export function getLanguageName(code: string, locale: string): string {
  if (!locale) return code
  const languageNames = getLanguageNames(locale)
  try {
    return languageNames.of(code) ?? code;
  } catch (e) {
    return code;
  }
}
