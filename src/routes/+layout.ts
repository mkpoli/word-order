import type { Locales } from '$i18n/i18n-types';
import { loadLocaleAsync } from '$i18n/i18n-util.async';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad<{ locale: Locales }> = async ({ data }) => {
  let locale = null
  if (data && (data as { locale: Locales }).locale) {
    locale = (data as { locale: Locales }).locale
    await loadLocaleAsync(locale);
  }

  return {
    locale
  };
};