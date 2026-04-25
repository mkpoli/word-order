import type { Handle } from '@sveltejs/kit';
import { detectLocaleAliased } from '$i18n/alias';
import { getLocaleDirection } from '$lib/lang';

export const handle: Handle = ({ event, resolve }) => {
	const locale = detectLocaleAliased(event.request.headers.get('accept-language'));

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale).replace('%dir%', getLocaleDirection(locale))
	});
};
