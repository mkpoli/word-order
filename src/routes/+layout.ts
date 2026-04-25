import type { Locales } from '$i18n/i18n-types';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad<{ locale: Locales }> = ({ data: { locale } }) => {
	return {
		locale
	};
};
