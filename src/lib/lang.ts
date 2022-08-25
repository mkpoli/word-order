export const LanguageNames = new Intl.DisplayNames(['en'], {
  type: 'language'
});

export function getLanguageName(code: string): string {
  try {
    return LanguageNames.of(code) ?? code;
  } catch (e) {
    return code;
  }
}