import type { Locales } from '$i18n/i18n-types';
import type { LayoutServerLoad } from './$types';
import { detectLocaleAliased } from '$i18n/alias';

export const load: LayoutServerLoad<{ locale: Locales }> = ({ request: { headers } }) => {
	const locale = detectLocaleAliased(headers.get('accept-language'));

	return {
		locale
	};
};
