import type { Locales } from '$i18n/i18n-types';
import { initAcceptLanguageHeaderDetector } from 'typesafe-i18n/detectors';
import type { LayoutServerLoad } from './$types';
import { detectLocaleAliased } from '$i18n/alias';

export const load: LayoutServerLoad<{ locale: Locales }> = ({ request: { headers } }) => {
	const acceptLanguageDetector = initAcceptLanguageHeaderDetector({ headers });
	const locale = detectLocaleAliased(acceptLanguageDetector);

	return {
		locale
	};
};
