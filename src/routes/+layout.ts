import type { Locales } from '$i18n/i18n-types';
import { loadLocaleAsync } from '$i18n/i18n-util.async';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad<{ locale: Locales }> = async ({ data }) => {
  const locale = (data as unknown as {
    locale: Locales
  }).locale;

  await loadLocaleAsync(locale);
  return {
    locale
  };
};